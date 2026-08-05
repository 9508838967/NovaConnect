const socketAuth = require('./middleware/auth');
const { initRedisAdapter } = require('./redis');
const SocketStore = require('./utils/socketStore.js');
const presenceHandler = require('./handlers/presence');
const privateMessageHandler = require('./handlers/privateMessage');
const groupMessageHandler = require('./handlers/groupMessage');
const typingHandler = require('./handlers/typing');
const readReceiptHandler = require('./handlers/readReceipt');
const videoCallHandler = require('./handlers/videoCall');

let io;

const initSocket = async (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Attach Redis adapter (for horizontal scaling)
  await initRedisAdapter(io);

  // Authentication middleware
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`🔌 User connected: ${user.username} (${user._id})`);

    // Store mapping and presence
    await SocketStore.setUserSocket(user._id, socket.id);
    await presenceHandler.handleConnect(socket, user);

    // Join user's personal room
    socket.join(`user:${user._id.toString()}`);

    // Rejoin all groups the user belongs to (retrieved from DB or Redis store)
    const userGroups = await getUserGroupsFromDB(user._id); // implement DB query
    for (const groupId of userGroups) {
      socket.join(`group:${groupId}`);
      await SocketStore.addUserToGroup(user._id, groupId);
    }

    // Register event handlers
    privateMessageHandler(io, socket, user);
    groupMessageHandler(io, socket, user);
    typingHandler(io, socket, user);
    readReceiptHandler(io, socket, user);
    videoCallHandler(io, socket, user);
    // presence disconnect handled separately
    socket.on('disconnect', () => presenceHandler.handleDisconnect(io, socket, user));
  });

  return io;
};

// Helper to fetch user's group IDs from MongoDB
async function getUserGroupsFromDB(userId) {
  const Group = require('../models/Group.model'); // ✅ 1 dot kar diya (../)
  const groups = await Group.find({ members: userId }).select('_id');
  return groups.map(g => g._id.toString());
}

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };