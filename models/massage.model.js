const mongoose = require('mongoose');
const chatSchema = new  mongoose.Schema({
    users: {
      type: [String], // Assuming user IDs are strings
      required: true,
    },
    chatType: {
      type: String,
      enum: ['user', 'group'], // Assuming chatType can be either 'user' or 'group'
      required: true,
      default:"user"
    },
    messages: {
      type: Array,
      required: true,
    },
  },{
    timestamps:true
})

const chatModel=mongoose.model('Chat',chatSchema);
module.exports = chatModel;