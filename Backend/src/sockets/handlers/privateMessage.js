const Message = require('../../models/Message.model');
const SocketStore = require('../utils/socketStore');

module.exports = (io, socket, user) => {
  socket.on('private:message', async (data, callback) => {
    try {
      // 1. Frontend ki bhasha (chatId/text) aur DB ki bhasha (recipientId/content) dono ko handle karo
      const recipientId = data.recipientId || data.chatId;
      const content = data.content || data.text;
      
      if (!recipientId || !content) {
        if (typeof callback === 'function') return callback({ error: 'Recipient and content required' });
        return;
      }

      // 2. Message ko Database mein save karo
      const message = await Message.create({
        sender: user._id,
        recipient: recipientId,
        content,
        status: 'sent',
      });

      await message.populate('sender', 'username email');

      // Check karo dusra user online hai ya nahi
      const isOnline = await SocketStore.isUserOnline(recipientId);

      if (isOnline) {
        // 3. 🚨 EXACTLY wo format bhejo jo Frontend ka `socket.on` expect kar raha hai
        io.to(`user:${recipientId}`).emit('private:message', {
          _id: message._id,
          text: content,
          time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          senderId: user._id.toString(),
          chatId: user._id.toString() // 🚨 CRITICAL: Receiver ke liye yeh message 'Sender' ke chat box mein jana chahiye
        });

        // Update message status to 'delivered'
        await Message.findByIdAndUpdate(message._id, { status: 'delivered', deliveredAt: new Date() });
        message.status = 'delivered';
      } else {
        console.log(`User ${recipientId} is offline, message stored for later`);
      }

      // Safe callback return
      if (typeof callback === 'function') {
        callback({ success: true, message: message.toObject() });
      }
    } catch (error) {
      console.error('Private message error:', error);
      if (typeof callback === 'function') {
        callback({ error: 'Failed to send message' });
      }
    }
  });

  // 🚨 2. NAYA ADD KIYA GAYA CODE: Delete for Everyone Listener
  socket.on('message:delete_everyone', async ({ messageId, recipientId }, callback) => {
    try {
      // Database me content update karke flag set karein
      await Message.findByIdAndUpdate(
        messageId,
        { content: 'This message was deleted', isDeleted: true },
        { new: true }
      );

      // Receiver ko realtime socket alert bhejein
      io.to(`user:${recipientId}`).emit('message:deleted_everyone', {
        messageId,
        chatId: user._id.toString()
      });

      // Sender ko acknowledge karein
      if (typeof callback === 'function') {
        callback({ success: true, messageId });
      }
    } catch (error) {
      console.error('Delete for Everyone Error:', error);
      if (typeof callback === 'function') callback({ error: 'Failed to delete message' });
    }
  });
};