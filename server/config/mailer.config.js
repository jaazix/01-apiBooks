const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    port: 465,               // true for 465, false for other ports
    host: "smtp.gmail.com",
    auth: {
            type: 'login',
            user:process.env.CORREO,
            pass:process.env.PASSWORD
            },
    secure: true,
    service: 'gmail'    
    });

module.exports = {
    transporter
}