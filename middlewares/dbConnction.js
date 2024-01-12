const mongoose = require('mongoose');
mongoose.connect(process.env.DB_CONNECTION_URL)
.then(()=>{
    console.log("connected to database");
})
.catch((error)=>{
    console.log("database connection : ",error);
})
