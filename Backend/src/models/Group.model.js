// src/models/Group.model.js

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    groupAvatar: {
      type: String, // Cloudinary ya kisi aur image host ka URL
      default: '',
    }
  },
  {
    timestamps: true, // createdAt aur updatedAt automatically handle karega
  }
);

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;