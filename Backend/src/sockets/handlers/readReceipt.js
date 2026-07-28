const Message = require('../../models/Message.model');
const GroupMessage = require('../../models/Message.model');

module.exports = (io, socket, user) => {
  // For private messages
  socket.on('message:delivered', async ({ messageIds, senderId }) => {
    if (!messageIds || !senderId) return;
    await Message.updateMany(
      { _id: { $in: messageIds }, sender: senderId, recipient: user._id },
      { status: 'delivered', deliveredAt: new Date() }
    );
    io.to(`user:${senderId}`).emit('message:delivered', { messageIds, recipientId: user._id });
  });

  socket.on('message:read', async ({ messageIds, senderId }) => {
    if (!messageIds || !senderId) return;
    await Message.updateMany(
      { _id: { $in: messageIds }, sender: senderId, recipient: user._id },
      { status: 'read', readAt: new Date() }
    );
    io.to(`user:${senderId}`).emit('message:read', { messageIds, readerId: user._id });
  });

  // For group messages
  socket.on('group:message:read', async ({ messageIds, groupId }) => {
    if (!messageIds || !groupId) return;
    await GroupMessage.updateMany(
      { _id: { $in: messageIds }, group: groupId },
      { $addToSet: { readBy: user._id } }
    );
    // Notify group that this user read certain messages
    io.to(`group:${groupId}`).emit('group:message:read', {
      userId: user._id,
      messageIds,
      groupId,
    });
  });
};