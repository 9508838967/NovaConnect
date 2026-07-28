const User = require('../../models/User.model');
const SocketStore = require('../utils/socketStore');

/**
 * Called after a user connects.
 * Broadcast online status to friends / group members.
 * Update lastSeen in DB.
 */
const handleConnect = async (socket, user) => {
  // Update lastSeen in DB (optional)
  await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

  // Notify all users who share a group with this user (or friends)
  const groupIds = await SocketStore.getUserGroups(user._id);
  for (const groupId of groupIds) {
    socket.to(`group:${groupId}`).emit('user:online', {
      userId: user._id,
      username: user.username,
    });
  }
};

/**
 * On disconnect, remove from Redis store and broadcast offline.
 */
const handleDisconnect = async (io, socket, user) => {
  console.log(`🔌 User disconnected: ${user.username} (${user._id})`);
  await SocketStore.removeUserSocket(user._id);

  // Update lastSeen in DB
  await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

  const groupIds = await SocketStore.getUserGroups(user._id);
  for (const groupId of groupIds) {
    io.to(`group:${groupId}`).emit('user:offline', {
      userId: user._id,
      username: user.username,
      lastSeen: new Date(),
    });
  }
};

module.exports = { handleConnect, handleDisconnect };