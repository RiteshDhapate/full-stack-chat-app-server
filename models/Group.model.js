const mongoose = require("mongoose");


const groupSchema= mongoose.Schema({
    groupName:{
        type:String,
        required:true,
        unique:true
    },
    groupPhoto:{
        type:String,
        default:""
    },
    groupMembers:{
        type:Array,
        default:[]
    },
    chats:{
        type:Array,
        default:[]
    }
},{timestamps:true})

module.exports = mongoose.model('Group',groupSchema);