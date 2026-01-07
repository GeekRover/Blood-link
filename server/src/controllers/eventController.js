import BloodCampEvent from '../models/BloodCampEvent.js';
import { catchAsync, AppError } from '../middlewares/errorHandler.js';

export const getEvents = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { isPublished: true };
  if (status) query.status = status;

  const events = await BloodCampEvent.find(query)
    .populate('organizer', 'name phone')
    .sort({ eventDate: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  res.status(200).json({ success: true, data: events });
});

export const getEventById = catchAsync(async (req, res, next) => {
  const event = await BloodCampEvent.findById(req.params.id)
    .populate('organizer', 'name phone')
    .populate('registeredDonors.donor', 'name bloodType');

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  res.status(200).json({ success: true, data: event });
});

export const createEvent = catchAsync(async (req, res) => {
  const event = await BloodCampEvent.create({
    ...req.body,
    organizer: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event
  });
});

export const updateEvent = catchAsync(async (req, res, next) => {
  const event = await BloodCampEvent.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  res.status(200).json({ success: true, data: event });
});

export const deleteEvent = catchAsync(async (req, res, next) => {
  const event = await BloodCampEvent.findByIdAndDelete(req.params.id);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  res.status(200).json({ success: true, message: 'Event deleted' });
});

export const registerForEvent = catchAsync(async (req, res, next) => {
  const event = await BloodCampEvent.findById(req.params.id);

  if (!event) {
    return next(new AppError('Event not found', 404));
  }

  await event.registerDonor(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Registered successfully',
    data: event
  });
});

export default { getEvents, getEventById, createEvent, updateEvent, deleteEvent, registerForEvent };
