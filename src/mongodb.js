const mongoose = require("mongoose")

mongoose.connect("mongodb://localhost:27017/HandInHand")
    .then(() => {
        console.log("mongodb connected");
    })
    .catch(() => {
        console.log("failed to connect");
    })

const LogInSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    DateJoined: {
        type: Date,
        default: Date.now
    },
})

const collection = new mongoose.model("HandInHandcollection", LogInSchema)

const userProfile = new mongoose.Schema({
    name: {
        type: String,
        ref: 'LogInSchema',
        required: true
    },
    email: {
        type: String,
        ref: 'LogInSchema',
        required: true
    },
    role: {
        type: String,
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
        type: String, // Corrected to directly specify String as the type
        maxlength: 1000 // Assuming you store the file path or URL
    },
    DateJoined: {
        type: Date,
        ref: 'LogInSchema',
    },
    JobsBooked: {
        type: Number,
        default: 0,
    },
    JobsPosted: {
        type: Number,
        default: 0,
    },
    images:
    {
        type: [String],
    }

})

const userProfCollection = mongoose.model("userProfCollection", userProfile)

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    openPositions: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true,
    },
    requiredHours: {
        type: Number,
        required: true
    },
    requiredSkills: {
        type: String,
        required: true
    },
    imageLink: {
        type: String,
        ref: 'userProfileCollection'
    },
    creator: {
        type: String,
        required: true,
        ref: 'HandInHandcollection',
    },
    datePosted: {
        type: Date,
        default: Date.now
    },
    participants: [{
        email: String,
        firstName: String,
        lastName: String
    }]
});

const JobCollection = mongoose.model("JobCollection", jobSchema)

const reqOrg = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    PhoneNum: {
        type: Number,
    },
    Location: {
        type: String,
    },
    DateReq: {
        type: Date,
        default: Date.now
    },
    ProfilePic: {
        type: String, // Corrected to directly specify String as the type
        maxlength: 1000 // Assuming you store the file path or URL
    },
    flag: {
        type: Boolean,
        default: 'false',
        required: true,
    },
    deniedCount: {
        type: Number,
        default: 0,
        required: true,
    },
    reqCount: {
        type: Number,
        default: 0,
        required: true,
    }
});

const ReqCollection = mongoose.model("ReqCollection", reqOrg)

const reqBook = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    PhoneNum: {
        type: Number,
    },
    Location: {
        type: String,
    },
    DateReq: {
        type: Date,
        default: Date.now
    },
    // ProfilePic: {
    //     type: String, // Corrected to directly specify String as the type
    //     maxlength: 1000 // Assuming you store the file path or URL
    // },
    flag: {
        type: Boolean,
        default: 'false',
        required: true,
    },
});

const ReqBookCollection = mongoose.model("ReqBookCollection", reqBook)

const FbSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    datePosted: {
        type: Date,
        default: Date.now
    },
    feedbackMessage: {
        type: String,
    },
    feedbackEmoji: {
        type: String,
    }
});

const FeedbackCollection = mongoose.model("FeedbackCollection", FbSchema)

module.exports = {
    collection,
    userProfCollection,
    JobCollection,
    ReqCollection,
    ReqBookCollection,
    FeedbackCollection
}