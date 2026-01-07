import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';
import DonorProfile from '../models/DonorProfile.js';
import Chat from '../models/Chat.js';
import { findCompatibleDonors } from '../services/matchingService.js';
import { notifyDonorAboutRequest } from '../services/smsService.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';
import {
  getVisibleRequestsForDonor,
  checkSingleRequestVisibility,
  getCompatibleRecipientTypes,
  getVisibilityStatistics
} from '../services/requestVisibilityService.js';
import { REQUEST_STATUS } from '../config/constants.js';


/**
* @route   POST /api/requests
* @desc    Create new blood request
* @access  Private (Recipient)
*/
export const createRequest = catchAsync(async (req, res, next) => {
 const {
   patientName,
   bloodType,
   unitsRequired,
   urgency,
   hospital,
   requiredBy,
   medicalReason,
   additionalNotes
 } = req.body;


 const request = await BloodRequest.create({
   recipient: req.user._id,
   patientName,
   bloodType,
   unitsRequired,
   urgency,
   hospital,
   requiredBy,
   medicalReason,
   additionalNotes
 });


 // Find and notify compatible donors
 const donors = await findCompatibleDonors({
   bloodType,
   location: hospital.location,
   urgency,
   limit: 20
 });


 // Notify donors
 const notifications = donors.slice(0, 10).map(donor => ({
   user: donor._id,
   type: 'request_created',
   title: `Urgent: ${bloodType} Blood Needed`,
   message: `${patientName} needs ${unitsRequired} units of ${bloodType} blood at ${hospital.name}`,
   relatedModel: 'BloodRequest',
   relatedId: request._id,
   priority: urgency === 'critical' ? 'urgent' : 'high'
 }));


 await Notification.insertMany(notifications);


 // Send SMS to top donors
 for (const donor of donors.slice(0, 5)) {
   try {
     await notifyDonorAboutRequest(donor, request);
   } catch (error) {
     console.error('SMS notification failed:', error);
   }
 }


 // Update matched donors in request
 request.matchedDonors = donors.slice(0, 10).map(donor => ({
   donor: donor._id,
   notifiedAt: new Date(),
   response: 'pending'
 }));
 await request.save();


 res.status(201).json({
   success: true,
   message: 'Blood request created and donors notified',
   data: request,
   donorsNotified: donors.length
 });
});


/**
* @route   GET /api/requests
* @desc    Get all blood requests (with visibility filtering for donors)
* @access  Private
*/
export const getRequests = catchAsync(async (req, res, next) => {
 const { status, urgency, bloodType, page = 1, limit = 10, sortBy = 'urgency' } = req.query;

 // If user is a donor, use visibility-filtered results
 if (req.user.role === 'donor') {
   const filters = {};
   if (status) filters.status = status;
   if (urgency) filters.urgency = urgency;
   // bloodType filter is handled by visibility service (compatible types)

   const result = await getVisibleRequestsForDonor(
     req.user._id,
     filters,
     {
       page: parseInt(page),
       limit: parseInt(limit),
       sortBy
     }
   );

   return res.status(200).json({
     success: true,
     count: result.requests.length,
     total: result.total,
     totalPages: result.totalPages,
     currentPage: result.currentPage,
     data: result.requests,
     donorInfo: {
       bloodType: result.donorBloodType,
       radius: result.donorRadius,
       compatibleBloodTypes: result.compatibleBloodTypes,
       eligibility: result.donorEligibility
     },
     visibility: result.visibility
   });
 }

 // For recipients and admins, use original logic
 const query = {};
 if (status) query.status = status;
 if (urgency) query.urgency = urgency;
 if (bloodType) query.bloodType = bloodType;

 // If user is recipient, show only their requests
 if (req.user.role === 'recipient') {
   query.recipient = req.user._id;
 }

 const requests = await BloodRequest.find(query)
   .populate('recipient', 'name phone bloodType')
   .populate('matchedDonors.donor', 'name phone bloodType')
   .sort({ createdAt: -1 })
   .limit(limit * 1)
   .skip((page - 1) * limit);

 const count = await BloodRequest.countDocuments(query);

 res.status(200).json({
   success: true,
   count: requests.length,
   totalPages: Math.ceil(count / limit),
   currentPage: page,
   data: requests
 });
});


/**
* @route   GET /api/requests/:id
* @desc    Get single blood request (with visibility check for donors)
* @access  Private
*/
export const getRequestById = catchAsync(async (req, res, next) => {
 // If user is a donor, check visibility first
 if (req.user.role === 'donor') {
   const visibilityResult = await checkSingleRequestVisibility(
     req.params.id,
     req.user._id
   );

   if (!visibilityResult.visible) {
     // Allow donors to see requests they're matched to even if visibility fails
     const request = await BloodRequest.findById(req.params.id);
     const isMatched = request?.matchedDonors?.some(
       m => m.donor?.toString() === req.user._id.toString()
     );

     if (!isMatched) {
       return next(new AppError(
         visibilityResult.reason === 'blood_type_incompatible'
           ? 'This request requires a different blood type'
           : visibilityResult.reason === 'outside_radius'
             ? 'This request is outside your availability radius'
             : 'Blood request not found or not accessible',
         403
       ));
     }
   }
 }

 const request = await BloodRequest.findById(req.params.id)
   .populate('recipient', 'name phone bloodType address')
   .populate('matchedDonors.donor', 'name phone bloodType location')
   .populate('fulfilledBy.donor', 'name phone bloodType');

 if (!request) {
   return next(new AppError('Blood request not found', 404));
 }

 res.status(200).json({
   success: true,
   data: request
 });
});


/**
* @route   PUT /api/requests/:id
* @desc    Update blood request
* @access  Private (Recipient/Admin)
*/
export const updateRequest = catchAsync(async (req, res, next) => {
 let request = await BloodRequest.findById(req.params.id);


 if (!request) {
   return next(new AppError('Blood request not found', 404));
 }


 // Check ownership
 if (
   req.user.role !== 'admin' &&
   request.recipient.toString() !== req.user._id.toString()
 ) {
   return next(new AppError('Not authorized to update this request', 403));
 }


 const allowedFields = ['unitsRequired', 'requiredBy', 'additionalNotes', 'status'];
 const updates = {};
 Object.keys(req.body).forEach(key => {
   if (allowedFields.includes(key)) {
     updates[key] = req.body[key];
   }
 });


 request = await BloodRequest.findByIdAndUpdate(req.params.id, updates, {
   new: true,
   runValidators: true
 });


 res.status(200).json({
   success: true,
   message: 'Request updated successfully',
   data: request
 });
});


/**
* @route   DELETE /api/requests/:id
* @desc    Cancel blood request
* @access  Private (Recipient/Admin)
*/
export const cancelRequest = catchAsync(async (req, res, next) => {
 const request = await BloodRequest.findById(req.params.id);


 if (!request) {
   return next(new AppError('Blood request not found', 404));
 }


 // Check ownership
 if (
   req.user.role !== 'admin' &&
   request.recipient.toString() !== req.user._id.toString()
 ) {
   return next(new AppError('Not authorized to cancel this request', 403));
 }


 request.status = 'cancelled';
 request.cancelledBy = req.user._id;
 request.cancelledAt = new Date();
 request.cancelledReason = req.body.reason || 'Cancelled by user';


 await request.save();


 res.status(200).json({
   success: true,
   message: 'Request cancelled successfully',
   data: request
 });
});


/**
* @route   POST /api/requests/:id/respond
* @desc    Donor responds to blood request
* @access  Private (Donor)
*/
export const respondToRequest = catchAsync(async (req, res, next) => {
 const { response, declineReason } = req.body;

 // Use the request from middleware (already validated for locking)
 const request = req.bloodRequest || await BloodRequest.findById(req.params.id);

 if (!request) {
   return next(new AppError('Blood request not found', 404));
 }

 // Find donor in matchedDonors
 const matchIndex = request.matchedDonors.findIndex(
   m => m.donor.toString() === req.user._id.toString()
 );

 if (matchIndex === -1) {
   return next(new AppError('You are not matched with this request', 400));
 }

 request.matchedDonors[matchIndex].response = response;
 request.matchedDonors[matchIndex].respondedAt = new Date();
 if (declineReason) {
   request.matchedDonors[matchIndex].declineReason = declineReason;
 }

 if (response === 'accepted') {
   request.status = 'matched';
   // Keep the lock until donation is completed or cancelled
   // Lock will be released when request is fulfilled or cancelled

   // Create a chat between donor and recipient
   try {
     console.log(`\n[respondToRequest] Creating chat: Donor=${req.user._id}, Recipient=${request.recipient}, RequestId=${request._id}`);
     const chat = await Chat.findOrCreate(req.user._id, request.recipient, request._id);
     console.log(`[respondToRequest] Chat created/found: ${chat._id}, Participants=[${chat.participants.join(',')}]\n`);
   } catch (chatError) {
     console.error('[respondToRequest] Failed to create chat:', chatError);
     // Don't fail the acceptance if chat creation fails
   }

   // Notify recipient
   await Notification.create({
     user: request.recipient,
     type: 'request_matched',
     title: 'Donor Found!',
     message: `A donor has accepted your blood request for ${request.patientName}`,
     relatedModel: 'BloodRequest',
     relatedId: request._id
   });

   // Notify other matched donors that request is no longer available
   const otherDonors = request.matchedDonors
     .filter(m => m.donor.toString() !== req.user._id.toString() && m.response === 'pending')
     .map(m => m.donor);

   if (otherDonors.length > 0) {
     const notifications = otherDonors.map(donorId => ({
       user: donorId,
       type: 'system',
       title: 'Request No Longer Available',
       message: `The blood request for ${request.bloodType} at ${request.hospital.name} has been accepted by another donor.`,
       relatedModel: 'BloodRequest',
       relatedId: request._id,
       priority: 'low'
     }));

     await Notification.insertMany(notifications);
   }
 } else if (response === 'declined') {
   // Unlock the request so other donors can accept
   request.unlockRequest();
 }

 await request.save();

 res.status(200).json({
   success: true,
   message: `Request ${response} successfully`,
   data: request
 });
});


/**
* @route   GET /api/requests/donor/matched
* @desc    Get all requests the donor is matched to
* @access  Private (Donor)
*/
export const getDonorMatchedRequests = catchAsync(async (req, res, next) => {
 if (req.user.role !== 'donor') {
   return next(new AppError('Only donors can access this endpoint', 403));
 }

 const { status, page = 1, limit = 10 } = req.query;

 const query = {
   'matchedDonors.donor': req.user._id
 };

 if (status) {
   query.status = status;
 }

 const requests = await BloodRequest.find(query)
   .populate('recipient', 'name phone bloodType')
   .sort({ createdAt: -1 })
   .limit(limit * 1)
   .skip((page - 1) * limit);

 const count = await BloodRequest.countDocuments(query);

 // Add donor's response status to each request
 const requestsWithStatus = requests.map(request => {
   const match = request.matchedDonors.find(
     m => m.donor.toString() === req.user._id.toString()
   );
   return {
     ...request.toObject(),
     myResponse: match ? match.response : null,
     myRespondedAt: match ? match.respondedAt : null
   };
 });

 res.status(200).json({
   success: true,
   count: requestsWithStatus.length,
   totalPages: Math.ceil(count / limit),
   currentPage: parseInt(page),
   data: requestsWithStatus
 });
});


/**
* @route   GET /api/requests/donor/visibility-info
* @desc    Get donor's visibility information (compatible blood types, radius, eligibility)
* @access  Private (Donor)
*/
export const getDonorVisibilityInfo = catchAsync(async (req, res, next) => {
 if (req.user.role !== 'donor') {
   return next(new AppError('Only donors can access this endpoint', 403));
 }

 const donor = await DonorProfile.findById(req.user._id).lean();

 if (!donor) {
   return next(new AppError('Donor profile not found', 404));
 }

 const compatibleTypes = getCompatibleRecipientTypes(donor.bloodType);

 // Count visible requests
 const visibleRequestsCount = await BloodRequest.countDocuments({
   status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.MATCHED] },
   bloodType: { $in: compatibleTypes },
   requiredBy: { $gte: new Date() }
 });

 // Count matched requests
 const matchedRequestsCount = await BloodRequest.countDocuments({
   'matchedDonors.donor': req.user._id,
   status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.MATCHED] }
 });

 res.status(200).json({
   success: true,
   data: {
     bloodType: donor.bloodType,
     compatibleBloodTypes: compatibleTypes,
     availabilityRadius: donor.availabilityRadius || 50,
     isAvailable: donor.isAvailable,
     hasLocation: !!donor.location?.coordinates,
     visibleRequestsCount,
     matchedRequestsCount,
     preferences: {
       urgentOnly: donor.preferences?.urgentOnly || false,
       notificationEnabled: donor.preferences?.notificationEnabled ?? true
     }
   }
 });
});


/**
* @route   GET /api/requests/visibility/stats
* @desc    Get request visibility statistics (Admin only)
* @access  Private (Admin)
*/
export const getRequestVisibilityStats = catchAsync(async (req, res, next) => {
 if (req.user.role !== 'admin') {
   return next(new AppError('Only admins can access this endpoint', 403));
 }

 const stats = await getVisibilityStatistics();

 res.status(200).json({
   success: true,
   data: stats
 });
});


/**
* @route   PUT /api/requests/donor/update-radius
* @desc    Update donor's availability radius
* @access  Private (Donor)
*/
export const updateDonorRadius = catchAsync(async (req, res, next) => {
 if (req.user.role !== 'donor') {
   return next(new AppError('Only donors can access this endpoint', 403));
 }

 const { radius } = req.body;

 if (!radius || radius < 1 || radius > 200) {
   return next(new AppError('Radius must be between 1 and 200 km', 400));
 }

 const donor = await DonorProfile.findByIdAndUpdate(
   req.user._id,
   { availabilityRadius: radius },
   { new: true }
 );

 if (!donor) {
   return next(new AppError('Donor profile not found', 404));
 }

 res.status(200).json({
   success: true,
   message: 'Availability radius updated successfully',
   data: {
     availabilityRadius: donor.availabilityRadius
   }
 });
});


export default {
 createRequest,
 getRequests,
 getRequestById,
 updateRequest,
 cancelRequest,
 respondToRequest,
 getDonorMatchedRequests,
 getDonorVisibilityInfo,
 getRequestVisibilityStats,
 updateDonorRadius
};



