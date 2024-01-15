const route= require('express').Router();
const {jwtVerification} = require("../middlewares/index.js");
const {userInfo,userRequestController,updatePassword,forgetPassword,groupChatMessage,allGroups,allJoinedGroup,allUsers,requestData,frendsData,updateStatus,chat,joinGroup} = require('../controllers/user.controller');
route.post("/userinfo",userInfo);
route.post("/sentuserrequest",jwtVerification,userRequestController);
route.post("/allusers",jwtVerification,allUsers);
// route.get("/requests",jwtVerification,requests)
route.post("/frendsData",jwtVerification,frendsData);
route.post("/requestData",jwtVerification,requestData);
route.post("/updateStatus",jwtVerification,updateStatus);
route.post("/chat",jwtVerification,chat);
route.post("/joinGroup",joinGroup);
route.get("/allGroups/:userId",allGroups);
route.get("/allJoinedGroup/:userId",allJoinedGroup);
route.get("/groupChatMessage/:groupId",groupChatMessage);
route.post("/forgetPassword",forgetPassword);
route.post("/updatePassword",updatePassword);
module.exports= route ;  
