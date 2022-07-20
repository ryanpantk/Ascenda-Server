process.env.NODE_ENV = 'test';
let mongoose = require("mongoose");
let Booking = require('../models/bookingModel');
const {encrypt, decrypt} = require('../routes/routes');
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
const { expect } = require("chai");
let should = chai.should();

chai.use(chaiHttp);
//Our parent block
describe('PostBooking', () => {
    before((done) => { //Before each test we empty the database
        Booking.remove({}, (err) => { 
           done();           
        });        
    });

    /*
    * Test Encryption
    Input: String 
    Output: Object with initialization vector and encrypted data
    Function being tested: encrypt()
    Expected Output: input_str != test_output
    */
   
    describe('/encryption', () => {
        it('inserted string is encrypted', (done) => {
            const str = "Hello";
            const encrypted = encrypt(str);
            const test_output = encrypted.encryptedData;
            expect(encrypted).to.be.an("object");
            expect(test_output).to.be.a("string");
            expect(test_output).to.not.equal(str);
            done()
        });
    });

    /*
    * Test Decryption
    Input: Object with initialization vector and encrypted data
    Output: String
    Function being tested: decrypt()
    Expected Output: test_output == input_str
    */
   
    describe('/decryption', () => {
        it('decrypted string is same as input string', (done) => {
            const str = "Hello";
            const encrypted = encrypt(str);
            const encrypted_value = encrypted.encryptedData;
            expect(encrypted).to.be.an("object");
            expect(encrypted_value).to.be.a("string");
            expect(encrypted_value).to.not.equal(str);
            const test_output = decrypt(encrypted);
            expect(test_output).to.be.a("string");
            expect(test_output).to.equal(str);
            done()
        });
    });

    /*
    * Test the /POST BOOKING route (Successful)
    Input: booking JSON object
    Output: status code 200 and a newly-created JSON object
    Function being tested: router.post('/postBooking')
    Expected Output: status code === 200 && all booking parameters posted are in a newly-created JSON object
    */
   
    describe('/POST book', () => {
        it('it should POST one booking', (done) => {
            let booking = {
                salutation: "Mr.",
                firstName: "Ryan",
                lastName: "Pan",
                countryCode: "SG",
                phoneNumber: "98765432",
                email: "a@gmail.com",
                specialRequests: "NIL",
                destinationID: "diH7",
                hotelID: "RsBU",
                numberOfRoom: "3",
                startDate: "2022-09-30",
                endDate: "2022-10-02",
                numberOfAdult: "2",
                numberOfChild: "0",
                stripeID: "placeholder",
                roomType: "placeholder",
                totalPrice: "placeholder"
            }
            chai.request(server)
                .post('/apis/postBooking')
                .send(booking)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    res.type.should.eql("application/json");
                    res.body.should.have.property("salutation");
                    res.body.should.have.property("firstName");
                    res.body.should.have.property("lastName");
                    res.body.should.have.property("countryCode");
                    res.body.should.have.property("phoneNumber");
                    res.body.should.have.property("email");
                    res.body.should.have.property("specialRequests");
                    res.body.should.have.property("destinationID");
                    res.body.should.have.property("hotelID");
                    res.body.should.have.property("startDate");
                    res.body.should.have.property("endDate");
                    res.body.should.have.property("numberOfAdult");
                    res.body.should.have.property("numberOfChild");
                    res.body.should.have.property("roomType");
                    res.body.should.have.property("totalPrice");
                    res.body.should.have.property("stripeID");
                done();
                });
        });
    });

    /*
    * Test the /POST BOOKING route (Null Parameters)
    Input: booking JSON object
    Output: status code 400 and an error message
    Function being tested: router.post('/postBooking')
    Expected Output: status code === 400 && 'Bad Request. Parameters cannot be null'
    */
   
    describe('/POST book', () => {
        it('POST one booking should return 400 Null Parameters', (done) => {
            let booking = {
                salutation: null,
                firstName: "Ryan",
                lastName: "Pan",
                countryCode: "SG",
                phoneNumber: "98765432",
                email: "a@gmail.com",
                specialRequests: "NIL",
                destinationID: "diH7",
                hotelID: "RsBU",
                numberOfRoom: "3",
                startDate: "2022-09-30",
                endDate: "2022-10-02",
                numberOfAdult: "2",
                numberOfChild: "0",
                stripeID: "placeholder",
                roomType: "placeholder",
                totalPrice: "placeholder"
            }
            chai.request(server)
                .post('/apis/postBooking')
                .send(booking)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message');
                    res.body.message.should.equal('Bad Request. Parameters cannot be null or missing.');
                done();
                });
        });
    });

    /*
    * Test the /POST BOOKING route (Missing Parameters)
    Input: booking JSON object
    Output: status code 400 and an error message
    Function being tested: router.post('/postBooking')
    Expected Output: status code === 400 && 'Bad Request. Parameters cannot be null'
    */
   
    describe('/POST book', () => {
        it('POST one booking should return 400 Missing Parameters', (done) => {
            let booking = {
                salutation: "Mr.",
                firstName: "Ryan",
                lastName: "Pan",
            }
            chai.request(server)
                .post('/apis/postBooking')
                .send(booking)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message');
                    res.body.message.should.equal('Bad Request. Parameters cannot be null or missing.');
                done();
                });
        });
    });

    /*
    * Test POST for /api/hotels (Successful)
    Input: JSON object with property "url"
    Output: status code 200 and an array of hotel details JSON object
    Function being tested: router.post('/hotelDetail')
    Expected Output: status code === 200 && an array of hotel details JSON object
    */
   
    describe('/POST hotelsDetails', () => {
        it('POST hotels detail success', (done) => {
            let payload = {
                url: "https://hotelapi.loyalty.dev/api/hotels?destination_id=RsBU"
            }
            chai.request(server)
                .post('/apis/hotelsDetail')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("array");
                done();
                });
        });
    });

    /*
    * Test POST for /api/hotels (Missing URL)
    Input: JSON object with no property "url"
    Output: status code 400 and error message
    Function being tested: router.post('/hotelDetail')
    Expected Output: status code === 400 && error message
    */
   
    describe('/POST hotelsDetail', () => {
        it('POST hotels details failed (missing url)', (done) => {
            let payload = {
            }
            chai.request(server)
                .post('/apis/hotelDetail')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message');
                    res.body.message.should.equal('URL must be provided');
                done();
                });
        });
    });

    /*
    * Test POST for /api/hotels/:id (Successful)
    Input: JSON object with property "url"
    Output: status code 200 and hotel details JSON object
    Function being tested: router.post('/hotelDetail')
    Expected Output: status code === 200 && hotel details JSON object
    */
   
    describe('/POST hotelDetail', () => {
        it('POST hotel detail success', (done) => {
            let payload = {
                url: "https://hotelapi.loyalty.dev/api/hotels/diH7"
            }
            chai.request(server)
                .post('/apis/hotelDetail')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    res.type.should.eql("application/json");
                    res.body.should.have.property('id');
                    res.body.should.have.property('name');
                    res.body.should.have.property('description');
                    res.body.should.have.property('image_details');
                    res.body.should.have.property('longitude');
                    res.body.should.have.property('latitude');
                done();
                });
        });
    });

    /*
    * Test POST for /api/hotels/:id (Missing URL)
    Input: JSON object with no property "url"
    Output: status code 400 and error message
    Function being tested: router.post('/hotelDetail')
    Expected Output: status code === 400 && error message
    */
   
    describe('/POST hotelDetail', () => {
        it('POST hotel detail failed (missing url)', (done) => {
            let payload = {
            }
            chai.request(server)
                .post('/apis/hotelDetail')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message');
                    res.body.message.should.equal('URL must be provided');
                done();
                });
        });
    });

    /*
    * Test POST for /api/hotels/prices (Successful)
    Input: JSON object with property "url"
    Output: status code 200 and array of hotel objects
    Function being tested: router.post('/hotelsPrice')
    Expected Output: status code === 200 && array of hotel objects
    */
   
    describe('/POST hotelsPrice', () => {
        it('POST hotels price success', (done) => {
            let payload = {
                url: "https://hotelapi.loyalty.dev/api/hotels/prices?destination_id=RsBU&checkin=2022-08-20&checkout=2022-08-21&lang=en_US&currency=SGD&country_code=SG&guests=1&partner_id=1"
            }
            chai.request(server)
                .post('/apis/hotelsPrice')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    res.type.should.eql("application/json");
                    res.body.should.have.property('completed');
                    res.body.should.have.property('currency');
                    res.body.currency.should.equal("SGD");
                    res.body.should.have.property('hotels');
                    res.body.hotels.should.be.a("array");
                done();
                });
        });
    });

    /*
    * Test POST for /api/hotels/price (Missing URL)
    Input: JSON object with no property "url"
    Output: status code 400 and hotel prices JSON object
    Function being tested: router.post('/hotelsPrice')
    Expected Output: status code === 400 && error message
    */
   
    describe('/POST hotelsPrice', () => {
        it('POST hotels detail failed (missing url)', (done) => {
            let payload = {
            }
            chai.request(server)
                .post('/apis/hotelsPrice')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message');
                    res.body.message.should.equal('URL must be provided');
                done();
                });
        });
    });

    /*
    * Test POST for /api/hotels/:id/prices (Successful)
    Input: JSON object with property "url"
    Output: status code 200 and hotel prices JSON object
    Function being tested: router.post('/hotelsPrice')
    Expected Output: status code === 200 && hotel details JSON object
    */
   
    describe('/POST /hotelPrice', () => {
        it('POST hotel price success', (done) => {
            let payload = {
                url: "https://hotelapi.loyalty.dev/api/hotels/diH7/price?destination_id=WD0M&checkin=2022-08-14&checkout=2022-08-17&lang=en_US&currency=SGD&guests=2&partner_id=1&country_code=SG"
            }
            chai.request(server)
                .post('/apis/hotelPrice')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    res.type.should.eql("application/json");
                    res.body.should.have.property('completed');
                    res.body.completed.should.equal(true);
                    res.body.should.have.property('rooms');
                done();
                });
        });
    });

    /*
    * Test POST for /api/hotels/:id/prices (Missing URL)
    Input: JSON object with no property "url"
    Output: status code 400 && error message
    Function being tested: router.post('/hotelsPrice')
    Expected Output: status code === 400 && error message
    */
   
    describe('/POST /hotelPrice', () => {
        it('POST hotel detail failed (missing url)', (done) => {
            let payload = {
            }
            chai.request(server)
                .post('/apis/hotelPrice')
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.have.property('message');
                    res.body.message.should.equal('URL must be provided');
                done();
                });
        });
    });

    /*
    * Test GET destination using MongoDB Atlas Search (Autocomplete Search)
    Input: String
    Output: List of possible destinations
    Function being tested:router.get('/destination/:id')
    Expected Output: List of possible destinations
    */
   
    describe('/GET /destination/:id', () => {
        it('Destination (Autocomplete Search)', (done) => {
            let payload = "singap"
            chai.request(server)
                .get(`/apis/destination/${payload}`)
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("array").that.contains({ _id: "62bd905afc8b14c1dff71a8c", term: 'Singapore, Singapore', uid: 'RsBU'})
                done();
                });
        });
    });

    /*
    * Test GET destination using MongoDB Atlas Search (Autocomplete Search) WITH 1 CHAR TYPO
    Input: String WITH 1 CHAR TYPO
    Output: List of possible destinations
    Function being tested:router.get('/destination/:id')
    Expected Output: List of possible destinations
    */
   
    describe('/GET /destination/:id', () => {
        it('Destination (Autocomplete Search with 1 character typo)', (done) => {
            let payload = "simgap"
            chai.request(server)
                .get(`/apis/destination/${payload}`)
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("array").that.contains({ _id: "62bd905afc8b14c1dff71a8c", term: 'Singapore, Singapore', uid: 'RsBU'})
                done();
                });
        });
    });

    /*
    * Test GET destination using MongoDB Atlas Search (Autocomplete Search) WITH 2 CHAR TYPO
    Input: String WITH 2 CHAR TYPO
    Output: List of possible destinations
    Function being tested:router.get('/destination/:id')
    Expected Output: List of possible destinations
    */
   
    describe('/GET /destination/:id', () => {
        it('Destination (Autocomplete Search with 2 character typo)', (done) => {
            let payload = "slmgap"
            chai.request(server)
                .get(`/apis/destination/${payload}`)
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("array").that.not.contains({ _id: "62bd905afc8b14c1dff71a8c", term: 'Singapore, Singapore', uid: 'RsBU'})
                done();
                });
        });
    });

    /*
    * Test POST Stripe Create a Session 
    Input: Unit amount with integer amount
    Output: Stripe Checkout Session url
    Function being tested:router.post('/create-checkout-session')
    Expected Output: Stripe Checkout Session url
    */
   
    describe('/POST /create-checkout-session', () => {
        it('Create Checkout Session (Integer)', (done) => {
            let payload = {
                unit_amount: 512
            }
            chai.request(server)
                .post(`/apis/create-checkout-session`)
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("url");
                done();
                });
        });
    });

    /*
    * Test POST Stripe Create a Session 
    Input: Unit amount with decimal place
    Output: Stripe Checkout Session url
    Function being tested:router.post('/create-checkout-session')
    Expected Output: Stripe Checkout Session url
    */
   
    describe('/POST /create-checkout-session', () => {
        it('Create Checkout Session (Decimal Place)', (done) => {
            let payload = {
                unit_amount: 512.75
            }
            chai.request(server)
                .post(`/apis/create-checkout-session`)
                .send(payload)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property("url");
                done();
                });
        });
    });

});