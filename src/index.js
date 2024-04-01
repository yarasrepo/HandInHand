const express = require("express")
const session = require("express-session");
const path = require("path")
require('dotenv').config();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const app = express()
const hbs = require("hbs")
const LogInCollection = require("./mongodb")
const port = process.env.PORT || 3000
app.use(express.json())

app.use(express.urlencoded({ extended:false }))

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

// hbs.registerPartials(partialPath)


app.get('/signup', (req, res) => {
    res.render('signup')
})

//  app.get('/', (req, res) => {
//      res.render('homepage')
//  })


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

app.get('/Posts', (req, res) => {
    res.render('Posts')
})


app.get('/userprofile', (req, res) => {
    try {
        // Check if the user is logged in
        if (req.session.user) {
            const userName = req.session.user.name; // Retrieve the name of the logged-in user
            res.render("userprofile", { userName }); // Pass the user's name to the view
        } else {
            // Handle the case where the user is not logged in
            res.redirect('/login'); // Redirect to the login page or handle appropriately
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/orgprofile', (req,res) => {
    try {
        if(req.session.user) {
            const orgName = req.session.user.name;
            res.render("orgprofile", {orgName});
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

app.get('/reset-password', (req, res) => {
    res.render('reset-password')
});


app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await LogInCollection.findOne({ email });

        if (!user) {
            return res.send('User not registered');
        }

        const secret = process.env.JWT_SECRET || 'your_jwt_secret';
        const payload = {
            email: user.email,
            id: user.id
        };
        const token = jwt.sign(payload, secret, { expiresIn: '5m' });
        // Maybe change link later when we want to host 
        const resetLink = `http://localhost:3000/reset-password/${user.id}/${token}`;

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'Gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your_email@example.com',
                pass: process.env.EMAIL_PASS || 'your_email_password'
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Link',
            text: `Click the following link to reset your password: ${resetLink}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending email');
            } else {
                console.log('Email sent:', info.response);
                return res.send('Password reset link has been sent to your email');
            }
        });
    } catch (error) {
        console.error('Error in forgot-password endpoint:', error);
        return res.status(500).send('Internal Server Error');
    }
});


app.get('/reset-password/:userId/:token', async (req, res) => {
    const { userId, token } = req.params;

    try {
        const user = await LogInCollection.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        const secret = process.env.JWT_SECRET; 
        jwt.verify(token, secret, async (err, decoded) => {
            if (err) {
                return res.status(400).send('Invalid or expired token');
            }

            res.render('reset-password', { userId, token });
        });
    } catch (error) {
        console.error('Error in reset-password route:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/reset-password/:userId/:token', async (req, res) => {
    const { userId, token } = req.params;
    const { newPassword } = req.body;

    try {
        const user = await LogInCollection.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        const secret = process.env.JWT_SECRET || 'your_jwt_secret';
        jwt.verify(token, secret, async (err, decoded) => {
            if (err) {
                return res.status(400).send('Invalid or expired token');
            }

            // Update user's password
            user.password = newPassword;
            await user.save();

            res.send('Password reset successful');
        });
    } catch (error) {
        console.error('Error in reset-password route:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.listen(port, () => {
    console.log('port connected');
})