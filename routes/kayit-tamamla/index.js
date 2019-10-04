const sendMail = require('../../config/mailer').sendMail;
const SHA256 = require("crypto-js/sha256");
const express = require('express')
const router = express.Router()
const mariadb = require('../../config/maria')

router.get('/:hash', (req, res) => {
    mariadb.query(`SELECT * FROM pending_user WHERE hash_key="${req.params.hash}"`)
        .then(user => {
            if (!user[0]) {
                return res.status(404).send(`
                    <html> <head> <title>${process.env.SITE_NAME} Kayıt Tamamla</title> <style>@import url("https://fonts.googleapis.com/css?family=Rubik&display=swap"); *{font-family: "Rubik", sans-serif; box-sizing: border-box;} body{width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center;} .container{width: 400px; height: 300px; padding: 8px; justify-content: center; flex-direction: column; text-align: center;}.header{display: flex; flex-wrap: wrap; align-items: center; justify-content: center;}.header h1{margin: 0 10px;}.logo{width: 50px; height: 50px;}.subtitle{margin: 10px 0 40px;}.subtitle .buton{justify-content: center;}.buton{width: 100%; color: white!important; margin: 10px 0; padding: 10px 16px; background-color: #fc4646; text-decoration: none;}</style> </head> <body> <div class="container"> <div class="header"> <img class="logo" src="${process.env.HOST_URL}/512.png"/> <h1>${process.env.SITE_NAME}</h1> </div><div> <p class="subtitle"> Bu linke bağlı bir hesap bulunamadı. Hesap zaten doğrulanmış olabilir. </p></div></div></body></html>
                `)
            }
            user = user[0]
            if ((new Date()).valueOf() - 600000 > user.created_time.valueOf()) {
                return res.status(400).send(`
                    <html> <head> <title>${process.env.SITE_NAME} Kayıt Tamamla</title> <style>@import url("https://fonts.googleapis.com/css?family=Rubik&display=swap"); *{font-family: "Rubik", sans-serif; box-sizing: border-box;} body{width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center;} .container{width: 400px; height: 300px; padding: 8px; justify-content: center; flex-direction: column; text-align: center;}.header{display: flex; flex-wrap: wrap; align-items: center; justify-content: center;}.header h1{margin: 0 10px;}.logo{width: 50px; height: 50px;}.subtitle{margin: 10px 0 40px;}.subtitle .buton{justify-content: center;}.buton{width: 100%; color: white!important; margin: 10px 0; padding: 10px 16px; background-color: #fc4646; text-decoration: none;}</style> </head> <body> <div class="container"> <div class="header"> <img class="logo" src="${process.env.HOST_URL}/512.png"/> <h1>${process.env.SITE_NAME}</h1> </div><div> <p class="subtitle"> Bu linkin süresi dolmuş. Yenisini istemek için lütfen aşağıdaki butona bas. </p><a class="buton" href="${process.env.HOST_URL}/kayit-tamamla/${user.hash_key}/yenile" > Yeni link iste </a> </div></div></body></html>
                `)
            } else {
                mariadb.query(`UPDATE user SET activated="1" WHERE id="${user.user_id}"`)
                    .then(_ => {
                        mariadb.query(`DELETE FROM pending_user WHERE user_id="${user.user_id}"`).catch(err => console.log(err))
                        return res.status(200).send(`
                    <html> <head> <title>${process.env.SITE_NAME} Kayıt Tamamla</title> <style>@import url("https://fonts.googleapis.com/css?family=Rubik&display=swap"); *{font-family: "Rubik", sans-serif; box-sizing: border-box;}body{width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center;}.container{width: 400px; height: 300px; padding: 8px; justify-content: center; flex-direction: column; text-align: center;}.header{display: flex; flex-wrap: wrap; align-items: center; justify-content: center;}.header h1{margin: 0 10px;}.logo{width: 50px; height: 50px;}.subtitle{margin: 10px 0 40px;}.subtitle .buton{justify-content: center;}.buton{width: 100%; color: white!important; margin: 10px 0; padding: 10px 16px; background-color: #fc4646; text-decoration: none;}</style> </head> <body> <div class="container"> <div class="header"> <img class="logo" src="${process.env.HOST_URL}/512.png"/> <h1>${process.env.SITE_NAME}</h1> </div><div> <p class="subtitle"> Kayıt işlemi tamamlandı. Bu sayfayı kapatıp hesabınıza giriş yapabilirsiniz. </p></div></div></body></html>
                `)
                    })
                    .catch(_ => res.status(500).send(`
                        <html> <head> <title>${process.env.SITE_NAME} Kayıt Tamamla</title> <style>@import url("https://fonts.googleapis.com/css?family=Rubik&display=swap"); *{font-family: "Rubik", sans-serif; box-sizing: border-box;}body{width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center;}.container{width: 400px; height: 300px; padding: 8px; justify-content: center; flex-direction: column; text-align: center;}.header{display: flex; flex-wrap: wrap; align-items: center; justify-content: center;}.header h1{margin: 0 10px;}.logo{width: 50px; height: 50px;}.subtitle{margin: 10px 0 40px;}.subtitle .buton{justify-content: center;}.buton{width: 100%; color: white!important; margin: 10px 0; padding: 10px 16px; background-color: #fc4646; text-decoration: none;}</style> </head> <body> <div class="container"> <div class="header"> <img class="logo" src="${process.env.HOST_URL}/512.png"/> <h1>${process.env.SITE_NAME}</h1> </div><div> <p class="subtitle"> Aktive etme işlemi sırasında bir hata meydana geldi. Lütfen daha sonra tekrar deneyin. </p></div></div></body></html>
                    `))
            }
        })
        .catch(err => {
            console.log(err)
            res.status(404).send(`
        <html>
            <head>
                <title>${process.env.SITE_NAME}</title>
            </head>
            <body>
            </body>
            <script>
                window.location.href= "${process.env.HOST_URL}/404"
            </script>
        </html>`)
        });
})

router.get('/:hash/yenile', (req, res) => {
    mariadb.query(`SELECT * FROM pending_user WHERE hash_key="${req.params.hash}"`)
        .then(user => {
            if (!user[0]) {
                return res.status(404).send(`
                    <html> <head> <title>${process.env.SITE_NAME} Kayıt Tamamla</title> <style>@import url("https://fonts.googleapis.com/css?family=Rubik&display=swap"); *{font-family: "Rubik", sans-serif; box-sizing: border-box;} body{width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center;} .container{width: 400px; height: 300px; padding: 8px; justify-content: center; flex-direction: column; text-align: center;}.header{display: flex; flex-wrap: wrap; align-items: center; justify-content: center;}.header h1{margin: 0 10px;}.logo{width: 50px; height: 50px;}.subtitle{margin: 10px 0 40px;}.subtitle .buton{justify-content: center;}.buton{width: 100%; color: white!important; margin: 10px 0; padding: 10px 16px; background-color: #fc4646; text-decoration: none;}</style> </head> <body> <div class="container"> <div class="header"> <img class="logo" src="${process.env.HOST_URL}/512.png"/> <h1>${process.env.SITE_NAME}</h1> </div><div> <p class="subtitle"> Bu linke bağlı bir hesap bulunamadı. Hesap zaten doğrulanmış olabilir. </p></div></div></body></html>
                `)
            }
            user = user[0]
            const hash = SHA256(`${(new Date()).toString()} ${user.user_id}`)
            mariadb.query(`SELECT email, name FROM user WHERE id="${user.user_id}"`)
                .then(u => {
                    var tzoffset = (new Date()).getTimezoneOffset() * 60000;
                    var localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
                    mariadb.query(`UPDATE pending_user SET hash_key = "${hash}", created_time = "${localISOTime}" WHERE user_id="${user.user_id}"`)
                        .then(_ => {
                            const payload = {
                                to: u[0].email,
                                subject: `${process.env.SITE_NAME} Mail Onaylama - no-reply`,
                                text: "",
                                html: `<html> <head> <style>@import url("https://fonts.googleapis.com/css?family=Rubik&display=swap"); *{font-family: "Rubik", sans-serif; box-sizing: border-box;}.container{width: 400px; height: 300px; padding: 8px; justify-content: center; flex-direction: column; text-align: center;}.header{display: flex; align-items: center; justify-content: center;}.header h1{margin: 0 10px;}.logo{width: 50px; height: 50px;}.subtitle{margin: 10px 0 40px;}.subtitle .buton{justify-content: center;}.buton{width: 100%; color: white!important; margin: 10px 0; padding: 10px 16px; background-color: #fc4646; text-decoration: none;}</style> </head> <body> <div class="container"> <div class="header"> <img class="logo" src="${process.env.HOST_URL}/512.png"/> <h1>${process.env.SITE_NAME}</h1> </div><div> <p class="subtitle">Sitemize hoş geldin ${u[0].name}.  Kaydını tamamlamak için lütfen aşağıdaki butona bas. </p><a class="buton" href="${process.env.HOST_URL}/kayit-tamamla/${hash}" > Kaydı tamamla </a> </div></div></body></html>`
                            }
                            sendMail(payload)
                                .then(_ => {
                                    return res.status(200).send(`
                                <html> <head> <title>${process.env.SITE_NAME} Kayıt Tamamla</title> <style>@import url("https://fonts.googleapis.com/css?family=Rubik&display=swap"); *{font-family: "Rubik", sans-serif; box-sizing: border-box;} body{width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center;} .container{width: 400px; height: 300px; padding: 8px; justify-content: center; flex-direction: column; text-align: center;}.header{display: flex; flex-wrap: wrap; align-items: center; justify-content: center;}.header h1{margin: 0 10px;}.logo{width: 50px; height: 50px;}.subtitle{margin: 10px 0 40px;}.subtitle .buton{justify-content: center;}.buton{width: 100%; color: white!important; margin: 10px 0; padding: 10px 16px; background-color: #fc4646; text-decoration: none;}</style> </head> <body> <div class="container"> <div class="header"> <img class="logo" src="${process.env.HOST_URL}/512.png"/> <h1>${process.env.SITE_NAME}</h1> </div><div> <p class="subtitle"> Yeni doğrulama linki mail adresinize gönderildi. </p></div></div></body></html>
                            `)
                                })
                        })
                })
                .catch(err => {
                    console.log(err)
                    mariadb.query(`DELETE FROM user WHERE id=${user.user_id}`)
                        .catch(_ => console.log(`${user.user_id} id'li kullanıcının hash'i oluşturuldu, fakat mail yollayamadık. Fazlalık hesabı da silerken bir sorunla karşılaştık.`))
                })
        })
        .catch(err => {
            console.log(err)
            res.status(404).send(`
        <html>
            <head>
                <title>${process.env.SITE_NAME}</title>
            </head>
            <body>
            </body>
            <script>
                window.location.href= "${process.env.HOST_URL}/404"
            </script>
        </html>`)
        });
})

module.exports = router;