const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const sendMail = ({ to, subject, html }) =>
  transporter.sendMail({ from: `"VendorBridge" <${process.env.EMAIL_SENDER}>`, to, subject, html });

module.exports = sendMail;
