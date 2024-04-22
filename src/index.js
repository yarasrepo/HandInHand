const express = require("express")
const session = require("express-session");
const path = require("path")
const fs = require("fs");
require('dotenv').config();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const app = express()
const hbs = require("hbs")
const bcrypt = require('bcrypt');
const helpers = require("handlebars-helpers")();
hbs.registerHelper(helpers);
const { collection: LogInCollection, userProfCollection, JobCollection, ReqCollection, FeedbackCollection} = require("./mongodb");
//  connectDB();
// connectDB in list
const port = process.env.PORT || 3000
app.use(express.json())

app.use(express.urlencoded({ extended: false }))

const templatePath = path.join(__dirname, '../templates')
const publicPath = path.join(__dirname, '../public')
console.log(publicPath);

app.set('view engine', 'hbs')
app.set('views', templatePath)
app.use(express.static(publicPath))

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));


function sessionChecker(req, res, next) {
    if(req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}





app.get('/signup', (req, res) => {
    res.render('signup')
})




app.get('/', (req, res) => {
    try {
        // Check if the user is logged in
        const signedIn = !!req.session.user;
        if (signedIn) {
            const userRole = req.session.user.role;
            let profileLink;
            // if (userRole === 'volunteer') {
            profileLink = '/userprofile';
            // } else if (userRole === 'organization') {
            //     profileLink = '/orgprofile';
            // }
            res.render('homepage', { profileLink, signedIn });
        } else {
            res.render('homepage', { profileLink: null, signedIn });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.APP_PASSWORD
    }
});


const sendVerificationEmail = async (email, verificationToken) => {
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: email,
        subject: 'Email Verification',
        html: `<p>Click <a href="https://handinhand-do3j.onrender.com/verify-email?token=${verificationToken}">here</a> to verify your email address.</p>` // Removed target="_blank"
    };
// https://handinhand-o60q.onrender.com/
    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent');
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};


app.get('/verify-email', async (req, res) => {
    const token = req.query.token;

    try {
        console.log('Received verification token:', token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log('Decoded token:', decoded);

        const userId = decoded.userId;

        console.log('User ID from token:', userId);


        const user = await LogInCollection.findById(userId);

        console.log('User from database:', user);


        const result = await LogInCollection.updateOne({ _id: userId }, { $set: { verified: true } });

        console.log('Update result:', result);

        if (user && user.name) {
            req.session.user = {
                name: user.name,
                role: user.role
            };
        }

        console.log('Session user after verification:', req.session.user);

        res.redirect('/');

    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(400).send('Invalid or expired token');
    }
});




app.get('/email_sent', (req, res) => {
    res.render('email_sent')
})

app.post('/signup', async (req, res) => {
    try {
        const existingUser = await LogInCollection.findOne({ email: req.body.email });
        if (existingUser) {
            res.send("User details already exist");
            return;
        }

        const data = {
            name: req.body.name,
            email: req.body.email,
            password: await bcrypt.hash(req.body.password, 10),
            role: req.body.role,
            verified: false
        };

        // Handle organization requests
        console.log('before if');
        if (data.role === 'organization') {
            const org = await ReqCollection.findOne({ email: req.body.email });
            if (org && org.flag === false) {
                if (org.deniedCount == 3) {
                    res.send("Your application request has been denied three times! You cannot create an account with this email.");
                    return;
                }
                else if (org.reqCount == org.deniedCount) {
                    res.send("Request pending approval");
                    return;
                } else {
                    org.reqCount += 1;
                    await org.save();
                    res.send("Request submitted successfully");
                    return;
                }
            }
            else if (!org) {
                await ReqCollection.create(data);
                res.send("Request submitted successfully");
                return;
            }
        }

        await LogInCollection.create(data);
        if (data.role === 'organization') {
            await ReqCollection.deleteOne({ email: req.body.email });
        }
        req.session.user = {
            name: req.body.name,
            role: req.body.role
        };

        const newUser = await LogInCollection.find({ email: req.body.email });

        const description = req.session.user.role === 'volunteer' ? "I love helping others" : "Let's make the world better together";
        const profileData = {
            name: req.session.user.name,
            email: req.body.email,
            role: req.session.user.role,
            Description: description,
            PhoneNum: 0,
            Location: "Beirut",
            ProfilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR11lMafo-ZYohC2qYI1BJN80gzcC-7IpohIeUQT1RT0WgBttaZX7J1yEea92wMCcTXa9A&usqp=CAU",
        };
        await userProfCollection.create(profileData);

        const verificationToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        await sendVerificationEmail(data.email, verificationToken);

        res.redirect('/email_sent');
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("An error occurred during signup: " + error.message);
    }
});







app.get('/login', (req, res) => {
    res.render('login')
})


app.post('/login', async (req, res) => {
    try {
        const user = await LogInCollection.findOne({ name: req.body.name });

        if (user && (req.body.password == user.password)){
        // if (user && (await bcrypt.compare(req.body.password, user.password))) { 
            const userProfile = await userProfCollection.findOne({ name: req.body.name });
            if (userProfile && userProfile.reports >= 5) {
                res.send("Your account is temporarily banned");
                return;
            }
            req.session.user = {
                name: user.name,
                role: user.role
            };
            if (req.session.user.role === 'admin') {
                res.redirect('/admin');
            } else {
                res.redirect('/');
            }
        } else {
            res.send("Incorrect username or password");
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("An error occurred during login");
    }
});



app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/Posts', async (req, res) => {
    try {
        const jobs = await JobCollection.find();

        const signedIn = !!req.session.user;
        let userRole;
        let profileLink;
        let isOrganization;
        if (signedIn) {
            userRole = req.session.user.role;
            if (userRole === 'volunteer') {
                isOrganization = false;
                profileLink = '/userprofile';
            } else if (userRole === 'organization') {
                profileLink = '/orgprofile';
                isOrganization = true;
            }
        }
        res.render('Posts', { jobs, signedIn, userRole, profileLink, isOrganization });
    } catch (error) {
        console.error('Error in /Posts route:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/checkout', async (req, res) => {
    try {
        const jobId = req.query.jobId;
        const job = await JobCollection.findById(jobId);
        console.log(job);
        const signedIn = !!req.session.user;
        let userRole;
        let profileLink;
        let isOrganization;
        if (signedIn) {
            userRole = req.session.user.role;
            if (userRole === 'volunteer') {
                isOrganization = false;
                profileLink = '/userprofile';
            } else if (userRole === 'organization') {
                profileLink = '/orgprofile';
                isOrganization = true;
            }
        }else{
            res.redirect('/signup');
        }

        res.render('checkout', { job, signedIn, userRole, profileLink, isOrganization });
    } catch (error) {
        console.error('Error fetching job details:', error);
        res.status(500).send('Internal Server Error');
    }
});

// match with the userprofile!!
app.post('/checkout', async (req, res) => {
    try {
        const jobId = req.body.jobId;
        console.log('Received jobId:', jobId);
        console.log('Query parameters:', req.query);

        const job = await JobCollection.findById(jobId);
        console.log('Retrieved job:', job);

        if (!job) {
            console.log('Job not found');
            return res.status(404).send('Job not found');
        }

        const { firstName, lastName, email, phoneNumber } = req.body;

        console.log('Form submission data:', { firstName, lastName, email, phoneNumber });

        const user = await LogInCollection.findOne({ email: email });
        const userProf = await userProfCollection.findOne({ email: email });

        if (!user) {
            console.log('User not found');
            return res.status(400).send('User not found. Please register before booking.');
        }

        if (firstName && lastName && user.firstName && user.lastName &&
            (firstName.toLowerCase() !== user.firstName.toLowerCase() ||
                (lastName.toLowerCase() !== user.lastName.toLowerCase()))) {
            console.log('Provided first name and last name do not match existing user details');
            return res.status(400).send('Provided first name and last name do not match existing user details. Please provide correct information.');
        }
        //if user booked this job 
        const isParticipant = job.participants.some(participant => participant.email === email);
        if (isParticipant) {
            console.log('User has already booked this job');
            return res.status(400).send('You have already booked this job.');
        }
        //increase job count in userprof
        userProf.JobsBooked += 1;
        await userProf.save();

        if (firstName && !user.firstName) {
            user.firstName = firstName;
        }
        if (lastName && !user.lastName) {
            user.lastName = lastName;
        }
        await user.save();

        job.participants.push({ email, firstName: user.firstName, lastName: user.lastName });
        await job.save();

        job.openPositions -= 1;
        await job.save();

        res.redirect('/Posts');
    } catch (error) {
        console.error('Error processing checkout:', error);
        res.status(500).send('Internal Server Error');
    }
});




app.get('/job_submission_form', (req, res) => {
    res.render('job_submission_form');
})


app.post('/job_submission_form', sessionChecker, async (req, res) => {
    try {
        const { jobName, description, openPositions, location, startDate, requiredHours, requiredSkills, imageLink } = req.body;

        if(!jobName || !description || !openPositions || !location || !startDate || !requiredHours || !requiredSkills) {
            return res.status(400).send('All fields are required');
        }
       const organizationName = req.session.user.name;
        

        // Ensure that the session contains user information before proceeding

        const newJob = new JobCollection({
            title: jobName,
            description,
            openPositions: parseInt(openPositions),
            location,
            startDate, // Use the startDate directly since it's already formatted
            requiredHours: parseInt(requiredHours),
            requiredSkills,
            imageLink,
            creator: organizationName,
        });
        await newJob.save();

        const organization = await userProfCollection.findOne({ name: organizationName });
        organization.JobsPosted += 1;
        await organization.save();

        res.redirect('/Posts');
    } catch (error) {
        console.error('Error submitting job:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/userprofile', async (req, res) => {
    try {
        // Check if the user is logged in
        if (req.session.user) {
            const userName = req.session.user.name;
            console.log('Session user name:', req.session.user.name);
            const userProf = await userProfCollection.findOne({ name: req.session.user.name });

            if (userProf) {
                // Render the profile page if userProf is found
                if (req.session.user.role == 'organization') {
                    res.redirect('/orgprofile');
                }
                else {
                    const jobs = await JobCollection.find({ 'participants.email': userProf.email });
                    res.render('userprofile', { userProf, jobs });
                }
            } else {
                // Handle the case where the user profile is not found
                res.status(404).send('User profile not found');
            }
        } else {
            // Handle the case where the user is not logged in
            res.redirect('/login'); // Redirect to the login page or handle appropriately
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/orgprofile', async (req, res) => {
    try {
        if (req.session.user) {
            const orgName = req.session.user.name;
            // res.render("orgprofile", {orgName});
            const userProf = await userProfCollection.findOne({ name: req.session.user.name });

            if (userProf) {
                const jobs = await JobCollection.find({ creator: orgName });
                console.log(jobs);
                res.render('orgprofile', { userProf, jobs });
            } else {
                res.redirect('/login');
            }
        } else {
            res.redirect('/login');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});




app.get('/home', (req, res) => {
    res.render('homepage')
})


const sendPasswordResetEmail = async (email, resetLink) => {
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS, 
        to: email, 
        subject: 'Password Reset', 
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
    };

    try {
        await transporter.sendMail(mailOptions); 
        console.log('Password reset email sent');
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
};

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});


app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await LogInCollection.findOne({ email });

        if (!user) {
            return res.send('User not registered');
        }

        const resetToken = jwt.sign({ userId: user._id, email }, process.env.JWT_SECRET, { expiresIn: '10m' });

        // change after hosting the website
        const resetLink = `https://handinhand-do3j.onrender.com/reset-password?token=${resetToken}&email=${email}`;

        await sendPasswordResetEmail(email, resetLink); 

        res.redirect('/email_sent');
    } catch (error) {
        console.error('Error in forgot-password endpoint:', error);
        return res.status(500).send('Internal Server Error');
    }
});

app.get('/reset-password', async (req, res) => {
    const { token, email } = req.query;

    console.log('Token:', token); // Add this line for debugging

    if (!token) {
        return res.status(400).send('Token is missing');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.render('reset-password', { token, email });
    } catch (error) {
        console.error('Error in reset-password route:', error);
        return res.status(400).send('Invalid or expired token');
    }
});

app.post('/reset-password', async (req, res) => {
    const { email, password, confirmPassword } = req.body;
    console.log(req.body);


    console.log(email);


    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    const strongPasswordRequirements = [
        { regex: /^(?=.*[a-z])/, message: "At least one lowercase letter (a-z)" },
        { regex: /^(?=.*[A-Z])/, message: "At least one uppercase letter (A-Z)" },
        { regex: /^(?=.*[0-9])/, message: "At least one digit (0-9)" },
        { regex: /^(?=.*[!@#\$%\^&\*])/, message: "At least one special character" },
        { regex: /^(?=.{8,})/, message: "At least 8 characters long" }
    ];

    const isValidPassword = strongPasswordRequirements.every(rule => rule.regex.test(password));

    if (!isValidPassword) {
        const errorMessage = strongPasswordRequirements
            .filter(rule => !rule.regex.test(password))
            .map(rule => rule.message)
            .join(", ");

        return res.status(400).send(errorMessage);
    }

    try {
        // Find the user by email again
        const user = await LogInCollection.findOne({ email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update user's password
        user.password = password;
        await user.save();

        return res.redirect('/login');
    } catch (error) {
        console.error('Error in reset-password route:', error);
        return res.status(500).send('Internal Server Error');
    }
});



app.get('/editable', async (req, res) => {
    try {
        console.log('Session user ID:', req.session.user.name);

        const userProf = await userProfCollection.findOne({ name: req.session.user.name });

        res.render('editable', { userProf });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/edituserprof', async (req, res) => {
    const query = { name: req.session.user.name }; // Query to find the existing user profile

    try {
        let update = {
            $set: {
                Description: req.body.Description,
                PhoneNum: req.body.PhoneNum,
                Location: req.body.Location,
                ProfilePic: req.body.ProfilePic,
            }
        };

        // Check if the user is an organization and add photos not
        if (req.session.user.role === 'organization' && req.body.AddPhotos) {
            // Add to the images array only if the user is an organization
            update.$addToSet = { images: req.body.AddPhotos };
        }

        const updatedProfile = await userProfCollection.findOneAndUpdate(query, update, { new: true });

        if (updatedProfile) {
            if (req.session.user.role === 'organization') {
                res.redirect('/orgprofile');
            } else {
                res.redirect('/userprofile');
            }
        } else {
            res.status(404).send('User profile not found');
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/deletepage', (req, res) => {
    res.render('deletepage')
})

app.post('/deleteaccount', async (req, res) => {
    try {
        // Get the username from the session or request body (adjust based on your setup)
        const username = req.session.user.name
        const user = await LogInCollection.findOne({ name: username })

        // Delete user from LogInCollection
        const deleteLogIn = await LogInCollection.deleteOne({ name: username });

        // Delete user from userProfCollection
        const deleteUserProf = await userProfCollection.deleteOne({ name: username });

        const deleteJob = await JobCollection.deleteMany({ creator: username });

        const jobs = await JobCollection.find({ 'participants.email': user.email });
        for (const job of jobs) {
            job.participants = job.participants.filter(participant => participant.email !== user.email);
            job.openPositions += 1;
            await job.save();
        }

        // Check if deletion was successful in both collections
        if (deleteLogIn.deletedCount && deleteUserProf.deletedCount) {
            // Redirect or send success c
            req.session.destroy(() => {
                res.json({ success: true });
            });
        } else {
            res.status(404).send('User account not found');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/admindeleteaccount', async (req, res) => {
    try {
        const userId = req.body.userId; // Assuming the entire user object is sent in the request body
        console.log(userId);
        const user = await userProfCollection.findById(userId);
        const userName = user ? user.name : null;
        console.log(userName);

        // Delete user from LogInCollection
        const deleteLogIn = await LogInCollection.deleteOne({ name: user.name });

        // Delete user from userProfCollection
        const deleteUserProf = await userProfCollection.deleteOne({ name: user.name });

        const deleteJob = await JobCollection.deleteMany({ creator: user.name });

        const jobs = await JobCollection.find({ 'participants.email': user.email });
        for (const job of jobs) {
            job.participants = job.participants.filter(participant => participant.email !== user.email);
            await job.save();
        }
        // Check if deletion was successful in both collections
        if (deleteLogIn.deletedCount && deleteUserProf.deletedCount) {
            // Redirect or send success response
            res.json({ success: true });
        } else {
            res.status(404).send('User account not found');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/admindeletejob', async (req, res) => {
    try {
        const jobId = req.body.jobId; // Assuming the entire job object is sent in the request body

        // Use Mongoose to delete the job from JobCollection based on jobId
        const deleteJob = await JobCollection.deleteOne({ _id: jobId });

        // Check if deletion was successful
        if (deleteJob.deletedCount) {
            // Send a success response
            res.json({ success: true });
        } else {
            // Send an error response if job not found or deletion failed
            res.status(404).send('Job not found or deletion failed');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/deleteJob', async (req, res) => {
    const jobId = req.query.jobId;

    try {
        const deletedJob = await JobCollection.findByIdAndDelete(jobId);
        if (deletedJob) {
            res.sendStatus(200); // Send success response
        } else {
            res.sendStatus(404); // Job not found
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        res.sendStatus(500); // Internal server error
    }
});


app.post('/admindeletefeedback', async (req, res) => {
    try {
        const fbId = req.body.fbId; // Assuming the entire job object is sent in the request body

        // Use Mongoose to delete the job from JobCollection based on jobId
        const deleteFb = await FeedbackCollection.deleteOne({ _id: fbId });

        // Check if deletion was successful
        if (deleteFb.deletedCount) {
            // Send a success response
            res.json({ success: true });
        } else {
            // Send an error response if job not found or deletion failed
            res.status(404).send('Feedback not found or deletion failed');
        }
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/admin', async (req, res) => {
    // Check if the user is logged in
    if (req.session.user && req.session.user.name) {
        const adName = req.session.user.name;
        if (req.session.user.role !== 'admin') {
            res.redirect('/');
        }

        try {
            // Fetch the number of volunteers and organizations
            const numVolunteers = await LogInCollection.countDocuments({ role: 'volunteer' });
            const numOrgs = await LogInCollection.countDocuments({ role: 'organization' });
            const numJobs = await JobCollection.countDocuments();
            const users = await LogInCollection.find();
            const userprofs = await userProfCollection.find();

            console.log(`Number of volunteers: ${numVolunteers}`);
            console.log(`Number of organizations: ${numOrgs}`);
            console.log(`Number of Opportunities: ${numJobs}`);

            // Render the admin page with data
            res.render('admin', { adName, numVolunteers, numOrgs, numJobs, users, userprofs });
        } catch (error) {
            console.error('Error fetching data for admin page:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Redirect to the login page if the user is not logged in
        res.redirect('/login');
    }
});

app.get('/volunteeradmin', async (req, res) => {
    if (req.session.user && req.session.user.name) {
        if (req.session.user.role !== 'admin') {
            res.redirect('/');
        }
        const adName = req.session.user.name;
        try {
            // Fetch the number of volunteers and organizations
            const userprofs = await userProfCollection.find();

            // Render the admin page with data
            res.render('volunteeradmin', { adName, userprofs });
        } catch (error) {
            console.error('Error fetching data for admin page:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Redirect to the login page if the user is not logged in
        res.redirect('/login');
    }
});

app.get('/org_admin', async (req, res) => {
    if (req.session.user && req.session.user.name) {
        if (req.session.user.role !== 'admin') {
            res.redirect('/');
        }
        const adName = req.session.user.name;
        try {
            // Fetch the number of volunteers and organizations
            const userprofs = await userProfCollection.find();

            // Render the admin page with data
            res.render('org_admin', { adName, userprofs });
        } catch (error) {
            console.error('Error fetching data for admin page:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Redirect to the login page if the user is not logged in
        res.redirect('/login');
    }
});

app.get('/opp_admin', async (req, res) => {
    if (req.session.user && req.session.user.name) {
        if (req.session.user.role !== 'admin') {
            res.redirect('/');
        }
        const adName = req.session.user.name;
        try {
            // Fetch the number of volunteers and organizations
            const jobOps = await JobCollection.find();

            // Render the admin page with data
            res.render('opp_admin', { adName, jobOps });
        } catch (error) {
            console.error('Error fetching data for admin page:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Redirect to the login page if the user is not logged in
        res.redirect('/login');
    }
});

app.get('/feedback_admin', async (req, res) => {
    if (req.session.user && req.session.user.name) {
        if (req.session.user.role !== 'admin') {
            res.redirect('/');
        }
        const adName = req.session.user.name;
        try {
            // Fetch the number of volunteers and organizations
            const fbs = await FeedbackCollection.find();
            // Render the admin page with data
            res.render('feedback_admin', { adName, fbs });
        } catch (error) {
            console.error('Error fetching data for admin page:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Redirect to the login page if the user is not logged in
        res.redirect('/login');
    }
});

app.get('/vol_info', async (req, res) => {
    const objectId = req.query.objectId;
    try {
        const volunteer = await userProfCollection.findById(objectId);
        if (volunteer) {
            res.render('vol_info', { volunteer });
        } else {
            res.status(404).send('Volunteer not found');
        }
    } catch (error) {
        console.error('Error fetching volunteer information:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/org_info', async (req, res) => {
    const objectId = req.query.objectId;
    try {
        const organization = await userProfCollection.findById(objectId);
        if (organization) {
            res.render('org_info', { organization });
        } else {
            res.status(404).send('Organization not found');
        }
    } catch (error) {
        console.error('Error fetching organization information:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/opp_info', async (req, res) => {
    // Extract the objectId parameter from the request query
    const objectId = req.query.objectId;
    try {
        const job = await JobCollection.findById(objectId);

        if (job) {
            res.render('opp_info', { job });
        } else {
            res.status(404).send('Volunteer not found');
        }
    } catch (error) {
        console.error('Error fetching volunteer information:', error);
        res.status(500).send('Internal Server Error');
    }

});

app.get('/requests', async (req, res) => {
    if (req.session.user && req.session.user.name) {
        if (req.session.user.role !== 'admin') {
            res.redirect('/');
        }
        const adName = req.session.user.name;
        try {
            // Fetch the number of volunteers and organizations
            const reqOrgs = await ReqCollection.find();

            // Render the admin page with data
            res.render('requests', { adName, reqOrgs });
        } catch (error) {
            console.error('Error fetching data for requests page:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Redirect to the login page if the user is not logged in
        res.redirect('/login');
    }
});

app.get('/opp_profile', async (req, res) => {
    // Extract the objectId parameter from the request query
    const objectId = req.query.objectId;
    try {
        const job = await JobCollection.findById(objectId);
        let participantEmails = [];

        if (job && job.participants) {
            participantEmails = job.participants.map(participant => participant.email);
        } else {
            res.status(404).send('Job or participants not found');
            return;
        }

        const participants = await userProfCollection.find({ email: { $in: participantEmails } });

        if (participants) {
            res.render('opp_profile', { job, participants });
        } else {
            res.status(404).send('Participants not found');
        }
    } catch (error) {
        console.error('Error fetching job and participants information:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/admindenyrequest', async (req, res) => {
    try {
        const objectId = req.body.objectId;
        const org = await ReqCollection.findById(objectId);

        if (!org) {
            return res.status(404).send('Organization not found');
        }

        org.deniedCount += 1;
        await org.save(); // Wait for the save operation to complete


        return res.json({ success: true });

    } catch (error) {
        console.error('Error deleting object:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/adminacceptrequest', async (req, res) => {
    try {
        const userId = req.body.userId; // Assuming the entire user object is sent in the request body

        // Find the request to be updated based on userId
        const existingReq = await ReqCollection.findOne({ _id: userId });

        if (!existingReq) {
            return res.status(404).send('Request not found'); // Send a 404 response if request not found
        }

        // Update the flag to 'true'
        existingReq.flag = true;
        await existingReq.save(); // Save the updated request

        res.send('Request accepted successfully'); // Send a success response
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).send('Internal Server Error'); // Send a generic error response for internal server errors
    }
});

app.delete('/delete-image', async (req, res) => {
    try {
        const imageUrlToDelete = req.body.imageUrl; // Extract the image URL from the request body

        // Assuming userProfCollection is your Mongoose model for user profiles
        const userProfile = await userProfCollection.findOneAndUpdate(
            { "images": imageUrlToDelete }, // Find the user profile containing the image URL
            { $pull: { "images": imageUrlToDelete } }, // Remove the image URL from the images array
            { new: true } // Return the updated document after deletion
        );

        if (userProfile) {
            // Image deleted successfully
            res.status(200).json({ message: 'Image deleted successfully', userProfile });
        } else {
            // Image not found or deletion failed
            res.status(404).json({ message: 'Image not found or deletion failed' });
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/about', async (req, res) => {
    try {
        const signedIn = !!req.session.user;
        let userRole;
        let profileLink;
        let isOrganization;
        if (signedIn) {
            userRole = req.session.user.role;
            if (userRole === 'volunteer') {
                isOrganization = false;
                profileLink = '/userprofile';
            } else if (userRole === 'organization') {
                profileLink = '/orgprofile';
                isOrganization = true;
            }
        }
        const fb = await FeedbackCollection.find({}); // Fetch all feedback data
        res.render('about', { fb, signedIn, profileLink, userRole, isOrganization }); // Pass feedbackData to the 'about' template
    } catch (error) {
        console.error('Error fetching feedback data:', error);
        res.status(500).send('Internal Server Error'); // Handle error gracefully
    }
});

app.get('/feedback', (req, res) => {
    res.render('feedback');
});

app.post('/submitFeedback', async (req, res) => {
    const { name, email, feedback } = req.body;

    try {
        if (!name || !email || !feedback) {
            return res.status(400).send('All fields are required');
        }

        // Create a new feedback instance
        const newFeedback = new FeedbackCollection({
            name,
            email,
            feedbackMessage: feedback,
        });

        // Save the new feedback to the database
        await newFeedback.save();

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting feedback');
    }
});

//participats hsould already contain the userprof if we are passing it in js but are not maybe fix if doesnt work
app.put('/completeopportunity', async (req, res) => {
    const jobId = req.body.jobId;

    try {
        const job = await JobCollection.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Update job completion status
        job.completed = true;
        await job.save();

        // Get all participants' IDs from the job
        const participantEmails = job.participants.map(participant => participant.email);

        // Fetch participant accounts from UserProfCollection and update volunteered hours
        const participants = await userProfCollection.find({ email: { $in: participantEmails } });
        for (const participant of participants) {
            participant.HoursVolunteered += job.requiredHours;
            await participant.save();
        }

        res.status(200).json({ message: 'Job marked as completed', job });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Assuming you have a route handler set up for handling the report button click
app.post('/reportParticipant', async (req, res) => {
    const participantEmail = req.body.email; // Assuming you're sending the participant email from the frontend

    try {
        // Find the participant user by email
        const participantUser = await userProfCollection.findOne({ email: participantEmail });

        if (!participantUser) {
            return res.status(404).json({ error: ' user not found' });
        }

        // Increment the reports attribute by one for the participant
        participantUser.reports += 1;

        // Save the updated participant data back to the database
        await participantUser.save();

        // Send a success response
        res.status(200).json({ message: 'report incremented successfully', participantUser });
    } catch (err) {
        console.error('Error reporting user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/ignorereport', async (req, res) => {
    const participantEmail = req.body.email; // Assuming you're sending the participant email from the frontend

    try {
        // Find the participant user by email
        const participantUser = await userProfCollection.findOne({ email: participantEmail });

        if (!participantUser) {
            return res.status(404).json({ error: 'user not found' });
        }

        // Increment the reports attribute by one for the participant
        participantUser.reports =0;

        // Save the updated participant data back to the database
        await participantUser.save();

        // Send a success response
        res.status(200).json({ message: 'report count reset', participantUser });
    } catch (err) {
        console.error('Error reseting report count:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Assuming you have a route handler set up for handling participant deletion
app.delete('/removeParticipant', async (req, res) => {
    const jobId = req.query.jobId;
    const participantId = req.query.participantId;

    try {
        // Assuming you have a MongoDB model for jobs and participants, replace 'JobModel' and 'ParticipantModel' with your actual model names
        const job = await JobCollection.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Remove the participant from the job's participant list
        job.participants = job.participants.filter(participant => participant.toString() !== participantId);
        await job.save();

        res.status(200).json({ message: 'Participant removed from job successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Assuming you have an Express app instance named 'app'
app.post('/highlightFeedback', async (req, res) => {
    const { fbId, isHighlight } = req.body;

    try {
        // Update the feedback document in your database to set 'highlighted' based on the request
        // For example, using Mongoose:
        const updatedFeedback = await FeedbackCollection.findByIdAndUpdate(
            fbId,
            { $set: { highlighted: isHighlight } },
            { new: true } // To return the updated document
        );

        if (updatedFeedback) {
            res.json({ success: true, updatedFeedback });
        } else {
            res.status(404).json({ success: false, message: 'Feedback not found' });
        }
    } catch (error) {
        console.error('Error updating feedback:', error);
        res.status(500).json({ success: false, message: 'Error updating feedback' });
    }
});

app.get('/reports_admin', async (req, res) => {
    if (req.session.user && req.session.user.name) {
        if (req.session.user.role !== 'admin') {
            res.redirect('/');
        }
        const adName = req.session.user.name;
        try {
            // Fetch the number of volunteers and organizations
            const userprofs = await userProfCollection.find({ reports: { $gt: 0 } });

            // Render the admin page with data
            res.render('reports_admin', { adName, userprofs });
        } catch (error) {
            console.error('Error fetching data for admin page:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Redirect to the login page if the user is not logged in
        res.redirect('/login');
    }
});

app.get('/org-list', async (req, res) => {
    try {
        const orgs = await userProfCollection.find({ role: 'organization' });
        res.render('org-list', { orgs }); // Corrected syntax
    } catch (err) {
        // Handle errors appropriately
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/vieworgprofile', async (req, res) => {
    const creatorName = req.query.creator; // Get the creator name from the query parameter
    console.log(creatorName);

    try {
        // Find the user profile using the creator name
        const userProf = await userProfCollection.findOne({ name: creatorName });
        const jobs= await JobCollection.find({creator: req.query.creator});

        // Render the view with the user profile data
        res.render('vieworgprofile', { userProf, jobs });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Internal Server Error');
    }
});


// const PORT = process.env.PORT
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
})
