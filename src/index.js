const express = require("express")
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


// hbs.registerPartials(partialPath)


app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/', (req, res) => {
    res.render('login')
})

app.get('/login', (req, res) => {
    res.render('login')
})


// app.get('/home', (req, res) => {
//     res.render('home')
// })

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
            res.status(201).render("home", {
                naming: req.body.name
            });
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
            //if user is found and passwords match 
            res.status(201).render("home", { 
                name: check.name
            });
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