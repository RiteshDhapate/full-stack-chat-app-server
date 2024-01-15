const UserModel = require("../models/User.model");
const userRequest = require("../models/send_User_Request.model");
const Chat = require("../models/massage.model");
const jwt = require("jsonwebtoken");
const Group = require("../models/Group.model");
const nodemailer = require('nodemailer');

//otp generated frunction
function generateOTP() {
  // Define the length of the OTP
  const otpLength = 6;

  // Generate a random 6-digit number
  const otp = Math.floor(Math.random() * Math.pow(10, otpLength));

  // Ensure the OTP is exactly 6 digits by padding with zeros if necessary
  const formattedOTP = otp.toString().padStart(otpLength, '0');

  return formattedOTP;
}

const userInfo = async function (req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    if(email===undefined || password===undefined) {
      res.status(401).json({ massage: "fill Fildes are required" });
      return;
    }
    const userInformation = await UserModel.aggregate([{$match:{email}},{$lookup:{from:"userrequests",localField:"_id",foreignField:"reciverId",as:"friends"}}]);
    
    if(userInformation.length === 0) {
      res.status(401).json({ massage: "check Email and password" });
      return;
    }
    if (  userInformation[0].password === password) {
      const token = await jwt.sign({ _id: userInformation[0]._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      const Userinfo={
        data:userInformation[0],
        token
      }
      res.json(Userinfo);
    } else {
      res.status(401).json({ massage: "check Email and password" });
    }
  } catch (error) {
    res.status(500).json({ massage: "Internal Server Error" });
    console.log("User fetching error", error);
  }
};


const userRequestController = async (req,res)=>{
  try {
    const senderId = req.body.senderId
    const reciverId = req.body.reciverId
    const findExists = await userRequest.find({  senderId, reciverId});
    if (findExists.length !== 0) {
      res.status(401).json({ massage: "request is already sent" });
      return
    }
    const response = await userRequest.create({senderId,reciverId})
    res.json(response);
  } catch (error) {
    res.status(401).json({ massage: "request is already sent" });
    console.log("user request controller error :", error);
  }
}

const allUsers =async(req,res)=>{
  try {
    const allusers = await UserModel.find({});
    res.json(allusers);
  } catch (error) {
    res.status(500).json({ massage: "Internal Server Error" });
    console.log("all users controller error :", error);
  }
};

const requestData=async(req,res)=>{
 try {
  const UserId = req.body.reciverId;
  console.log("User Id :", UserId);
  // const data =await userRequest.find({reciverId:UserId, status: 'pending'});
  const data =await userRequest.find({reciverId:UserId,status: 'pending'});
  const d=[];
    data.forEach(element => {
      d.push(element.senderId)
    });
  const allRequestUserData=await UserModel.find({ _id: { $in: d } });
  res.json(allRequestUserData);
 } catch (error) {
  res.status(401).json({ massage: "No Any Request" });
 }
};

const frendsData =async(req,res) => {
  try {
    
    const allReuests= await userRequest.find({reciverId:req.body.reciverId,status:"acepted"});
    const d=[];
    allReuests.forEach(element => {
      d.push(element.senderId);
    });
    const allUsersData= await UserModel.find({ _id: { $in: d } });
    res.json(allUsersData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const updateStatus =async(req,res) => {
  try {
    const reciverId = req.body.reciverId;
    const senderId = req.body.senderId;
    const updatedData = await userRequest.updateOne({ senderId, reciverId},{$set:{ status: 'acepted'}})
    res.json(updatedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const chat =async (req, res) => {
  try {
    const { userId1, userId2 } = req.query;

    // Check if both user IDs are provided
    if (!userId1 || !userId2) {
      return res.status(400).json({ error: 'Both user IDs are required.' });
    }
    
    // Retrieve messages from the database based on the condition
    const messages = await Chat.find({ users: { $all: [userId1, userId2] } });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const joinGroup=  async (req, res) => {
  try {
    const {groupId} = req.body;
    const { memberId } = req.body;

    // Check if the group exists
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if the member is already in the group
    if (group.groupMembers.includes(memberId)) {
      return res.status(400).json({ message: 'Member already exists in the group' });
    }

    // Add the member to the group
    group.groupMembers.push(memberId);

    // Save the updated group to the database
    const updatedGroup = await group.save();

    // Respond with the updated group
    res.status(200).json(updatedGroup);
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

const allGroups =async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch groups where user is not in the groupMembers array
    const groupsWithoutUser = await Group.find({ groupMembers: { $nin: [userId] } });

    // Respond with the list of groups without the user
    res.status(200).json(groupsWithoutUser);
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const allJoinedGroup=async (req, res) => {
  const userId = req.params.userId;

  try {
      // Find groups where the user ID exists in the groupMembers array
      const groups = await Group.find({ groupMembers: userId });

      if (groups.length === 0) {
          return res.status(404).json({ message: 'No groups found for the specified user ID.' });
      }

      res.status(200).json(groups);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
}

const groupChatMessage=async (req, res) => {
  const groupId = req.params.groupId;

  try {
      // Find groups where the user ID exists in the groupMembers array
      const group = await Group.find({ _id: groupId});

      // if (group.length === 0) {
      //     return res.status(404).json({ message: 'No groups found for the specified user ID.' });
      // }

      res.status(200).json(group);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
}

const groupChat=async (data) => {
const {groupId}=data;
  try {
      // Find the group by ID
      const group = await Group.findById(groupId);

      if (!group) {
          return;
      }

      // Push the new chat message to the chats array
      group.chats.push(data);

      // Save the updated group document
      const updatedGroup = await group.save();

  } catch (error) {
      console.error(error);;
  }
}
const forgetPassword =async (req,res)=>{
try {
  const {toEmail} = req.body;
  const otp=generateOTP()
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    // port: 587,
    auth: {
        user: 'rieshdhapatepatil@gmail.com',
        pass: 'qivfhfxkjjftcjwa'
    }
});
const info = await transporter.sendMail({
  from: '"SwiftTalk 👻" <swifttalk@gmail.com>', // sender address
  to:toEmail, // list of receivers
  subject: "Reset Password", // Subject line
  text: "hello from node js", // plain text body
  html: `
        <p> 🔐 Forgot your password? No worries! </p>
        <b>OTP: <strong>${otp}</strong></b>  
        <p>If you didn't request this, simply ignore this message.</p>
        <p>Stay secure,</p>
        <p>SwiftTalk team</p>
    `, // html body
});
console.log("Message sent: %s", info.messageId);
res.json({message:"email sent successfully",otp});
} catch (error) {
  res.json({message:"mail not sent !!!!"});
  console.log(error)
}
}


const updatePassword=async (req, res) => {
  const { email, newPassword } = req.body;

  try {
      // Check if the user exists
      const existingUser = await UserModel.findOne({ email });

      if (!existingUser) {
          return res.status(404).json({ message: 'User not found.' });
      }

      // Update the user's password using the save method
      existingUser.password = newPassword;
      await existingUser.save();

      // You might want to send a confirmation email or response here
      return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error.' });
  }
}
module.exports = { userInfo,forgetPassword,updatePassword,groupChatMessage,groupChat,allJoinedGroup,allGroups,joinGroup,updateStatus,userRequestController,allUsers,requestData,frendsData ,chat};
