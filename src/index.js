const express = require("express")
const session = require("express-session");
const path = require("path")
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
        if (req.session.user) {
            const userRole = req.session.user.role;
            let profileLink;

            if (userRole === 'volunteer') {
                profileLink = '/userprofile';
            } else if (userRole === 'organization') {
                profileLink = '/orgprofile';
            }
            res.render('homepage', { profileLink });
        } else {
            res.render('homepage', { profileLink: null });
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


app.get('/userprofile', (req,res) => {
    res.render("userprofile")
})

app.get('/orgprofile', (req,res) => {
    res.render("orgprofile")
})



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


app.listen(port, () => {
    console.log('port connected');
})