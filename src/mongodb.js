const mongoose = require("mongoose")

mongoose.connect("mongodb://localhost:27017/HandInHand")
.then(() => {
    console.log("mongodb connected");
})
.catch(() => {
    console.log("failed to connect");
})

const LogInSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true
    }
})

const collection = new mongoose.model("HandInHandcollection", LogInSchema)

module.exports = LogInSchema