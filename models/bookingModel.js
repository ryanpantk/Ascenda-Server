const mongoose =  require('mongoose');
mongoose.set('debug', true);

//Schema
const bookingDataSchema = new mongoose.Schema ({
    salutation: String,
    firstName: Object,
    lastName: Object,
    countryCode: Object,
    phoneNumber: Object,
    email: Object,
    specialRequests: String,
    stripeID: String,
    destinationID: String,
    hotelID: String,
    bookingID: String,
    numberOfNights: String,
    startDate: String,
    endDate: String,
    numberOfAdult: String,
    numberOfChild: String,
    roomType: String,
    averagePrice: String,
    totalPrice: String
})


//Model
module.exports = mongoose.model('bookingdata', bookingDataSchema);