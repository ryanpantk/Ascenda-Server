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
const bookingModel = require('./models/bookingModel');

/*
Initialising the Express App
*/

const app = express();
app.use(helmet());              // adding Helmet to enhance your API's security
app.use(cors({
    origin: 'http://localhost:3000'  //"PLACEHOLDER" client-side url
}));
app.use(morgan('combined'));    // adding morgan to log HTTP requests
app.use('/apis', routes)
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});
app.use(
  cors({
      origin: "*"
  })
)

/*
Connect to Database
*/

mongoose.connect(mongo, { useNewUrlParser:true });
global.database = mongoose.connection

database.on('error', (error) => {
    console.log(error);
})

database.once('connected', () => {
    console.log('Database Connected');
})

/*
Webhook to update payment status in DB when successful payment intent is triggered by Stripe
*/

app.post('/webhook',bodyParser.raw({type: '*/*'}), async function(request, response) {
    const sig = request.headers['stripe-signature'];
    const body = request.body;
    let event = null;
  
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, "whsec_5cbebf3b8e90f909d811558bbf763d66a1fbf86baa3938ab1c358e58ff32132b");
    } catch (err) {
      // invalid signature
      console.log(err);
      response.status(400).end();
      return;
    }
  
    let intent = null;
    switch (event['type']) {
      case 'payment_intent.succeeded':
        intent = event.data.object;
        console.log("Succeeded:", intent.id);
        await bookingModel.updateOne( {stripeID: { $eq: intent.id}},
          [
            { $set: { paymentStatus: "PAID" } },
          ]
        );
        break;
      case 'payment_intent.payment_failed':
        intent = event.data.object;
        const message = intent.last_payment_error && intent.last_payment_error.message;
        console.log('Failed:', intent.id, message);
        break;
    }
    response.sendStatus(200);
  });

/*
Start Server at Port 5000
*/

app.listen(5000, () => {
    console.log(`Server Started at ${5000}`)
})

