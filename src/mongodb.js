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
        unique: true
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

const userProfile= new mongoose.Schema({
    loginId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LogInSchema',
        required: true
    },
    Description: {
        type: String,
    },
    PhoneNum: {
        type: Number,
    },
    Location: {
        type: String,
    },
    ProfilePic: {
        type: String // Assuming you store the file path or URL
    },
    PrevOpps: [
        {
            company: {
                type: String
            },
            startDate: {
                type: Date
            },
            endDate: {
                type: Date
            },
            OppDescription: {
                type: String
            },
            hoursWorked: {
                type: Number
            }
        }
    ]
})
const userProfCollection= new mongoose.model("userProfCollection", userProfile)

module.exports = {
    collection,
    userProfCollection
}