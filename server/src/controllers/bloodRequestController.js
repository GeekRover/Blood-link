import BloodRequest from '../models/BloodRequest.js';
import Notification from '../models/Notification.js';
import { findCompatibleDonors } from '../services/matchingService.js';
import { notifyDonorAboutRequest } from '../services/smsService.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';


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
* @desc    Get all blood requests
* @access  Private
*/
export const getRequests = catchAsync(async (req, res, next) => {
 const { status, urgency, bloodType, page = 1, limit = 10 } = req.query;


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
* @desc    Get single blood request
* @access  Private
*/
export const getRequestById = catchAsync(async (req, res, next) => {
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


 const request = await BloodRequest.findById(req.params.id);


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


   // Notify recipient
   await Notification.create({
     user: request.recipient,
     type: 'request_matched',
     title: 'Donor Found!',
     message: `A donor has accepted your blood request for ${request.patientName}`,
     relatedModel: 'BloodRequest',
     relatedId: request._id
   });
 }


 await request.save();


 res.status(200).json({
   success: true,
   message: 'Response recorded successfully',
   data: request
 });
});


export default {
 createRequest,
 getRequests,
 getRequestById,
 updateRequest,
 cancelRequest,
 respondToRequest
};



