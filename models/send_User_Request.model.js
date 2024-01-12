const mongoose = require('mongoose');
const requestSchema = mongoose.Schema({
    senderId:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        require:true
    },
    reciverId:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        require:true
    },
    status:{
        type:String,
        default:"pending"
    }
},{
    timestamps:true
})

module.exports = mongoose.model("userRequest",requestSchema);