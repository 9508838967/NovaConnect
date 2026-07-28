const Message = require('../models/Message.model');
const User = require('../models/User.model');
const { AppError } = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Get conversation between two users
 * @route   GET /api/v1/messages/:userId
 * @access  Private
 */
const getConversation = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { limit = 50, before } = req.query;

  // Validate recipient exists
  const recipient = await User.findById(userId);
  if (!recipient) {
    return next(new AppError('User not found', 404));
  }

  // Build query
  const query = {
    $or: [
      { sender: req.user._id, recipient: userId },
      { sender: userId, recipient: req.user._id },
    ],
  };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('sender', 'username email')
    .populate('recipient', 'username email');

  // Mark messages as read if current user is recipient
  await Message.updateMany(
    {
      recipient: req.user._id,
      sender: userId,
      read: false,
    },
    {
      read: true,
      readAt: new Date(),
    }
  );

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: {
      messages: messages.reverse(),
      recipient,
    },
  });
});

/**
 * @desc    Send a new message (REST fallback)
 * @route   POST /api/v1/messages
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res, next) => {
  const { recipientId, content } = req.body;

  if (!recipientId || !content) {
    return next(new AppError('Please provide recipientId and content', 400));
  }

  if (content.length > 5000) {
    return next(new AppError('Message cannot exceed 5000 characters', 400));
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return next(new AppError('Recipient not found', 404));
  }

  const message = await Message.create({
    sender: req.user._id,
    recipient: recipientId,
    content,
  });

  await message.populate('sender', 'username email');
  await message.populate('recipient', 'username email');

  res.status(201).json({
    status: 'success',
    data: {
      message,
    },
  });
});

/**
 * @desc    Get unread message count
 * @route   GET /api/v1/messages/unread/count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Message.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  res.status(200).json({
    status: 'success',
    data: {
      unreadCount: count,
    },
  });
});

/**
 * @desc    Get all recent conversations for the sidebar
 * @route   GET /api/v1/messages/conversations
 * @access  Private
 */
const getRecentConversations = asyncHandler(async (req, res, next) => {
  // 1. Current user ke saare messages dhoondho (jahe wo sender ho ya recipient)
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { recipient: req.user._id }]
  })
    .sort({ createdAt: -1 }) // Sabse naye messages sabse upar
    .populate('sender', 'username email')
    .populate('recipient', 'username email');

  // 2. Un messages se unique logon ki list (Sidebar Chats) banao
  const chatMap = new Map();

  messages.forEach(msg => {
    // Check karo ki doosra user kaun hai (Sender ya Recipient)
    const isSender = msg.sender._id.toString() === req.user._id.toString();
    const otherUser = isSender ? msg.recipient : msg.sender;

    if (!otherUser) return; // Agar user delete ho gaya ho toh skip karo

    const otherUserId = otherUser._id.toString();

    // Agar yeh user map mein nahi hai, toh add kar do
    if (!chatMap.has(otherUserId)) {
      chatMap.set(otherUserId, {
        id: otherUserId,
        name: otherUser.username || 'Unknown User',
        isGroup: false,
        unreadCount: 0, 
        isOnline: false, // Yeh socket apne aap update kar dega
      });
    }
  });

  // Map ko Array mein convert karo
  const activeChats = Array.from(chatMap.values());

  res.status(200).json({
    status: 'success',
    data: activeChats
  });
});

module.exports = {
  getConversation,
  sendMessage,
  getUnreadCount,
  getRecentConversations
};