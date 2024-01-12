const jwt = require('jsonwebtoken');
const jwtVerification =(req,res,next) => {
    try {
        const authorization = jwt.verify(req.body.authorization, process.env.JWT_SECRET);
        next();
        console.log("next authorization")
    } catch (error) {
        res.status(401).json({ massage: "Login expired plese login !!!" });
        console.log("bad authorization");
    }
}


module.exports = jwtVerification