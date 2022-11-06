const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const redis = require('redis');
const { MongoClient } = require("mongodb");
const { generateOTP } = require('../services/otp'); 
const { sendMail } = require('../services/otpEmail');
const bookingModel = require('../models/bookingModel');
const sleep = require('util').promisify(setTimeout);
const router = express.Router();
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
require('isomorphic-fetch');

//Parameters for Routing
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

//Parameters for Encryption
const algorithm = 'aes-256-cbc';
const key = process.env.SECRET_KEY;
const iv = crypto.randomBytes(16);

//MongoDB Connection
const client = new MongoClient(process.env.DATABASE_URL);

//Redis Connection
const redis_client = redis.createClient({
    url:'redis://default:dyzGxINnZejFiAClaPbmSoJ71XnUvc0m@redis-13442.c292.ap-southeast-1-1.ec2.cloud.redislabs.com:13442'
})

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
    const otpGenerated = generateOTP();
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
                paymentStatus: "UNPAID", //to be updated through Stripe Webhook
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
                totalPrice: req.body.totalPrice,
                password: otpGenerated,
                hotelName: req.body.hotelName,
                roomName: req.body.roomName,
                url: req.body.url
            });

                const dataToSave = await bookingData.save();
                //Send Booking ID and Generated Password to Email Provided
                await sendMail({
                    name: decrypt(bookingData.firstName) + " " + decrypt(bookingData.lastName),
                    to: decrypt(bookingData.email),
                    bookingID:(bookingData.bookingID),
                    password: otpGenerated,
                });
                res.status(200).json(dataToSave)
        }
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

/*
POST for /api/check-booking-credentials
*/

router.post('/check-booking-credentials', async (req, res) => {

    try {
        if (req.body.bookingID == null || req.body.password == null) {
            res.status(400).json({message: "Credentials must be provided"})
        } else {
            const result = await bookingModel.findOne({bookingID: req.body.bookingID, password: req.body.password})
            if (result != null) {
                res.status(200).json({check: true})
            } else {
                res.status(400).json({check: false, message: error.message})
            }
        }
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})


/*
GET for /api/hotels/prices
*/

router.get('/hotelsPrice/:id', async (req, res) => {
    const id = req.params.id;
    if (id == null) {
        res.status(400).json({message: "URL must be provided"})
    } 
    await redis_client.connect().catch(error => {});
    const value = await redis_client.get(`${id}`).catch(error => {});
    console.log("https://hotelapi.loyalty.dev/api/hotels/prices?destination_id=" + id)
    try {
        if (value){
            res.status(200).json(JSON.parse(value))
        } 
        else {
            let timesRun = 0;
            let ping;
            while (timesRun !==5) {
                timesRun += 1;
                console.log(timesRun)
                ping = await axios.get("https://hotelapi.loyalty.dev/api/hotels/prices?destination_id=" + id);
                if (ping != null && ping.data != null && ping.data.completed===true) {
                    break;
                } 
                (async () => {
                    await sleep(2000)
                })()
            } 
            if (ping != null && ping.data != null) {
                await redis_client.set(`${id}`, JSON.stringify(ping.data)).catch(error => {});
            }
            res.status(200).json(ping.data)
        }
        await redis_client.disconnect().catch(error => {});
    }
    catch (error) {
        await redis_client.quit().catch(error => {});
        if (error.message === "Request failed with status code 422") {
            res.status(200).json({completed: true, hotels: []})
        } else {
            res.status(400).json({message: error.message})
        }
    }
})

/*
GET for /api/hotels/prices (missing url)
*/

router.get('/hotelsPrice', async (req, res) => {
    try {
        const id = req.params.id;
        if (id == null) {
            res.status(400).json({message: "URL must be provided"})
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
            let timesRun = 0;
            let ping;
            while (timesRun !==3) {
                timesRun += 1;
                console.log(timesRun)
                ping = await axios.get(req.body.url);
                if (ping != null && ping.data != null && ping.data.completed===true) {
                    break;
                } 
                (async () => {
                    await sleep(2000)
                })()
            } 
            res.status(200).json(ping.data)
        }
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

/*
GET for /api/hotels
*/

router.get('/hotelsDetail/:id', async (req, res) => {
    const id = req.params.id;
    await redis_client.connect().catch(error => {});
    const value = await redis_client.get(`/hotelsDetail/${id}`).catch(error => {});
    try {
        if (value){
            res.status(200).json(JSON.parse(value))
        } else {
            console.log(id)
            const data = await axios.get(`https://hotelapi.loyalty.dev/api/hotels?destination_id=${id}`);
            if (data.data) {
                await redis_client.set(`/hotelsDetail/${id}`, JSON.stringify(data.data)).catch(error => {});
            }
            res.status(200).json(data.data)
        }
        console.log("connection closed")
        await redis_client.disconnect().catch(error => {});
    }
    catch (error) {
        res.status(400).json({message: error.message})
        console.log("connection closed")
        await redis_client.disconnect().catch(error => {});
    }
})

/*
GET for /api/hotels/:id (missing URL)
*/

router.get('/hotelsDetail', async (req, res) => {
    try {
        const id = req.params.id;
        if (id == null) {
            res.status(400).json({message: "URL must be provided"})
        } 
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }

})

/*
GET for /api/hotels/:id
*/

router.get('/hotelDetail/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await redis_client.connect().catch(error => {});
        const value = await redis_client.get(`/hotelDetail/${id}`).catch(error => {});
        if (value){
            res.status(200).json(JSON.parse(value))
        } else {
            console.log(id)
            const data = await axios.get(`https://hotelapi.loyalty.dev/api/hotels/${id}`);
            data.data.status = data.status
            if (data.data && data.status === 200 && data.data.rooms) {
                await redis_client.set(`/hotelDetail/${id}`, JSON.stringify(data.data)).catch(error => {});
            }
            res.status(200).json(data.data)
        }
        console.log("connection closed")
        await redis_client.disconnect().catch(error => {});
    }
    catch (error) {
        res.status(400).json({message: error.message})
        console.log("connection closed")
        await redis_client.disconnect().catch(error => {});
    }

})

/*
GET for /api/hotels/:id (missing URL)
*/

router.get('/hotelDetail', async (req, res) => {
    try {
        const id = req.params.id;
        if (id == null) {
            res.status(400).json({message: "URL must be provided"})
        } 
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }

})

/*
GET destination using MongoDB Atlas Search (Autocomplete Search)
- fuzzy set to 1 to allow typo errors that are off by 1 character
*/

router.get('/destination/:id', async (req, res) => {
    let id = `${req.params.id}`
    let replaced = id.replace("%20", " ")
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
                        "query": `${replaced}`,
                        "path": "term",
                        "fuzzy": {
                            "maxEdits": 1,
                            "prefixLength": 0
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

/*
GET by Booking ID Method
*/

router.get('/viewOneBooking/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(id);
        const result = await bookingModel.findOne({bookingID: id})
        result.firstName = decrypt(result.firstName);
        result.lastName = decrypt(result.lastName);
        result.countryCode = decrypt(result.countryCode);
        result.phoneNumber = decrypt(result.phoneNumber);
        result.email = decrypt(result.email);
        res.json(result);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})

/*
PATCH by ID Method to remove PII information
*/ 

router.patch('/updateOneBooking/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const placeholder = "-"

        const result = await bookingModel.findOneAndUpdate(
            //query filter by booking id
            {bookingID: id}, 
            //update values to remove PII
            {
                salutation: placeholder,
                firstName: encrypt(placeholder),
                lastName: encrypt(" "),
                countryCode: encrypt(placeholder),
                phoneNumber: encrypt(placeholder),
                email: encrypt(placeholder)
            },
            { new : true }
        )
        res.send(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
})

/*
GET OTP method by booking ID
*/ 

router.get('/getOTP/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const result = await bookingModel.findOne({bookingID: id})
        if (result != null) {
            const otpGenerated = generateOTP();
            try {
                await sendMail({
                    to: decrypt(result.email),
                    OTP: otpGenerated,
                });
                res.send({completed: true, message: "OTP sent"});
            } catch (error) {
                res.status(400).send({completed: false, message: "Email failed to send"});
            }

        } else {
            res.send({completed: false, message: "Cannot find booking ID"});
        }
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
            success_url: 'http://localhost:3000/', 
            cancel_url: 'http://localhost:3000/'
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