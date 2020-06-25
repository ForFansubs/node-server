const sendMail = require('../../methods/mailer').sendMail
const SHA256 = require("crypto-js/sha256")
const express = require('express')
const router = express.Router()
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const check_permission = require('../../middlewares/check_permission')
const mariadb = require('../../config/maria')
const Sequelize = require('sequelize')
const sequelize = require('../../config/sequelize')
const keys = require('../../config/keys')
const error_messages = require("../../config/error_messages")
const standartSlugify = require('standard-slugify')

const User = require('../../models/User')
const PendingUser = require('../../models/PendingUser')

const { NODE_ENV } = process.env

const { LogAddUser, LogUpdateUser, LogDeleteUser } = require('../../methods/database_logs')
const { Validation, ValidateUserRegistration, ValidateUserLogin } = require('../../middlewares/validate')
const console_logs = require('../../methods/console_logs')

// @route   GET api/kullanici/kayit
// @desc    Register user
// @access  Public
router.post('/kayit', ValidateUserRegistration(), Validation, async (req, res) => {
    const { name, email, password } = req.body
    const errors = {}

    let user

    try {
        user = await User.findOne({ where: { email: email, name: name }, raw: true })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: "Database bağlantısı kurulamıyor." })
    }

    if (user) {
        errors.username = "Kullanıcı adı veya email kullanılıyor."
        return res.status(400).json({
            ...errors,
            'err': 'Kullanıcı adı veya email kullanılıyor'
        })
    }

    else {
        const avatar = gravatar.url(req.body.email, {
            s: '200', // Size
            r: 'pg', // Rating
            d: 'mm' // Default
        })


        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, p_hash) => {
                let user_result, insert_result
                if (err) return console.log(err);

                try {
                    user_result = await User.create({
                        slug: standartSlugify(name),
                        name: name,
                        email: email,
                        avatar,
                        password: p_hash,
                        activated: 0,
                    })
                } catch (err) {
                    console.log(err)
                    return res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
                }
                const c_hash = SHA256(`${(new Date()).toString()} ${user_result.insertId}`).toString()

                console.log(c_hash)
                try {
                    insert_result = await PendingUser.create({
                        user_id: user_result.id,
                        hash_key: c_hash
                    })
                } catch (err) {
                    console.log(err)
                    try {
                        await User.destroy({ where: { id: user_result.id } })
                    } catch (err) {
                        console.log(`${user_result.id} id'li kullanıcının hash'i oluşturulamadı. Fazlalık hesabı da silerken bir sorunla karşılaştık.`)
                    }
                    return res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
                }
                const payload = {
                    to: email,
                    subject: `${process.env.SITE_NAME} Mail Onaylama - no-reply`,
                    text: "",
                    html: `<html> <head> <style>@import url("https://fonts.googleapis.com/css?family=Rubik&display=swap"); *{font-family: "Rubik", sans-serif; box-sizing: border-box;}.container{width: 400px; height: 300px; padding: 8px; justify-content: center; flex-direction: column; text-align: center;}.header{display: flex; align-items: center; justify-content: center;}.header h1{margin: 0 10px;}.logo{width: 50px; height: 50px;}.subtitle{margin: 10px 0 40px;}.subtitle .buton{justify-content: center;}.buton{width: 100%; color: white!important; margin: 10px 0; padding: 10px 16px; background-color: #fc4646; text-decoration: none;}</style> </head> <body> <div class="container"> <div class="header"> <img class="logo" src="${process.env.HOST_URL}/512.png"/> <h1>${process.env.SITE_NAME}</h1> </div><div> <p class="subtitle"> Sitemize hoş geldin ${name}. Kaydını tamamlamak için lütfen aşağıdaki butona bas. (Bu link 10 dakika sonra geçersiz olacaktır.) </p><a class="buton" href="${process.env.HOST_URL}/kullanici/kayit-tamamla/${c_hash}" > Kaydı tamamla </a> </div></div></body></html>`
                }
                try {
                    await sendMail(payload)
                    res.status(200).json({ 'success': 'success' })
                } catch (err) {
                    console.log(err)
                    try {
                        await User.destroy({ where: { id: user_result.id } })
                        await PendingUser.destroy({ where: { user_id: user_result.id } })
                    } catch (err) {
                        console.log(`${user_result.id} id'li kullanıcının hash'i oluşturuldu, fakat mail yollayamadık. Fazlalık hesabı da silerken bir sorunla karşılaştık.`)
                    }
                    res.status(400).json({ 'err': 'Mail yollama sırasında bir sorun oluştu. Lütfen yöneticiyle iletişime geçin.' })
                }
            })
        })
    }
})

// @route   GET api/kullanici/kayit/admin
// @desc    Register user (perm: "add-user")
// @access  Private
router.post('/kayit/admin', async (req, res) => {
    const { name, email, password } = req.body

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "add-user")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        res.status(403).json({ 'err': err })
    }


    // TODO: VALIDATE BODY
    const { errors, isValid } = {}
    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors)
    }
    try {
        user = await User.findOne({ where: { email: email, name: name }, raw: true })
    } catch (err) {
        console.log(err)
        return res.status(400).json({ err: "Database bağlantısı kurulamıyor." })
    }
    if (user) {
        errors.username = "Kullanıcı adı veya email kullanılıyor."
        return res.status(400).json({
            ...errors,
            'err': 'Kullanıcı adı veya email kullanılıyor'
        })
    } else {
        const avatar = gravatar.url(req.body.email, {
            s: '200', // Size
            r: 'pg', // Rating
            d: 'mm' // Default
        })

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, async (err, p_hash) => {
                let result
                if (err) throw err;

                try {
                    result = await User.create({
                        slug: standartSlugify(name),
                        name: name,
                        email: email,
                        avatar,
                        password: p_hash,
                        activated: 1,
                    })

                } catch (err) {
                    console.log(err)
                    return res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
                }

                LogAddUser({
                    process_type: 'add-user',
                    username: username,
                    user_id: result.id
                })

                return res.status(200).json({ 'success': 'success' })
            })
        })
    }
})

// @route   GET api/kullanici/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post('/giris', ValidateUserLogin(), Validation, async (req, res) => {
    let user

    // Genel kontrollerden sonra farklı hata çıkarsa
    const errors = {}

    const name = req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
    const password = req.body.password

    // Find user by email
    try {
        user = await User.findOne({ raw: true, where: { name: name }, attributes: ['name', 'password', 'avatar', 'activated', 'id'] })
    } catch (err) {
        console.log(err)
    }

    // Check for user
    if (!user.name) {
        errors.name = 'Kullanıcı bulunamadı'
        return res.status(404).json({
            ...errors
        })
    }

    // Check Password
    bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
            if (!user.activated) {
                errors.name = "Kullanıcı aktif edilmemiş"

                return res.status(403).json({
                    ...errors,
                    'err': 'Lütfen emailinizi kontrol edin.'
                })
            }
            // User Matched
            const payload = {
                id: user.id,
                name: user.name,
                avatar: user.avatar
            }; // Create JWT Payload
            // Sign Token
            jwt.sign(
                payload,
                keys.secretOrKey, {
                expiresIn: NODE_ENV === "development" ? '3650d' : '12h'
            },
                (err, token) => {
                    res.json({
                        success: true,
                        token,
                        username: user.name,
                        avatar: user.avatar,
                        exp: NODE_ENV === "development" ? (Date.now() + 315360000000) : (Date.now() + 43200000)
                    })
                }
            )
        } else {
            errors.password = 'Şifre yanlış';
            return res.status(404).json({
                ...errors,
                'err': 'Kullanıcı adınız ya da şifreniz yanlış.'
            })
        }
    })
})

// @route   POST api/kullanici/uye-guncelle
// @desc    Update user (perm: "update-user")
// @access  Private
router.post('/uye-guncelle', ValidateUserRegistration(), Validation, async (req, res) => {
    const { id, slug, name, password, permission_level, avatar } = req.body

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "update-user")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        res.status(403).json({ 'err': err })
    }

    const updatedUser = {

    }


    try {
        await User.update({
            slug,
            name,
            permission_level,
            avatar
        }, { where: { id: id } })

        if (password) {
            User.update({ password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)) }, { where: { id: id } })
        }

        LogUpdateUser({
            process_type: 'update-user',
            username: username,
            user_id: id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/kullanici/uye-sil
// @desc    Delete user (perm: "delete-permission")
// @access  Private
router.post('/uye-sil', async (req, res) => {
    let user
    const user_id_body = req.body.user_id

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-user")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        res.status(403).json({ 'err': err })
    }

    try {
        user = await User.findOne({ raw: true, where: { id: user_id_body } })
    } catch (err) {
        console.log(err)
    }

    try {
        await User.destroy({ where: user_id_body })

        LogDeleteUser({
            process_type: 'delete-user',
            username: username,
            name: user.name
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   POST api/kullanici/kayit-tamamla
// @desc    Activate user on correct hash
// @access  Public
router.post('/kayit-tamamla', async (req, res) => {
    let { hash } = req.body

    try {
        const { hash_key, user_id, created_time } = await PendingUser.findOne({ raw: true, where: { hash_key: hash } })

        if (!user_id || !hash_key || !created_time) {
            return res.status(404).json({ 'err': "Kullanıcı kaydı bulunamadı!" })
        }

        if ((new Date()).valueOf() - 600000 > created_time.valueOf()) {
            return res.status(200).json({ success: "refresh" })
        }

        await User.update({ activated: 1 }, { where: { id: user_id } })
        await PendingUser.destroy({ where: { hash_key: hash_key } })

        return res.status(200).json({ success: "success" })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   POST api/kullanici/kayit-tamamla
// @desc    Refresh user hash with old hash
// @access  Public
router.post('/kayit-tamamla/yenile', async (req, res) => {
    let { old_hash } = req.body

    try {
        const { hash_key, user_id, created_time, email, username } = await PendingUser.findOne({
            raw: true, where: { hash_key: old_hash },
            attributes: [
                '*',
                [
                    Sequelize.literal(`(SELECT email FROM user WHERE id=pending_user.user_id)`),
                    'email'
                ],
                [
                    Sequelize.literal(`(SELECT name FROM user WHERE id=pending_user.user_id)`),
                    'username'
                ]
            ]
        })

        if (!user_id || !hash_key || !created_time) {
            return res.status(404).json({ 'err': "Kullanıcı kaydı bulunamadı!" })
        }

        const hash = SHA256(`${(new Date()).toString()} ${user_id}`).toString()

        await PendingUser.destroy({ where: { hash_key: hash_key } })

        insert_result = await PendingUser.create({
            user_id: user_id,
            hash_key: hash
        })

        await sendMail({
            to: email,
            subject: `${process.env.SITE_NAME} Mail Onaylama - no-reply`,
            text: "",
            html: `<html> <head> <style>@import url("https://fonts.googleapis.com/css?family=Rubik&display=swap"); *{font-family: "Rubik", sans-serif; box-sizing: border-box;}.container{width: 400px; height: 300px; padding: 8px; justify-content: center; flex-direction: column; text-align: center;}.header{display: flex; align-items: center; justify-content: center;}.header h1{margin: 0 10px;}.logo{width: 50px; height: 50px;}.subtitle{margin: 10px 0 40px;}.subtitle .buton{justify-content: center;}.buton{width: 100%; color: white!important; margin: 10px 0; padding: 10px 16px; background-color: #fc4646; text-decoration: none;}</style> </head> <body> <div class="container"> <div class="header"> <img class="logo" src="${process.env.HOST_URL}/512.png"/> <h1>${process.env.SITE_NAME}</h1> </div><div> <p class="subtitle">Sitemize hoş geldin ${username}.  Kaydını tamamlamak için lütfen aşağıdaki butona bas. </p><a class="buton" href="${process.env.HOST_URL}/kullanici/kayit-tamamla/${hash}" > Kaydı tamamla </a> </div></div></body></html>`
        })

        return res.status(200).json({ success: "success" })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/kullanici/adminpage
// @desc    Return to see if user can see the page or not (perm: "see-admin-page")
// @access  Private
router.get('/adminpage', async (req, res) => {
    let username, count
    try {
        const check_res = await check_permission(req.headers.authorization, "see-admin-page")
        username = check_res.username
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    if (!req.query.withprops)
        return res.status(200).json({
            'success': 'success'
        })
    else {
        try {
            [count] = await sequelize.query(`
            SELECT (SELECT COUNT(*) FROM anime) AS ANIME_COUNT,
            (SELECT COUNT(*) FROM manga) AS MANGA_COUNT,
            (SELECT COUNT(*) FROM episode) AS EPISODE_COUNT,
            (SELECT COUNT(*) FROM download_link) AS DOWNLOADLINK_COUNT,
            (SELECT COUNT(*) FROM watch_link) AS WATCHLINK_COUNT,
            (SELECT COUNT(*) FROM user) AS USER_COUNT,
            (SELECT permission_set FROM permission WHERE slug=(SELECT permission_level FROM user WHERE name="${username}")) as PERMISSION_LIST,
            (SELECT name FROM permission WHERE slug=(SELECT permission_level FROM user WHERE name="${username}")) as PERMISSION_NAME`, { type: Sequelize.QueryTypes.SELECT })
        } catch (err) {
            console.log(err)
        }
        return res.status(200).json(count)
    }
})

// @route   GET api/kullanici/uye-liste
// @desc    Get all users (perm: "update-permission")
// @access  Private
router.get('/uye-liste', async (req, res) => {
    let users
    try {
        await check_permission(req.headers.authorization, "update-permission")
    } catch (err) {
        res.status(403).json({ 'err': err })
    }

    try {
        users = await User.findAll({
            attributes: [
                'id',
                'slug',
                'name',
                'permission_level',
                'avatar',
                'email'
            ]
        })
        res.status(200).json(users)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: error_messages.database_error })
    }
})

module.exports = router;