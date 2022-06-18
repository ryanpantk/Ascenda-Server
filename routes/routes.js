const express = require('express');
const mongoose =  require('mongoose');
const bookingModel = require('../models/bookingModel');
const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
mongoose.set('debug', true);

router.post('/postBooking', async (req, res) => {
    let bookingData = new bookingModel ({
        salutation: req.body.salutation,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        countryCode: req.body.countryCode,
        phoneNumber: req.body.phoneNumber,
        email: req.body.email,
        specialRequests: req.body.specialRequests,
        creditCardNumber: req.body.creditCardNumber,
        creditCardName: req.body.creditCardName,
        creditCardExpiry: req.body.creditCardExpiry,
        creditCardVV: req.body.creditCardVV,
        billingCountry: req.body.Country,
        billingCity: req.body.billingCity,
        billingPostal: req.body.billingPostal,
        billingAddress: req.body.billingAddress,
        destinationID: req.body.destinationID,
        hotelID: req.body.hotelID,
        bookingID: req.body.bookingID,
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
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
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
        res.send(result)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

//Delete by ID Method
router.delete('/deleteOneBooking/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const data = await bookingModel.findByIdAndDelete(id)
        res.send(`Document with id ${data._id} has been deleted..`)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

module.exports = router;