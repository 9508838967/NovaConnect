module.exports = (io, socket, user) => {
  socket.on('typing:start', ({ recipientId, groupId, isTyping = true }) => {
    if (recipientId) {
      socket.to(`user:${recipientId}`).emit('typing:start', {
        userId: user._id,
        username: user.username,
      });
    } else if (groupId) {
      socket.to(`group:${groupId}`).emit('typing:start', {
        userId: user._id,
        username: user.username,
        groupId,
      });
    }
  });

  socket.on('typing:stop', ({ recipientId, groupId }) => {
    if (recipientId) {
      socket.to(`user:${recipientId}`).emit('typing:stop', {
        userId: user._id,
      });
    } else if (groupId) {
      socket.to(`group:${groupId}`).emit('typing:stop', {
        userId: user._id,
        groupId,
      });
    }
  });
};