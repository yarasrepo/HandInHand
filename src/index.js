const express = require("express")
const session = require("express-session");
const path = require("path")
const fs = require("fs");
require('dotenv').config();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const app = express()
const hbs = require("hbs")
const helpers = require("handlebars-helpers")();
hbs.registerHelper(helpers);
const { collection: LogInCollection, userProfCollection, JobCollection, ReqCollection, FeedbackCollection } = require("./mongodb");
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


app.post('/signup', async (req, res) => {
    const data = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role
    };

    try {
        const existingUser = await LogInCollection.findOne({ email: req.body.email });
        if (existingUser) {
            res.send("User details already exist");
            return;
        }

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

        const description = req.session.user.role === 'volunteer' ? "I love helping others" : "Let's make the world better together";
        const user = await LogInCollection.findOne({ name: req.session.user.name }); // Find the user by their name
        const dateJoined = user ? user.DateJoined : null; // Get the DateJoined if the user exists, otherwise set to null
        const profileData = {
            name: req.session.user.name,
            email: req.body.email,
            role: req.session.user.role,
            Description: description,
            PhoneNum: 0,
            Location: "Beirut",
            ProfilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR11lMafo-ZYohC2qYI1BJN80gzcC-7IpohIeUQT1RT0WgBttaZX7J1yEea92wMCcTXa9A&usqp=CAU",
            DateJoined: dateJoined,
        };
        await userProfCollection.create(profileData);

        res.redirect(302, '/');
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
        const check = await LogInCollection.findOne({ name: req.body.name })

        if (check && check.password === req.body.password) {
            // Set user information in session
            req.session.user = {
                name: check.name,
                role: check.role
            };
            // Redirect to the homepage after successful login
            if (req.session.user.role == 'admin') {
                res.redirect('/admin')
            } else {
                res.redirect(302, '/');
            }
        } else {
            //if user is not found or passwords do not match 
            res.send("Incorrect username or password");
        }
    } catch (e) {
        console.error("Error during login:", e);
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


app.post('/job_submission_form', async (req, res) => {
    try {
        const { jobName, description, openPositions, location, startDate, requiredHours, requiredSkills, imageLink } = req.body;

        if (!jobName || !description || !openPositions || !location || !startDate || !requiredHours || !requiredSkills) {
            return res.status(400).send('All fields are required');
        }
        const organizationName = req.session.user.name;

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
                    res.render('orgprofile', { userProf });
                }
                else {
                    res.render('userprofile', { userProf });
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
                const jobs= await JobCollection.find();
                console.log(jobs);
                res.render('orgprofile', { userProf, jobs });
            } else {
                // Create the user profile if not found
                const existingUser = await LogInCollection.findOne({ name: req.session.user.name });
                if (existingUser) {
                    const data = {
                        name: req.session.user.name,
                        email: existingUser.email,
                        Description: "Let's make the world better together",
                        role: "organization",
                        PhoneNum: 0,
                        Location: "Beirut",
                        ProfilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR11lMafo-ZYohC2qYI1BJN80gzcC-7IpohIeUQT1RT0WgBttaZX7J1yEea92wMCcTXa9A&usqp=CAU",
                    };
                    await userProfCollection.create(data);

                    // Redirect to the profile page after creating the profile
                    res.redirect('/userprofile');
                } else {
                    console.log('user not found in LogInCollection');
                    res.status(404).send('User not found');
                }
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

        const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });

        // change after hosting the website
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

        return res.send('Password reset link has been sent to your email');
    } catch (error) {
        console.error('Error in forgot-password endpoint:', error);
        return res.status(500).send('Internal Server Error');
    }
});

app.get('/reset-password', async (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.render('reset-password', { token });
    } catch (error) {
        console.error('Error in reset-password route:', error);
        return res.status(400).send('Invalid or expired token');
    }
});

app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await LogInCollection.findById(decoded.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        user.password = newPassword;
        await user.save();

        return res.send('Password reset successful');
    } catch (error) {
        console.error('Error in reset-password route:', error);
        return res.status(400).send('Invalid or expired token');
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

        // Check if the user is an organization
        if (req.session.user.role === 'organization') {
            // Add to the images array only if the user is an organization
            update.$addToSet = { images: req.body.AddPhotos };
        }

        const updatedProfile = await userProfCollection.findOneAndUpdate(query, update, { new: true });

        if (updatedProfile) {
            if (req.session.user.role === 'organization'){
                res.redirect('/orgprofile');
            } else{
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

app.get('/about', (req, res)=>{
    res.render('about');
});

app.get('/feedback', (req, res)=>{
    res.render('feedback');
});

app.post('submitFeedback', (req,res)=>{

});

app.post('/submitFeedback', async (req, res) => {
    const { name, email, feedback, selectedEmoji } = req.body;

    try {
        if (!name || !email || !feedback || !selectedEmoji) {
            return res.status(400).send('All fields are required');
        }

        // Create a new feedback instance
        const newFeedback = new FeedbackCollection({
            name,
            email,
            feedbackMessage: feedback,
            feedbackEmoji: selectedEmoji,
        });

        // Save the new feedback to the database
        await newFeedback.save();

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting feedback');
    }
});


app.listen(port, () => {
    console.log('port connected');
})