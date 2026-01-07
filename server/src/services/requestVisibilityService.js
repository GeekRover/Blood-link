/**
 * Request Visibility Service
 * Handles visibility controls for blood requests to donors
 *
 * Visibility Rules:
 * 1. Blood type compatibility - donor must be able to donate to requested blood type
 * 2. Distance filtering - requests must be within donor's availability radius
 * 3. Critical/urgent requests bypass radius filter (but still require blood compatibility)
 * 4. Already matched donors can always see requests they're matched to
 */

import BloodRequest from '../models/BloodRequest.js';
import DonorProfile from '../models/DonorProfile.js';
import { checkCompatibility } from './matchingService.js';
import { checkDonationEligibility } from './frequencyChecker.js';
import { REQUEST_STATUS, REQUEST_URGENCY, DEFAULT_SEARCH_RADIUS_KM } from '../config/constants.js';

/**
 * Blood type compatibility matrix
 * Defines which blood types can donate to which recipients
 * Key = donor blood type, Value = array of recipient blood types they can donate to
 */
const COMPATIBILITY_MATRIX = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

/**
 * Get blood types that a donor can donate to
 * @param {string} donorBloodType - Donor's blood type
 * @returns {Array} - Array of compatible recipient blood types
 */
export const getCompatibleRecipientTypes = (donorBloodType) => {
  return COMPATIBILITY_MATRIX[donorBloodType] || [];
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Array} coord1 - [longitude, latitude]
 * @param {Array} coord2 - [longitude, latitude]
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) {
    return Infinity;
  }

  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Check if a request is visible to a specific donor
 * @param {Object} request - Blood request object
 * @param {Object} donor - Donor profile object
 * @param {Object} options - Additional options
 * @returns {Object} - { visible: boolean, reason: string, distance: number }
 */
export const checkRequestVisibility = (request, donor, options = {}) => {
  const { bypassRadiusForCritical = true } = options;

  // Check if donor is already matched to this request
  const isAlreadyMatched = request.matchedDonors?.some(
    m => m.donor?.toString() === donor._id?.toString()
  );

  if (isAlreadyMatched) {
    return {
      visible: true,
      reason: 'already_matched',
      distance: null
    };
  }

  // Check blood type compatibility
  const compatibleTypes = getCompatibleRecipientTypes(donor.bloodType);
  const isBloodCompatible = compatibleTypes.includes(request.bloodType);

  if (!isBloodCompatible) {
    return {
      visible: false,
      reason: 'blood_type_incompatible',
      distance: null
    };
  }

  // Calculate distance if both locations are available
  let distance = null;
  if (donor.location?.coordinates && request.hospital?.location?.coordinates) {
    distance = calculateDistance(
      donor.location.coordinates,
      request.hospital.location.coordinates
    );
  }

  // Check if request is critical or urgent
  const isCriticalOrUrgent =
    request.urgency === REQUEST_URGENCY.CRITICAL ||
    request.urgency === REQUEST_URGENCY.URGENT;

  // Get donor's availability radius (default to 50km if not set)
  const donorRadius = donor.availabilityRadius || DEFAULT_SEARCH_RADIUS_KM;

  // Check if within radius
  if (distance !== null) {
    const isWithinRadius = distance <= donorRadius;

    if (!isWithinRadius) {
      // Critical/urgent requests bypass radius filter
      if (bypassRadiusForCritical && isCriticalOrUrgent) {
        return {
          visible: true,
          reason: 'critical_urgent_bypass',
          distance: Math.round(distance * 10) / 10
        };
      }

      return {
        visible: false,
        reason: 'outside_radius',
        distance: Math.round(distance * 10) / 10
      };
    }
  }

  return {
    visible: true,
    reason: 'within_criteria',
    distance: distance !== null ? Math.round(distance * 10) / 10 : null
  };
};

/**
 * Get all visible requests for a donor
 * @param {string} donorId - Donor's user ID
 * @param {Object} filters - Additional query filters
 * @param {Object} options - Pagination and other options
 * @returns {Promise<Object>} - { requests: Array, total: number, visibility: Object }
 */
export const getVisibleRequestsForDonor = async (donorId, filters = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    includeInvisible = false, // For debugging/admin purposes
    sortBy = 'urgency' // 'urgency', 'distance', 'createdAt'
  } = options;

  try {
    // Get donor profile with location
    const donor = await DonorProfile.findById(donorId).lean();

    if (!donor) {
      throw new Error('Donor not found');
    }

    // Check donor's overall eligibility
    const eligibility = await checkDonationEligibility(donorId);

    // Build base query - only show active, non-expired requests
    const query = {
      status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.MATCHED] },
      requiredBy: { $gte: new Date() },
      ...filters
    };

    // Get compatible blood types for this donor
    const compatibleTypes = getCompatibleRecipientTypes(donor.bloodType);

    // Filter by compatible blood types
    query.bloodType = { $in: compatibleTypes };

    // If donor has location, use geospatial query for efficiency
    // But we'll still filter manually for critical/urgent bypass
    const baseRequests = await BloodRequest.find(query)
      .populate('recipient', 'name phone')
      .lean();

    // Apply visibility filtering
    const visibilityResults = baseRequests.map(request => {
      const visibility = checkRequestVisibility(request, donor);
      return {
        request,
        ...visibility
      };
    });

    // Filter visible requests
    let visibleRequests = visibilityResults
      .filter(r => r.visible)
      .map(r => ({
        ...r.request,
        _visibility: {
          reason: r.reason,
          distance: r.distance
        }
      }));

    // Sort requests
    visibleRequests = sortRequests(visibleRequests, sortBy);

    // Calculate pagination
    const total = visibleRequests.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedRequests = visibleRequests.slice(startIndex, startIndex + limit);

    // Build visibility summary
    const visibilitySummary = {
      total: baseRequests.length,
      visible: visibilityResults.filter(r => r.visible).length,
      hidden: {
        bloodTypeIncompatible: visibilityResults.filter(r => r.reason === 'blood_type_incompatible').length,
        outsideRadius: visibilityResults.filter(r => r.reason === 'outside_radius').length
      },
      criticalBypass: visibilityResults.filter(r => r.reason === 'critical_urgent_bypass').length,
      alreadyMatched: visibilityResults.filter(r => r.reason === 'already_matched').length
    };

    return {
      requests: paginatedRequests,
      total,
      totalPages,
      currentPage: page,
      donorEligibility: eligibility,
      donorBloodType: donor.bloodType,
      donorRadius: donor.availabilityRadius || DEFAULT_SEARCH_RADIUS_KM,
      compatibleBloodTypes: compatibleTypes,
      visibility: visibilitySummary
    };
  } catch (error) {
    console.error('Error getting visible requests for donor:', error);
    throw error;
  }
};

/**
 * Sort requests based on specified criteria
 * @param {Array} requests - Array of request objects
 * @param {string} sortBy - Sort criteria
 * @returns {Array} - Sorted requests
 */
const sortRequests = (requests, sortBy) => {
  const urgencyOrder = {
    [REQUEST_URGENCY.CRITICAL]: 0,
    [REQUEST_URGENCY.URGENT]: 1,
    [REQUEST_URGENCY.NORMAL]: 2
  };

  switch (sortBy) {
    case 'urgency':
      return requests.sort((a, b) => {
        // First by urgency
        const urgencyDiff = (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2);
        if (urgencyDiff !== 0) return urgencyDiff;
        // Then by required date
        return new Date(a.requiredBy) - new Date(b.requiredBy);
      });

    case 'distance':
      return requests.sort((a, b) => {
        const distA = a._visibility?.distance ?? Infinity;
        const distB = b._visibility?.distance ?? Infinity;
        return distA - distB;
      });

    case 'createdAt':
      return requests.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    default:
      return requests;
  }
};

/**
 * Check if a specific request is visible to a donor
 * @param {string} requestId - Blood request ID
 * @param {string} donorId - Donor user ID
 * @returns {Promise<Object>} - Visibility result with request data
 */
export const checkSingleRequestVisibility = async (requestId, donorId) => {
  try {
    const [request, donor] = await Promise.all([
      BloodRequest.findById(requestId)
        .populate('recipient', 'name phone')
        .lean(),
      DonorProfile.findById(donorId).lean()
    ]);

    if (!request) {
      return { visible: false, reason: 'request_not_found', request: null };
    }

    if (!donor) {
      return { visible: false, reason: 'donor_not_found', request: null };
    }

    const visibility = checkRequestVisibility(request, donor);

    return {
      ...visibility,
      request: visibility.visible ? request : null
    };
  } catch (error) {
    console.error('Error checking single request visibility:', error);
    throw error;
  }
};

/**
 * Get visibility statistics for admin dashboard
 * @returns {Promise<Object>} - Visibility statistics
 */
export const getVisibilityStatistics = async () => {
  try {
    const activeRequests = await BloodRequest.countDocuments({
      status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.MATCHED] },
      requiredBy: { $gte: new Date() }
    });

    const criticalRequests = await BloodRequest.countDocuments({
      status: REQUEST_STATUS.PENDING,
      urgency: REQUEST_URGENCY.CRITICAL,
      requiredBy: { $gte: new Date() }
    });

    const urgentRequests = await BloodRequest.countDocuments({
      status: REQUEST_STATUS.PENDING,
      urgency: REQUEST_URGENCY.URGENT,
      requiredBy: { $gte: new Date() }
    });

    const activeDonors = await DonorProfile.countDocuments({
      isActive: true,
      isAvailable: true,
      verificationStatus: 'verified'
    });

    return {
      activeRequests,
      criticalRequests,
      urgentRequests,
      activeDonors,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error getting visibility statistics:', error);
    throw error;
  }
};

export default {
  checkRequestVisibility,
  getVisibleRequestsForDonor,
  checkSingleRequestVisibility,
  getCompatibleRecipientTypes,
  getVisibilityStatistics
};
