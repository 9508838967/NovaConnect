const { verifyAccessToken } = require('../../utils/generateTokens');
const User = require('../../models/User.model');

const socketAuth = async (socket, next) => {
  try {
    // Token can be from handshake auth or cookie
    let token = socket.handshake.auth.token;
    if (!token && socket.handshake.headers.cookie) {
      const cookie = require('cookie');
      const cookies = cookie.parse(socket.handshake.headers.cookie);
      token = cookies.accessToken;
    }

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return next(new Error('Authentication error: User invalid or inactive'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;