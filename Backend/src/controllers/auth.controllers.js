const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const { AppError } = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateTokens');
const { getAccessTokenCookieOptions, getRefreshTokenCookieOptions } = require('../utils/cookieOptions');
const { validateRegister, validateLogin } = require('../validations/authValidation');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  const validationErrors = validateRegister(req.body);
  if (validationErrors.length > 0) {
    return next(new AppError(validationErrors.join('. '), 400));
  }

  const { username, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError('Email already registered', 400));
    }
    return next(new AppError('Username already taken', 400));
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token in database
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Set cookies
  res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  const userResponse = user.toObject();
  delete userResponse.password;
  res.status(201).json({
    status: 'success',
    data: {
      user:userResponse,
      accessToken, // Also return for mobile clients
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const validationErrors = validateLogin(req.body);
  if (validationErrors.length > 0) {
    return next(new AppError(validationErrors.join('. '), 400));
  }

  const { email, username, password } = req.body;

  // Find user by email or username
  const user = await User.findOne({
    $or: [{ email: email || '' }, { username: username || '' }],
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid credentials', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 401));
  }

  // Update last seen
  user.lastSeen = Date.now();
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Set cookies
  res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  user.password = undefined;

  res.status(200).json({
    status: 'success',
    data: {
      user,
      accessToken,
    },
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
const refresh = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new AppError('No refresh token provided', 401));
  }

  // Check if token exists in database and not revoked
  const tokenDoc = await RefreshToken.findOne({ token: refreshToken, revoked: false });
  if (!tokenDoc) {
    return next(new AppError('Invalid or revoked refresh token', 401));
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if token matches user
    if (tokenDoc.user.toString() !== decoded.userId) {
      return next(new AppError('Token user mismatch', 401));
    }

    // Check if expired
    if (tokenDoc.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id });
      return next(new AppError('Refresh token expired', 401));
    }

    // Generate new tokens (rotation)
    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    // Invalidate old refresh token
    tokenDoc.revoked = true;
    tokenDoc.replacedByToken = newRefreshToken;
    await tokenDoc.save();

    // Create new refresh token
    await RefreshToken.create({
      token: newRefreshToken,
      user: decoded.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Set new cookies
    res.cookie('accessToken', newAccessToken, getAccessTokenCookieOptions());
    res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    // If token verification fails, revoke it
    tokenDoc.revoked = true;
    await tokenDoc.save();
    return next(new AppError('Invalid refresh token', 401));
  }
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    // Revoke the refresh token
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { revoked: true },
      { new: true }
    );
  }

  // Clear cookies
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

/**
 * @desc    Search user by email ID
 * @route   GET /api/v1/users/search (ya /api/v1/auth/search)
 * @access  Private
 */
const searchUserByEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.query;

  if (!email) {
    return next(new AppError('Email parameter is required', 400));
  }

  // Exact email match karein (Case-insensitive)
  const targetUser = await User.findOne({
    email: email.trim().toLowerCase()
  }).select('_id username email avatar profilePic');

  if (!targetUser) {
    return next(new AppError('User not found with this email ID', 404));
  }

  res.status(200).json({
    status: 'success',
    user: targetUser
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  searchUserByEmail,
};