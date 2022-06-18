//Importing Dependencies
const mongoose =  require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes/routes');

//Initialising the Express App
const app = express();
app.use(helmet());              // adding Helmet to enhance your API's security
app.use(cors());                // enabling CORS for all requests
app.use(morgan('combined'));    // adding morgan to log HTTP requests

//Connect to Database
mongoose.connect("mongodb://localhost:27017/bookingData", { useNewUrlParser:true });
const database = mongoose.connection

database.on('error', (error) => {
    console.log(error);
})

database.once('connected', () => {
    console.log('Database Connected');
})

app.use(express.json());
app.use('/apis', routes)

app.listen(3000, () => {
    console.log(`Server Started at ${3000}`)
})

