// Redis hata diya gaya hai local dev ke liye
// In-memory data structures
const userSockets = new Map(); // hash: userId -> socketId
const onlineUsers = new Set(); // set of online userIds
const userGroups = new Map();  // hash: userId -> array of groupIds

class SocketStore {
  // Sabhi functions mein 'async' rakha hai taaki baaki ka code crash na ho
  
  static async setUserSocket(userId, socketId) {
    const id = userId.toString();
    userSockets.set(id, socketId);
    onlineUsers.add(id);
  }

  static async getUserSocket(userId) {
    return userSockets.get(userId.toString());
  }

  static async removeUserSocket(userId) {
    const id = userId.toString();
    userSockets.delete(id);
    onlineUsers.delete(id);
  }

  static async isUserOnline(userId) {
    return onlineUsers.has(userId.toString());
  }

  static async addUserToGroup(userId, groupId) {
    const id = userId.toString();
    const groups = userGroups.get(id) || [];
    if (!groups.includes(groupId)) {
      groups.push(groupId);
      userGroups.set(id, groups);
    }
  }

  static async removeUserFromGroup(userId, groupId) {
    const id = userId.toString();
    let groups = userGroups.get(id) || [];
    groups = groups.filter(g => g !== groupId);
    userGroups.set(id, groups);
  }

  static async getUserGroups(userId) {
    return userGroups.get(userId.toString()) || [];
  }

  static async getAllOnlineUsers() {
    return Array.from(onlineUsers);
  }
}

module.exports = SocketStore;