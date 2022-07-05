const express = require('express');
const crypto = require('crypto');
const bookingModel = require('../models/bookingModel');
const { MongoClient } = require("mongodb");
require('dotenv').config();

const router = express.Router()
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
const client = new MongoClient(process.env.DATABASE_URL);

const algorithm = 'aes-256-cbc'; 
const key = process.env.SECRET_KEY;
const iv = crypto.randomBytes(16);

//Encrypting text
function encrypt(text) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}   
 
// Decrypting text
function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

router.post('/postBooking', async (req, res) => {
    let bookingData = new bookingModel ({
        //Customer Profile Information
        salutation: req.body.salutation,
        firstName: encrypt(req.body.firstName),
        lastName: encrypt(req.body.lastName),
        countryCode: encrypt(req.body.countryCode),
        phoneNumber: encrypt(req.body.phoneNumber),
        email: encrypt(req.body.email),
        specialRequests: req.body.specialRequests,
        //Credit Card Information
        stripeID: req.body.stripeID,
        paymentStatus: "unpaid",
        //Hotel Booking Information
        destinationID: req.body.destinationID,
        hotelID: req.body.hotelID,
        bookingID: crypto.randomUUID(),
        numberOfRoom: req.body.numberOfRoom,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        numberOfAdult: req.body.numberOfAdult,
        numberOfChild: req.body.numberOfChild,
        roomType: req.body.roomType,
        averagePrice: req.body.averagePrice,
        totalPrice: req.body.totalPrice
    });

    try {
        const dataToSave = await bookingData.save();
        res.status(200).json(dataToSave)
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

//Get by ID Method
router.get('/getOneBooking/:id', async (req, res) => {
    try{
        const data = await bookingModel.findById(req.params.id);
        data.firstName = decrypt(data.firstName);
        data.lastName = decrypt(data.lastName);
        data.countryCode = decrypt(data.countryCode);
        data.phoneNumber = decrypt(data.phoneNumber);
        data.email = decrypt(data.email);
        res.json(data);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
})

//Get by ID Method
router.get('/destination/:id', async (req, res) => {
    try{
        await client.connect();
        // set namespace
        const database = client.db("test");
        const coll = database.collection("destination");
        let result = await coll.aggregate([
            {
                "$search": {
                    "index": 'default',
                    "autocomplete": {
                        "query": `${req.params.id}`,
                        "path": "term",
                        "fuzzy": {
                            "maxEdits": 2,
                            "prefixLength": 2
                        }
                    }
                }
            },
            {
                $project: {
                  _id: 1,
                  term: 1,
                  uid: 1
                },
            },
            { 
                $limit: 8 
            },
        ]).toArray();
        res.send(result);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
    
})


//Update by ID Method
router.patch('/updateOneBooking/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updatedData = req.body;
        const options = { new: true };

        const result = await bookingModel.findByIdAndUpdate(
            id, updatedData, options
        )
        res.send(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
})

//Delete by ID Method
router.delete('/deleteOneBooking/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const data = await bookingModel.findByIdAndDelete(id);
        res.send(`Document with id ${data._id} has been deleted..`);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
})

//Stripe Create a Session 
//https://stripe.com/docs/api/checkout/sessions/create
router.post('/create-checkout-session', async (req,res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment', 
            line_items: [
                {
                  price_data: {
                    currency: "sgd",
                    unit_amount: 500,
                    product_data: {
                      name: "name of the product",
                    },
                  },
                  quantity: 1,
                },
              ],
            success_url: 'http://localhost:3000/',  //"PLACEHOLDER"
            cancel_url: 'http://localhost:3000/' //"PLACEHOLDER"
        });
        res.json({
            url: session.url,
            sessionID: session.id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

//Stripe Retrieve a Session
//https://stripe.com/docs/api/checkout/sessions/retrieve
router.get('/get-checkout-session', async (req,res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(
            req.body.sessionID
        );
        res.json({
            stripeID: session.client_reference_id,
            paymentStatus: session.payment_status //"paid", "unpaid", "no_payment_required"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})   

module.exports = router;