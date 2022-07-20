//Importing Dependencies
const mongoose =  require('mongoose');
let config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const {router} = require('./routes/routes');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const bookingModel = require('./models/bookingModel');

/*
Initialising the Express App
*/

const app = express();
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000'  //"PLACEHOLDER" client-side url
}));
if(config.util.getEnv('NODE_ENV') !== 'test') {              // adding Helmet to enhance your API's security
  app.use(morgan('combined'));    // adding morgan to log HTTP requests
  mongoose.set('debug', false);
}
app.use('/apis', router)
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
Webhook to update payment status in DB when successful payment intent is triggered by Stripe
*/

app.post('/webhook',bodyParser.raw({type: '*/*'}), async function(request, response) {
    const sig = request.headers['stripe-signature'];
    const body = request.body;
    let event = null;
  
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_KEY);
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
Connect to Database
*/

mongoose.connect(config.DATABASE_URL, { useNewUrlParser:true });
global.database = mongoose.connection
database.on('error', (error) => {
    console.log(error);
})

database.once('connected', () => {
    console.log('Database Connected');
})

/*
Start Server at Port 5000
*/

app.listen(5000, () => {
    console.log(`Server Started at ${5000}`)
})

module.exports = app; // for testing