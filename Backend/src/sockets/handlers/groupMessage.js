const GroupMessage = require('../../models/Message.model');
const Group = require('../../models/User.model');
const SocketStore = require('../utils/socketStore');

module.exports = (io, socket, user) => {
  socket.on('group:message', async (data, callback) => {
    try {
      const { groupId, content, tempId } = data;
      if (!groupId || !content) {
        return callback({ error: 'GroupId and content required' });
      }

      // Verify user is a member of the group
      const group = await Group.findOne({ _id: groupId, members: user._id });
      if (!group) {
        return callback({ error: 'Not a member of this group' });
      }

      // Save message
      const message = await GroupMessage.create({
        group: groupId,
        sender: user._id,
        content,
        status: 'sent',
      });
      await message.populate('sender', 'username email');

      // Broadcast to all members in the group room
      io.to(`group:${groupId}`).emit('group:message', {
        message,
        tempId,
      });

      // Update status to 'delivered' for online members? Could be done per user later.
      await GroupMessage.findByIdAndUpdate(message._id, { status: 'delivered' });

      callback({ success: true, message: { ...message.toObject(), tempId } });
    } catch (error) {
      console.error('Group message error:', error);
      callback({ error: 'Failed to send group message' });
    }
  });
};