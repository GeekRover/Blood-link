import BloodRequest from '../models/BloodRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { REQUEST_STATUS, NOTIFICATION_TYPES } from '../config/constants.js';

/**
 * Detect unmatched blood requests that need fallback assistance
 * @param {Number} hoursThreshold - Hours after which a request is considered unmatched
 * @returns {Array} Array of unmatched requests
 */
export const detectUnmatchedRequests = async (hoursThreshold = 6) => {
  const thresholdDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

  const unmatchedRequests = await BloodRequest.find({
    status: REQUEST_STATUS.PENDING,
    createdAt: { $lte: thresholdDate },
    $or: [
      { matchedDonors: { $size: 0 } },
      { 'matchedDonors.response': { $ne: 'accepted' } }
    ],
    requiredBy: { $gte: new Date() } // Not expired yet
  }).populate('recipient', 'name email phone');

  return unmatchedRequests;
};

/**
 * Suggest radius expansion for a blood request
 * @param {String} requestId - Blood request ID
 * @param {Number} newRadius - New search radius in km
 * @returns {Object} Updated request with expansion details
 */
export const suggestRadiusExpansion = async (requestId, newRadius = 100) => {
  const request = await BloodRequest.findById(requestId).populate('recipient', 'name email phone');

  if (!request) {
    throw new Error('Blood request not found');
  }

  if (request.status !== REQUEST_STATUS.PENDING) {
    throw new Error('Can only expand radius for pending requests');
  }

  // Update search radius
  request.searchRadius = newRadius;
  request.radiusExpanded = true;
  request.fallbackAttempts += 1;
  request.lastFallbackAttempt = new Date();

  await request.save();

  // Create notification for recipient
  await Notification.createNotification(
    request.recipient._id,
    NOTIFICATION_TYPES.SYSTEM,
    'Search Radius Expanded',
    `We've expanded the search radius to ${newRadius}km to help find donors for your blood request. You'll be notified if we find any matches.`,
    {
      requestId: request._id,
      newRadius,
      bloodType: request.bloodType,
      expandedAt: new Date()
    }
  );

  return request;
};

/**
 * Find and notify unavailable donors about a critical request
 * @param {String} requestId - Blood request ID
 * @returns {Object} Notification results
 */
export const notifyUnavailableDonors = async (requestId) => {
  const request = await BloodRequest.findById(requestId);

  if (!request) {
    throw new Error('Blood request not found');
  }

  // Find compatible but unavailable donors within expanded radius
  const compatibleDonors = await findCompatibleDonors(request.bloodType);

  const unavailableDonors = await User.find({
    _id: { $in: compatibleDonors },
    role: 'donor',
    isAvailable: false,
    verificationStatus: 'verified',
    isActive: true,
    location: {
      $near: {
        $geometry: request.hospital.location,
        $maxDistance: request.searchRadius * 1000 // Convert km to meters
      }
    }
  }).select('_id name email phone bloodType');

  // Create notifications for unavailable donors
  const notificationPromises = unavailableDonors.map(donor =>
    Notification.createNotification(
      donor._id,
      NOTIFICATION_TYPES.SYSTEM,
      'Critical Blood Request - Your Help Needed',
      `A ${request.urgency === 'critical' ? 'CRITICAL' : 'urgent'} blood request for ${request.bloodType} is pending. Even if you're unavailable, you might know someone who can help. Hospital: ${request.hospital.name}`,
      {
        requestId: request._id,
        bloodType: request.bloodType,
        urgency: request.urgency,
        hospital: request.hospital.name,
        requiredBy: request.requiredBy
      }
    )
  );

  await Promise.all(notificationPromises);

  return {
    notified: unavailableDonors.length,
    donors: unavailableDonors
  };
};

/**
 * Suggest nearby blood banks and hospitals
 * @param {String} requestId - Blood request ID
 * @returns {Object} Request with suggested facilities
 */
export const suggestNearbyFacilities = async (requestId) => {
  const request = await BloodRequest.findById(requestId);

  if (!request) {
    throw new Error('Blood request not found');
  }

  // Mock facility data - In production, this would query a real database
  const mockFacilities = [
    {
      facilityType: 'blood_bank',
      name: 'Central Blood Bank',
      address: 'Dhaka Medical College, Dhaka',
      contactNumber: '+880-2-9668690',
      distance: 5.2,
      suggestedAt: new Date()
    },
    {
      facilityType: 'hospital',
      name: 'Dhaka Medical College Hospital',
      address: 'Secretariat Road, Dhaka',
      contactNumber: '+880-2-8626812',
      distance: 5.5,
      suggestedAt: new Date()
    },
    {
      facilityType: 'blood_bank',
      name: 'Sandhani Blood Bank',
      address: 'Dhaka University, Dhaka',
      contactNumber: '+880-2-9661900',
      distance: 7.8,
      suggestedAt: new Date()
    }
  ];

  // Add facilities to request
  request.nearbyFacilities = mockFacilities;
  await request.save();

  // Notify recipient about nearby facilities
  await Notification.createNotification(
    request.recipient,
    NOTIFICATION_TYPES.SYSTEM,
    'Nearby Blood Facilities Found',
    `We found ${mockFacilities.length} nearby blood banks and hospitals that might be able to help. Check your request details for contact information.`,
    {
      requestId: request._id,
      facilitiesCount: mockFacilities.length,
      facilities: mockFacilities
    }
  );

  return request;
};

/**
 * Notify admin about critical unmatched request
 * @param {String} requestId - Blood request ID
 * @returns {Object} Notification result
 */
export const notifyAdminCritical = async (requestId) => {
  const request = await BloodRequest.findById(requestId).populate('recipient', 'name email phone');

  if (!request) {
    throw new Error('Blood request not found');
  }

  // Find all admin users
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');

  // Create notifications for all admins
  const notificationPromises = admins.map(admin =>
    Notification.createNotification(
      admin._id,
      NOTIFICATION_TYPES.SYSTEM,
      'Critical Unmatched Blood Request',
      `URGENT: Blood request for ${request.bloodType} (${request.unitsRequired} units) has no matches. Patient: ${request.patientName}, Hospital: ${request.hospital.name}, Required by: ${request.requiredBy.toLocaleString()}`,
      {
        requestId: request._id,
        bloodType: request.bloodType,
        urgency: request.urgency,
        unitsRequired: request.unitsRequired,
        hospital: request.hospital.name,
        requiredBy: request.requiredBy,
        recipientName: request.recipient.name,
        recipientPhone: request.recipient.phone,
        priority: 'critical'
      }
    )
  );

  await Promise.all(notificationPromises);

  // Update request
  request.adminNotified = true;
  request.adminNotifiedAt = new Date();
  await request.save();

  return {
    notified: admins.length,
    admins
  };
};

/**
 * Process fallback for a single request
 * @param {String} requestId - Blood request ID
 * @returns {Object} Fallback processing result
 */
export const processFallback = async (requestId) => {
  const request = await BloodRequest.findById(requestId);

  if (!request) {
    throw new Error('Blood request not found');
  }

  const results = {
    requestId,
    actions: []
  };

  // Step 1: Expand radius if not already expanded
  if (!request.radiusExpanded) {
    await suggestRadiusExpansion(requestId, 100);
    results.actions.push('radius_expanded');
  }

  // Step 2: Notify unavailable donors for critical/urgent requests
  if (request.urgency === 'critical' || request.urgency === 'urgent') {
    const notifyResult = await notifyUnavailableDonors(requestId);
    results.actions.push(`notified_${notifyResult.notified}_unavailable_donors`);
  }

  // Step 3: Suggest nearby facilities
  await suggestNearbyFacilities(requestId);
  results.actions.push('facilities_suggested');

  // Step 4: Notify admin for critical requests that still have no matches
  if (request.urgency === 'critical' && !request.adminNotified) {
    await notifyAdminCritical(requestId);
    results.actions.push('admin_notified');
  }

  return results;
};

/**
 * Run fallback system for all unmatched requests
 * @param {Number} hoursThreshold - Hours threshold for detecting unmatched requests
 * @returns {Object} Processing results
 */
export const runFallbackSystem = async (hoursThreshold = 6) => {
  const unmatchedRequests = await detectUnmatchedRequests(hoursThreshold);

  const results = {
    totalProcessed: unmatchedRequests.length,
    successful: 0,
    failed: 0,
    details: []
  };

  for (const request of unmatchedRequests) {
    try {
      const result = await processFallback(request._id);
      results.successful++;
      results.details.push(result);
    } catch (error) {
      results.failed++;
      results.details.push({
        requestId: request._id,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Helper function to find compatible blood types
 * @param {String} bloodType - Required blood type
 * @returns {Array} Array of compatible blood types
 */
const findCompatibleDonors = (bloodType) => {
  const compatibility = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
  };

  return compatibility[bloodType] || [];
};

export default {
  detectUnmatchedRequests,
  suggestRadiusExpansion,
  notifyUnavailableDonors,
  suggestNearbyFacilities,
  notifyAdminCritical,
  processFallback,
  runFallbackSystem
};
