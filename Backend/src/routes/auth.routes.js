const express = require('express');
const { register, login, refresh, logout, getMe,searchUserByEmail } = require('../controllers/auth.controllers');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.get('/search', authenticate, searchUserByEmail);

module.exports = router;