const mongoose = require('mongoose');
const env = require('dotenv');
env.config();
const fs = require('fs');
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const cors = require('cors');
const express = require("express");
const app = express();
const http=require("http");
const server=http.createServer(app);
const {Server}=require("socket.io");
const userRoute = require("./routes/User.route")
const userModel = require("./models/User.model");
const Chat = require("./models/massage.model");
const Group = require("./models/Group.model");
const {groupChat} = require("./controllers/user.controller");
// *************************************************
// mongodb connection 
//***************************************************
require("./middlewares/dbConnction");

// *************************************************
// socket io connection
//***************************************************

const io = new Server(server,{
    cors:{
        origin:"*"
    }
});
io.on("connection",(socket)=>{
    // console.log("connected user ->",socket.id );
    // console.log(socket);
    // console.log("loggeduser => " +  socket.handshake.query.loggeduser);
    socket.on("message",async(data)=>{
     await setMassage(data);
     io.emit("message-received",data);
    });
    socket.on("liveMessageSent",(data)=>{
      io.emit("liveReciveMessage",data);
    })
    socket.on("group-message-send",(data)=>{ 
      groupChat(data);
      io.emit("group-message-received",data);
    })
    socket.on("disconnect",()=>{
    console.log("user disconnected");
    })
});

// *************************************************
// middleware methods 
//***************************************************
app.use(express.json());
app.use(cors());
app.use("/user",userRoute);
app.get("/",(req,res)=>{
    res.send("Hello World");
});

async function setMassage(data){
  try {
    const { userId1, userId2, newMessage ,chatType} = data;
    // Check if all required parameters are provided
    if (!userId1 || !userId2 || !newMessage || !chatType) {
      console.log("data is required");
      return ;
    }

    // Check if a chat with the specified user IDs already exists
    const existingChat = await Chat.findOne({ users: { $all: [userId1, userId2] } });
   
    if (existingChat) {
      // If the chat exists, push the new message
      existingChat.messages.push(newMessage);
      await existingChat.save();
    } else {
      // If the chat doesn't exist, create a new chat and insert the message
      const newChat = new Chat({
        users: [userId1, userId2],
        chatType: chatType, // Adjust the chat type as needed
        messages: [newMessage],
      });

      const savedChat = await newChat.save();
    }
  } catch (error) {
    console.log("message store :",error)
  }
}














// *************************************************
// new user craete fetures 
//***************************************************

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./uploads/"); // Images will be stored in the 'uploads' directory
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname); // Add timestamp to avoid filename conflicts
    },
  });
  const upload = multer({ storage: storage });

app.post("/upload",upload.single("profileImage"), async function (req, res) {
    console.log(req.body);
    try {
      console.log(`./uploads/${req.file.filename}`);
      const result = await cloudinary.uploader.upload(
        `./uploads/${req.file.filename}`,
        {
          resource_type:"auto"
        }
      );
      console.log(result.secure_url);
      const data = await userModel.create({
        profilePhoto: result.secure_url,
        UserName:req.body.userName,
        email: req.body.email,
        password: req.body.password,
        recovery:req.body.recovery
      });
      fs.unlinkSync(`./uploads/${req.file.filename}`);
  
  
      res.json(data);
    } catch (error) {
      fs.unlinkSync(`./uploads/${req.file.filename}`);
      res.status(401).json({massage:"User is already existing"});
      // console.log("Error uploading user", error);
    }
  });


// *************************************************
// group creation methods
//***************************************************
app.post('/createGroup',upload.single("groupPhoto"), async (req, res) => {
  try {
    // Extract data from the request body
    const { groupName, groupMembers } = req.body;

    // Check if the group name already exists
    const existingGroup = await Group.findOne({ groupName });

    if (existingGroup) {
      return res.status(400).json({ message: 'Group name is already exists' });
    }

    console.log(`./uploads/${req.file.filename}`);
    const result = await cloudinary.uploader.upload(
      `./uploads/${req.file.filename}`,
      {
        resource_type:"auto"
      }
    );
    console.log(result.secure_url);
    // Create a new group instance
    const newGroup = new Group({
      groupName,
      groupPhoto:result.secure_url,
      groupMembers,
    });

    // Save the group to the database
    const savedGroup = await newGroup.save();

    res.status(201).json(savedGroup);
    fs.unlinkSync(`./uploads/${req.file.filename}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});







// *************************************************
// server listening 
//***************************************************
const port = process.env.PORT || 2001
server.listen(port,()=>{
    console.log("server is running :" ,port);
})

