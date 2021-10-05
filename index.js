const { v4: uuidv4, validate } = require('uuid');
const express = require('express')
const bodyParser = require('body-parser')
const multer  = require('multer')
//const upload = multer({ dest: 'uploads/' })
const app = express()
const port = 3000
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const { session } = require('passport');
const images = [];
const bcrypt = require('bcryptjs') 
const jwt = require('jsonwebtoken')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const secrets = process.env.JWT_SIGN_KEY
const userSchema = require('./schemas/user.schema.json')
const postingSchema = require('./schemas/posting.schema.json')
const modifiedPostSchema = require('./schemas/modifiedPost.schema.json')
const Ajv = require('ajv')
const ajv = new Ajv()
var cloudinary = require('cloudinary')
var cloudinaryStorage = require('multer-storage-cloudinary')

app.use(bodyParser.json())

//validations

const userValidator = ajv.compile(userSchema)
const postingValidator = ajv.compile(postingSchema)
const modifiedPostValidator = ajv.compile(modifiedPostSchema)

const postingValidation = function(req, res, next) {
    const valid = postingValidator(req.body)
    if(!valid) {
        res.sendStatus(400)
    }
    else {
        next()
    }
}

const modifiedPostValidation = function(req, res, next) {
    const valid = modifiedPostValidator(req.body)
    if(!valid) {
        res.sendStatus(400)
    }
    else {
        next()
    }
}
/*------------------------------HOME PAGE-------------------------*/

app.get('/', (req, res) => {
    res.sendFile('./homepage.html', {root: __dirname })
})

/*---------------------------------JWT----------------------------*/

//user example
const users = [
    {
        userName: 'user',
        password: 'password',
        email: 'email@email.com',
        phone: '1234567891'
    }
]

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secrets,
    passReqToCallback: true,
}

passport.use(new JwtStrategy(options, (req, payload, done) => {
    user = users.find(user => user.userName == payload.user)
    if (user) {
        req.user = user
        return done(null, user);
    } else {
        return done(null, false);
    }
}))

//login
app.post('/login', passport.authenticate('basic', { session: false } ), (req, res) => {
    const token = jwt.sign( {user: req.user.userName}, secrets)
    res.json({ token: token })
})

/*---------------------------------USER----------------------------*/

//http basic 
passport.use( new BasicStrategy(
    (userName, password, done) => {
        const searchResult = users.find( user => {
            if (userName === user.userName) {
                if (bcrypt.compareSync( password, user.password)) {
                    return true;
                }
            }
            else return false;
        })
        if ( searchResult != undefined ) {
            done(null, searchResult);
        } else {
            done(null, false);
        }
    }
))

//signup
app.post('/signup', (req, res) => {

    const valid = userValidator(req.body)

    if (!valid) {
        res.sendStatus(400)
    }
    else {
        const salt = bcrypt.genSaltSync(6)
        const hashedPassword = bcrypt.hashSync(req.body.password, salt)

        const checkUserName = users.find(user => user.userName === req.body.userName )
    
        if (checkUserName === undefined) {
            const newUser = {
                userName: req.body.userName,
                password: hashedPassword,
                email: req.body.email,
                phone: req.body.phone
            }
            users.push(newUser)
            res.sendStatus(201)
        }
        else {
            res.sendStatus(406)
        }
    }
})

/*---------------------------------POSTING----------------------------*/

//Posting example
const postings = [
    { 
        id: uuidv4(), 
        title: 'Posting Example', 
        description: 'Description', 
        category: 'category', 
        location: 'location', 
        images: images, 
        price: 'price', 
        date: '12.3.2014', 
        deliveryType: 'shipping or pickup', 
        seller: 'User name', 
        contactInformation: 'contanct information'
    }
]

// Get postings
app.get('/postings', (req, res) => {
  res.json(postings)
})

var storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: '',
    allowedFormats: ['jpg', 'png']
})

var upload = multer({ storage: storage })

//Create new posting
app.post('/postings', passport.authenticate('jwt', { session : false }), postingValidation, upload.array('photos', 4), function(req, res, next) {
    
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    postings.push(
        { 
            id: uuidv4(), 
            title: req.body.title, 
            description: req.body.description,
            category: req.body.category,
            location: req.body.location,
            images: req.files,
            price: req.body.price,
            date: date,
            deliveryType: req.body.deliveryType,
            seller: req.user.userName,
            contactInformation: "phone: " + req.user.phone + ", email: " + req.user.email
        })
    res.sendStatus(201)
})

//get posting by id
app.get('/postings/:postingID', (req,res) => {
    const post = postings.find(post => post.id == req.params.postingID)
    if (post === undefined) {
        res.sendStatus(404)
    }
    else {
        res.json(post)
    }
})

//delete posting by id
app.delete('/postings/:postingID', passport.authenticate('jwt', { session : false }), (req, res) => {
    const deletedPost = postings.find(post => post.id == req.params.postingID)
    if ( deletedPost === undefined) {
        res.sendStatus(404)
    }
    else {
        if ( deletedPost.seller === req.user.userName ) {
            postings.splice(deletedPost, 1)
            res.sendStatus(200)
        }
        else {
            res.sendStatus(401)
        }
    }
})

//modify posting by id
app.put('/postings/:postingID', passport.authenticate('jwt', { session : false }), modifiedPostValidation, upload.array('photos', 4), (req, res) => {
    const modifiedPost = postings.findIndex(post => post.id == req.params.postingID)
    if ( modifiedPost === undefined) {
        res.sendStatus(404)
    }
    else {
        if ( postings[modifiedPost].seller === req.user.userName ) {
            if (req.body.title != undefined ) {
                postings[modifiedPost].title = req.body.title
            }
            if (req.body.description != undefined ) {
                postings[modifiedPost].description = req.body.description
            }
            if (req.body.category != undefined ) {
                postings[modifiedPost].category = req.body.category
            }
            if (req.body.location != undefined ) {
                postings[modifiedPost].location = req.body.location
            }
            if (req.files != undefined ) {
                postings[modifiedPost].images = req.files
            }
            if (req.body.price != undefined ) {
                postings[modifiedPost].price = req.body.price
            }
            if (req.body.deliveryType != undefined ) {
                postings[modifiedPost].deliveryType = req.body.deliveryType
            }
            res.sendStatus(200)
        }
        else {
            res.sendStatus(401)
        }
    }
})

// Get postings by category, location or date
app.get('/postings/category/:category', (req, res) => {
    const category = postings.filter(d => d.category == req.params.category)
    if (category === undefined) {
        res.sendStatus(404)
    }
    else {
        res.json(category)
    }
})

app.get('/postings/location/:location', (req, res) => {
    const location = postings.filter(d => d.location == req.params.location)
    if (location === undefined) {
        res.sendStatus(404)
    }
    else {
        res.json(location)
    }
})

app.get('/postings/date/:date', (req, res) => {
    const date = postings.filter(d => d.date == req.params.date)
    if (date === undefined) {
        res.sendStatus(404)
    }
    else {
        res.json(date)
    }
})

/*---------------------------------LISTENING PORT----------------------------*/

app.set('port', (process.env.PORT || 80))

app.listen(app.get('port'), function() {
    console.log('App is running on port', app.get('port'))
})