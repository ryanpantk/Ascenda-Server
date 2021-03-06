const express = require('express');
const axios = require('axios');
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

/*
Encrypting text
*/

function encrypt(text) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}   
 
/*
Decrypting text
*/
function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

/*
POST booking information into mongoDB after user submit booking
*/

router.post('/postBooking', async (req, res) => {
    console.log(req.body);
    try {
        if (req.body.salutation == null || req.body.firstName == null || req.body.lastName == null || req.body.countryCode == null || req.body.phoneNumber == null || req.body.email == null  || req.body.stripeID == null || req.body.destinationID == null  || req.body.hotelID == null || req.body.roomType == null || req.body.totalPrice == null || req.body.startDate == null || req.body.endDate == null) {
            res.status(400).json({message: "Bad Request. Parameters cannot be null or missing."})
        }
        else {
            let bookingData = new bookingModel ({
                salutation: req.body.salutation,
                firstName: encrypt(req.body.firstName),
                lastName: encrypt(req.body.lastName),
                countryCode: encrypt(req.body.countryCode),
                phoneNumber: encrypt(req.body.phoneNumber),
                email: encrypt(req.body.email),
                specialRequests: req.body.specialRequests,
                paymentStatus: "UNPAID",
                stripeID: req.body.stripeID,
                destinationID: req.body.destinationID,
                hotelID: req.body.hotelID,
                bookingID: crypto.randomUUID(),
                numberOfRoom: req.body.numberOfRoom,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                numberOfAdult: req.body.numberOfAdult,
                numberOfChild: req.body.numberOfChild,
                roomType: req.body.roomType,
                totalPrice: req.body.totalPrice
            });

                const dataToSave = await bookingData.save();
                res.status(200).json(dataToSave)
        }
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

/*
POST for /api/hotels/prices
*/

router.post('/hotelsPrice', async (req, res) => {

    try {
        if (req.body.url == null) {
            res.status(400).json({message: "URL must be provided"})
        } else {
            let ping1 = await axios.get(req.body.url);
            const ping2 = await axios.get(req.body.url);
            res.status(200).json(ping2.data)
        }
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

/*
POST for /api/hotels/:id/prices
*/

router.post('/hotelPrice', async (req, res) => {
    try {
        if (req.body.url == null) {
            res.status(400).json({message: "URL must be provided"})
        } else {
            const ping1 = await axios.get(req.body.url);
            const ping2 = await axios.get(req.body.url);
            res.status(200).json(ping2.data)
        }
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

/*
POST for /api/hotels
*/

router.post('/hotelsDetail', async (req, res) => {
    try {
        if (req.body.url == null) {
            res.status(400).json({message: "URL must be provided"})
        } else {
            const data = await axios.get(req.body.url);
            res.status(200).json(data.data)
        }
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

/*
POST for /api/hotels/:id
*/

router.post('/hotelDetail', async (req, res) => {
    try {
        if (req.body.url == null) {
            res.status(400).json({message: "URL must be provided"})
        } else {
            const data = await axios.get(req.body.url);
            data.data.status = data.status
            res.status(200).json(data.data)
        }
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

/*
GET destination using MongoDB Atlas Search (Autocomplete Search)
- fuzzy set to 1 to allow typo errors that are off by 1 character
*/

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
                            "maxEdits": 1,
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

/*
POST Stripe Create a Session 
https://stripe.com/docs/api/checkout/sessions/create
*/

router.post('/create-checkout-session', async (req,res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment', 
            line_items: [
                {
                  price_data: {
                    currency: "sgd",
                    unit_amount: Math.round(req.body.unit_amount*100),
                    product_data: {
                      name: "Hotel",
                    },
                  },
                  quantity: 1,
                },
              ],
            success_url: 'http://localhost:3000/',  //"PLACEHOLDER"
            cancel_url: 'http://localhost:3000/' //"PLACEHOLDER"
        });
        res.status(200).json({
            url: session.url,
            payment_intent: session.payment_intent
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

module.exports = {router, encrypt, decrypt};