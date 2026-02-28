const Notification = require('../models/Notification');

// Create a notification (Internal helper)
exports.createNotification = async (data) => {
    try {
        const notification = new Notification(data);
        await notification.save();
        return notification;
    } catch (err) {
        console.error('Notification Error:', err);
    }
};

// Get notifications for current user
exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('sender', 'name.first name.last documents.passportPhoto role');

        res.json({ success: true, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        let notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Not found' });

        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ success: true, data: notification });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Mark all as read
exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ success: true, message: 'All marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
