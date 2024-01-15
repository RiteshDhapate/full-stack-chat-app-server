const mongoose =require("mongoose");


const userSchema=mongoose.Schema({
    profilePhoto:{
        type:String,
        default:""
    },
    UserName:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    recovery:{
        type:String,
        required:true,
        default:"",
    },
    isOnline:{
        type:Boolean,
        default:false
    }

},{
    timestamps:true
}
);

module.exports = mongoose.model('User',userSchema);