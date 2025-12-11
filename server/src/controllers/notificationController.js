import Notification from '../models/Notification.js';
import { catchAsync } from '../middlewares/errorHandler.js';

export const getNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const unreadCount = await Notification.getUnreadCount(req.user._id);

  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount
  });
});

export const markAsRead = catchAsync(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  await notification.markAsRead();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read'
  });
});

export const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

export default { getNotifications, markAsRead, markAllAsRead };
