const nodemailer = require('nodemailer')
const { NODE_ENV } = process.env

async function sendMail(payload) {
    let testAccount
    if (NODE_ENV === "development") {
        testAccount = await nodemailer.createTestAccount();
    }

    const transporter = nodemailer.createTransport({
        direct: true,
        host: NODE_ENV === "production" ? process.env.SMTP_HOST : "smtp.ethereal.email",
        port: NODE_ENV === "production" ? process.env.SMTP_PORT : 587,
        auth: {
            user: NODE_ENV === "production" ? process.env.SMTP_USERNAME : testAccount.user,
            pass: NODE_ENV === "production" ? process.env.SMTP_PASSWORD : testAccount.pass
        },
        secure: NODE_ENV === "production" ? process.env.SMTP_PORT === "587" || process.env.SMTP_PORT === "25" ? false : true : false
    })

    const from = `${process.env.SITE_NAME} <${process.env.SMTP_USERNAME}>`

    const { to, subject, text, html } = payload

    const mailOptions = {
        from,
        to,
        subject,
        text,
        html
    }

    let info = await transporter.sendMail(mailOptions)

    console.log("Message sent: %s", info.messageId)

    if (NODE_ENV === "development") {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
}

module.exports = { sendMail }