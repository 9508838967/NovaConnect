// Store online users: userId -> socketId
// Store online users mapping memory pipeline: userId -> socketId
const onlineUsers = new Map();

// 1. Core Native Functions (Jo tumne shuru me share kiye the)
const addOnlineUser = (userId, socketId) => {
  if (userId) onlineUsers.set(userId.toString(), socketId);
};

const removeOnlineUser = (socketId) => {
  for (const [userId, sId] of onlineUsers.entries()) {
    if (sId === socketId) {
      onlineUsers.delete(userId);
      break;
    }
  }
};

const getUserSocketId = (userId) => {
  return userId ? onlineUsers.get(userId.toString()) : null;
};

const isUserOnline = (userId) => {
  return userId ? onlineUsers.has(userId.toString()) : false;
};

// 👥 Group management mapping fallback block
const activeGroups = new Map(); // groupId -> Set(userIds)

// 🔥 ROUTER COMPATIBILITY LAYER:
// Yeh functions index.js directly dhoondh raha tha. Inhe humne direct tumhare Map se connect kar diya.
const setUserSocket = async (userId, socketId) => {
  if (userId) {
    onlineUsers.set(userId.toString(), socketId);
    console.log(`[MemoryStore] Linked User ${userId} to Socket Connection -> ${socketId}`);
  }
};

const getUserSocket = async (userId) => {
  return userId ? onlineUsers.get(userId.toString()) : null;
};

const removeUserSocket = async (userId) => {
  if (userId) onlineUsers.delete(userId.toString());
};

const addUserToGroup = async (userId, groupId) => {
  if (!groupId || !userId) return;
  const gId = groupId.toString();
  if (!activeGroups.has(gId)) {
    activeGroups.set(gId, new Set());
  }
  activeGroups.get(gId).add(userId.toString());
  console.log(`[MemoryStore] Subscribed User ${userId} inside room group:${gId}`);
};

module.exports = {
  onlineUsers,
  addOnlineUser,
  removeOnlineUser,
  getUserSocketId,
  isUserOnline,
  
  // Enterprise methods exports for dynamic index.js binding
  setUserSocket,
  getUserSocket,
  removeUserSocket,
  addUserToGroup
};