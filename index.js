//Importing Dependencies
const mongoose =  require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes/routes');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const mongo = process.env.DATABASE_URL;

//Initialising the Express App
const app = express();
app.use(helmet());              // adding Helmet to enhance your API's security
app.use(cors({
    origin: 'http://localhost:3000'  //"PLACEHOLDER" client-side url
}));
app.use(morgan('combined'));    // adding morgan to log HTTP requests

//Connect to Database
// mongoose.connect("mongodb://localhost:27017/bookingData", { useNewUrlParser:true });
mongoose.connect(mongo, { useNewUrlParser:true });
global.database = mongoose.connection

database.on('error', (error) => {
    console.log(error);
})

database.once('connected', () => {
    console.log('Database Connected');
})

app.use(express.json());
app.use('/apis', routes)

app.listen(5000, () => {
    console.log(`Server Started at ${5000}`)
})

