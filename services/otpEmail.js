const nodemailer = require('nodemailer');
let MAIL_SETTINGS = {
    service: "Gmail",
    auth: {
        user: 'ascenda.otp@gmail.com',
        pass: process.env.MAIL_PASSWORD
    }
}
const transporter = nodemailer.createTransport(MAIL_SETTINGS);

module.exports.sendMail = async (params) => {
try {
    let info = await transporter.sendMail({
    from: MAIL_SETTINGS.auth.user,
    to: params.to, 
    subject: 'Hello',
    html: `
    <div
        class="container"
        style="max-width: 90%; margin: auto; padding-top: 20px"
    >
        <h2>Thank you for booking your hotel with us</h2>
        <h4>You can view your booking with the following credentials ✔</h4>
        <p style="margin-bottom: 30px;">Booking ID</p>
        <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${params.bookingID}</h1>
        <p style="margin-bottom: 30px;">Password</p>
        <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${params.password}</h1>
    </div>
    `,
    });
    return info;
} catch (error) {
    console.log(error);
    return false;
}
};