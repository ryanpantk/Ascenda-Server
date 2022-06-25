const express = require('express');
const mongoose =  require('mongoose');
const crypto = require('crypto');
const bookingModel = require('../models/bookingModel');
const encryption = require('../middleware/encryption');
require('dotenv').config();

const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post('/postBooking', async (req, res) => {
    let bookingData = new bookingModel ({
        //customer information
        salutation: req.body.salutation,
        firstName: encryption.encrypt(req.body.firstName),
        lastName: encryption.encrypt(req.body.lastName),
        countryCode: encryption.encrypt(req.body.countryCode),
        phoneNumber: encryption.encrypt(req.body.phoneNumber),
        email: encryption.encrypt(req.body.email),
        specialRequests: encryption.encrypt(req.body.specialRequests),
        //financial information
        creditCardNumber: req.body.creditCardNumber,
        creditCardName: req.body.creditCardName,
        creditCardExpiry: req.body.creditCardExpiry,
        creditCardVV: req.body.creditCardVV,
        billingCountry: req.body.Country,
        billingCity: req.body.billingCity,
        billingPostal: req.body.billingPostal,
        billingAddress: req.body.billingAddress,
        //booking information
        destinationID: req.body.destinationID,
        hotelID: req.body.hotelID,
        bookingID: crypto.randomUUID(),
        numberOfNights: req.body.numberOfNights,
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
        data.firstName = encryption.decrypt(data.firstName);
        data.lastName = encryption.decrypt(data.lastName);
        data.countryCode = encryption.decrypt(data.countryCode);
        data.phoneNumber = encryption.decrypt(data.phoneNumber);
        data.email = encryption.decrypt(data.email);
        res.json(data);
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

//Stripe
router.post('/create-checkout-session', async (req,res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment', 
            line_items: {
                price_data: {
                    currency: 'sgd', //"PLACEHOLDER"
                    product_data: {
                        name: "PLACEHOLDER"
                    },
                    unit_amount: 10000 //"PLACEHOLDER"
                },
                quantity: 1 //"PLACEHOLDER"
            },
            success_url: `${process.env.CLIENT_URL}/success.html`,  //"PLACEHOLDER"
            cancel_url: `${process.env.CLIENT_URL}/cancel.html` //"PLACEHOLDER"
        });
        res.json({url: session.url});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})
   

module.exports = router;