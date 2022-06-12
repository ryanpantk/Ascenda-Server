//Importing Dependencies
const mongoose =  require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

//Initialising the Express App
const app = express();
app.use(helmet());              // adding Helmet to enhance your API's security
app.use(bodyParser.json());     // using bodyParser to parse JSON bodies into JS objects 
app.use(cors());                // enabling CORS for all requests
app.use(morgan('combined'));    // adding morgan to log HTTP requests

//Connect to Database
mongoose.connect("mongodb://localhost:27017/bookingData", { useNewUrlParser:true });

//Schema
const bookingDataSchema = new mongoose.Schema ({
    name: String,
    email: String
})

//Model
const BookingData = mongoose.model("BookingData", bookingDataSchema)

const bookingData = new BookingData ({
    name: 'Ryan',
    email: 'ryanpantk@gmail.com'
});

/*
bookingData.save();

BookingData.insertMany([], function(err) {
    if (err) {
        console.log(err) 
    } else {
        console.log("Successfully saved!")
    }
})
*/