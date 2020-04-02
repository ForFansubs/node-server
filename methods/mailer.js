const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    direct: true,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    },
    secure: process.env.SMTP_PORT === "587" || process.env.SMTP_PORT === "25" ? false : true
})

const from = `${process.env.SITE_NAME} <${process.env.SMTP_USERNAME}>`

async function sendMail(payload) {
    const { to, subject, text, html } = payload

    const mailOptions = {
        from,
        to,
        subject,
        text,
        html
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error)
        }
        console.log('Message %s sent: %s', info.messageId, info.response)
    })
}

module.exports = { sendMail }