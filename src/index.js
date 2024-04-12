const express = require("express")
const session = require("express-session");
const multer = require('multer');
const path = require("path")
const fs = require("fs");
require('dotenv').config();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const app = express()
const hbs = require("hbs")
// const LogInCollection = require("./mongodb")
const { collection: LogInCollection, userProfCollection, JobCollection } = require("./mongodb");
const port = process.env.PORT || 3000
app.use(express.json())

app.use(express.urlencoded({ extended:false }))

const templatePath = path.join(__dirname, '../templates')
const publicPath = path.join(__dirname, '../public')
console.log(publicPath);

app.set('view engine', 'hbs')
app.set('views', templatePath)
app.use(express.static(publicPath))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// hbs.registerPartials(partialPath)

// Set up Multer storage for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads')); // Save uploaded files to the uploads directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension); // Save file with unique name
    }
});

// Initialize Multer with the storage configuration
const upload = multer({ storage: storage });


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

            if (userRole === 'volunteer') {
                profileLink = '/userprofile';
            } else if (userRole === 'organization') {
                profileLink = '/orgprofile';
            }
            res.render('homepage', { profileLink, signedIn });
        } else {
            res.render('homepage', { profileLink: null, signedIn });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/login', (req, res) => {
    res.render('login')
})

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


app.get('/checkout', (req, res) => {
    res.render('checkout');
})


app.get('/job_submission_form', (req, res) => {
    res.render('job_submission_form');
})


app.post('/job_submission_form', async (req, res) => {
    try {
        const { jobName, description, openPositions, location, requiredHours, requiredSkills, imageLink } = req.body;

        if (!jobName || !description || !openPositions || !location || !requiredHours || !requiredSkills) {
            return res.status(400).send('All fields are required');
        }

        const newJob = new JobCollection({
            title: jobName, 
            description,
            openPositions: parseInt(openPositions),
            location,
            requiredHours: parseInt(requiredHours),
            requiredSkills,
            ProfilePic: imageLink // FIX THIS LATER IMAGE LINK SHOULD BE AUTOMATIC 
        });
        await newJob.save();

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
                res.render('userprofile', { userProf });
            } else {
                // Create the user profile if not found
                const existingUser = await LogInCollection.findOne({ name: req.session.user.name });
                if (existingUser){
                const data = {
                    name: req.session.user.name,
                    email: existingUser.email,
                    Description: "I love helping others",
                    PhoneNum: 0,
                    Location: "Beirut",
                    ProfilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR11lMafo-ZYohC2qYI1BJN80gzcC-7IpohIeUQT1RT0WgBttaZX7J1yEea92wMCcTXa9A&usqp=CAU",
                };
                await userProfCollection.create(data);
                
                // Redirect to the profile page after creating the profile
                res.redirect('/userprofile');
            }else{
                console.log('user not found in LogInCollection');
                res.status(404).send('User not found');
            }
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


app.get('/orgprofile', async (req,res) => {
    try {
        if(req.session.user) {
            const orgName = req.session.user.name;
            // res.render("orgprofile", {orgName});
            const userProf = await userProfCollection.findOne({ name: req.session.user.name });

            if (userProf) {
                // Render the profile page if userProf is found
                res.render('orgprofile', { userProf });
            } else {
                // Create the user profile if not found
                const existingUser = await LogInCollection.findOne({ name: req.session.user.name });
                if (existingUser){
                const data = {
                    name: req.session.user.name,
                    email: existingUser.email,
                    Description: "I love helping others",
                    PhoneNum: 0,
                    Location: "Beirut",
                    ProfilePic: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR11lMafo-ZYohC2qYI1BJN80gzcC-7IpohIeUQT1RT0WgBttaZX7J1yEea92wMCcTXa9A&usqp=CAU",
                };
                await userProfCollection.create(data);
                
                // Redirect to the profile page after creating the profile
                res.redirect('/orgprofile');
            }else{
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
    
    app.post('/signup', async (req, res) => {
        const data = {
            name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role
    }

    try {
        const existingUser = await LogInCollection.findOne({ email: req.body.email });

        if (existingUser) {
            res.send("User details already exist");
        } else {
            await LogInCollection.create(data);
            req.session.user = {
                name: req.body.name,
                role: req.body.role
            };
            res.redirect(302, '/');
        }
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("An error occurred during signup");
    }
});


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
            res.redirect(302, '/');
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


app.post('/edituserprof', upload.single('ProfilePic'), async (req, res) => {
    const query = { name: req.session.user.name }; // Query to find the existing user profile
    const update = {
        $set: {
            Description: req.body.Description,
            PhoneNum: req.body.PhoneNum,
            Location: req.body.Location,
            ProfilePic: req.file ? '/uploads/' + req.file.filename : '',
        }
    };

    try {
        const updatedProfile = await userProfCollection.findOneAndUpdate(query, update, { new: true });

        if (updatedProfile) {
            res.redirect('/userprofile'); // Redirect after updating the profile
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

        // Delete user from LogInCollection
        const deleteLogIn = await LogInCollection.deleteOne({ name: username });

        // Delete user from userProfCollection
        const deleteUserProf = await userProfCollection.deleteOne({ name: username });

        // Check if deletion was successful in both collections
        if (deleteLogIn.deletedCount && deleteUserProf.deletedCount) {
            // Redirect or send success response
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

app.listen(port, () => {
    console.log('port connected');
})