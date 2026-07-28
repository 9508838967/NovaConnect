const cookie = require('cookie');
const { verifyAccessToken } = require('../utils/generateTokens');
const User = require('../models/User.model');

const socketAuth = async (socket, next) => {
  try {
    // Parse cookies from handshake headers
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('Authentication error: No cookies provided'));
    }

    const cookies = cookie.parse(cookieHeader);
    const token = cookies.accessToken;

    if (!token) {
      return next(new Error('Authentication error: No access token'));
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return next(new Error('Authentication error: User not found or inactive'));
    }

    // Attach user to socket
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;