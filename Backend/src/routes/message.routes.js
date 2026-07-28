// src/routes/message.routes.js
const express = require('express');
const router = express.Router();

// Controllers import
const { getConversation, sendMessage, getUnreadCount, getRecentConversations } = require('../controllers/message.controller');

// ✅ Sahi Path aur Sahi Function Dono Ek Sath Set Kar Diye Hain
const { authenticate } = require('../middleware/auth.middleware'); 

router.use(authenticate); // Express ko ab sahi middleware function mil gaya hai

router.post('/', sendMessage);
router.get('/unread/count', getUnreadCount);

// Sidebar ke liye conversations list
router.get('/conversations', getRecentConversations); 

router.get('/:userId', getConversation);

module.exports = router;