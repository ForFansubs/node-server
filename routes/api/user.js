const sendMail = require('../../methods/mailer').sendMail
const SHA256 = require("crypto-js/sha256")
const express = require('express')
const router = express.Router()
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const check_permission = require('../../validation/check_permission')
const log_success = require('../../methods/log_success')
const log_fail = require('../../methods/log_fail')
const mariadb = require('../../config/maria')
const keys = require('../../config/keys')
const error_messages = require("../../config/error_messages")

const { NODE_ENV } = process.env

// Load Input Validation
const validateRegisterInput = require('../../validation/register')
const validateLoginInput = require('../../validation/login')

const slugify = text => {
    const a = 'àáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ♭·/_,:;'
    const b = 'aaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzhf------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c =>
            b.charAt(a.indexOf(c))) // Replace special chars
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '') // Trim - from end of text
}

// @route   GET api/kullanici/kayit
// @desc    Register user
// @access  Public
router.post('/kayit', async (req, res) => {
    const { name, email, password } = req.body
    const { errors, isValid } = validateRegisterInput(req.body)
    let user
    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors)
    }
    try {
        user = await mariadb(`SELECT name, email FROM user WHERE email='${email}' OR name='${name}'`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: "Database bağlantısı kurulamıyor." })
    }
    if (user[0]) {
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
        let newUser = {
            slug: slugify(name),
            name: name,
            email: email,
            avatar,
            password: password,
            activated: 0,
        }
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, async (err, p_hash) => {
                let user_result, insert_result
                if (err) return console.log(err);
                newUser.password = p_hash;
                const keys = Object.keys(newUser)
                const values = Object.values(newUser)
                try {
                    user_result = await mariadb(`INSERT INTO user (${keys.join(', ')}) VALUES (${values.map(value => `'${value}'`).join(',')})`)
                } catch (err) {
                    console.log(err)
                    return res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
                }
                const c_hash = SHA256(`${(new Date()).toString()} ${user_result.insertId}`)
                try {
                    insert_result = await mariadb(`INSERT INTO pending_user (user_id, hash_key) VALUES (${user_result.insertId}, "${c_hash}")`)
                } catch (err) {
                    try {
                        mariadb(`DELETE FROM user WHERE id=${user_result.insertId}`)
                    } catch (err) {
                        console.log(`${user_result.insertId} id'li kullanıcının hash'i oluşturulamadı. Fazlalık hesabı da silerken bir sorunla karşılaştık.`)
                    }
                    return res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
                }
                const payload = {
                    to: email,
                    subject: `${process.env.SITE_NAME} Mail Onaylama - no-reply`,
                    text: "",
                    html: `<html> <head> <style>@import url("https://fonts.googleapis.com/css?family=Rubik&display=swap"); *{font-family: "Rubik", sans-serif; box-sizing: border-box;}.container{width: 400px; height: 300px; padding: 8px; justify-content: center; flex-direction: column; text-align: center;}.header{display: flex; align-items: center; justify-content: center;}.header h1{margin: 0 10px;}.logo{width: 50px; height: 50px;}.subtitle{margin: 10px 0 40px;}.subtitle .buton{justify-content: center;}.buton{width: 100%; color: white!important; margin: 10px 0; padding: 10px 16px; background-color: #fc4646; text-decoration: none;}</style> </head> <body> <div class="container"> <div class="header"> <img class="logo" src="${process.env.HOST_URL}/512.png"/> <h1>${process.env.SITE_NAME}</h1> </div><div> <p class="subtitle"> Sitemize hoş geldin ${name}. Kaydını tamamlamak için lütfen aşağıdaki butona bas. (Bu link 10 dakika sonra geçersiz olacaktır.) </p><a class="buton" href="${process.env.HOST_URL}/kayit-tamamla/${c_hash}" > Kaydı tamamla </a> </div></div></body></html>`
                }
                try {
                    await sendMail(payload)
                    res.status(200).json({ 'success': 'success' })
                } catch (error) {
                    res.status(400).json({ 'err': 'Mail yollama sırasında bir sorun oluştu. Lütfen yöneticiyle iletişime geçin.' })
                    try {
                        mariadb(`DELETE FROM user WHERE id=${user_result.insertId}`)
                    } catch (err) {
                        console.log(`${user_result.insertId} id'li kullanıcının hash'i oluşturuldu, fakat mail yollayamadık. Fazlalık hesabı da silerken bir sorunla karşılaştık.`)
                    }
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

    const { errors, isValid } = validateRegisterInput(req.body)
    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors)
    }
    try {
        user = await mariadb(`SELECT name, email FROM user WHERE email='${email}' OR name='${name}'`)
    } catch (err) {
        console.log(err)
        return res.status(400).json({ err: "Database bağlantısı kurulamıyor." })
    }
    if (user[0]) {
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
        let newUser = {
            slug: slugify(name),
            name: name,
            email: email,
            avatar,
            password: password,
            activated: 1,
        }
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, async (err, p_hash) => {
                let user_insert
                if (err) throw err;
                newUser.password = p_hash;
                const keys = Object.keys(newUser)
                const values = Object.values(newUser)
                try {
                    user_insert = await mariadb(`INSERT INTO user (${keys.join(', ')}) VALUES (${values.map(value => `'${value}'`).join(',')})`)
                } catch (err) {
                    console.log(err)
                    log_fail('add-user', username, '', name)
                    return res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
                }
                log_success('add-user', username, user_insert.insertId)
                return res.status(200).json({ 'success': 'success' })
            })
        })
    }
})

// @route   GET api/kullanici/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post('/giris', async (req, res) => {
    let user

    const {
        errors,
        isValid
    } = validateLoginInput(req.body)

    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors)
    }

    const name = req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
    const password = req.body.password

    // Find user by email
    try {
        user = await mariadb(`SELECT name, password, avatar, activated, id FROM user WHERE name='${name}'`)
    } catch (err) {
        console.log(err)
    }
    // Check for user
    if (!user[0]) {
        errors.username = 'Kullanıcı bulunamadı';
        return res.status(404).json({
            ...errors,
            'err': ''
        })
    }
    // Check Password
    bcrypt.compare(password, user[0].password).then(isMatch => {
        if (isMatch) {
            if (!user[0].activated) {
                errors.username = "Kullanıcı aktif edilmemiş"

                return res.status(403).json({
                    ...errors,
                    'err': 'Lütfen emailinizi kontrol edin.'
                })
            }
            // User Matched
            const payload = {
                id: user[0].id,
                username: user[0].name,
                avatar: user[0].avatar
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
                        username: user[0].name,
                        avatar: user[0].avatar,
                        exp: NODE_ENV === "development" ? (Date.now() + 315360000000) : (Date.now() + 43200000)
                    })
                }
            )
        } else {
            errors.password = 'Şifre yanlış';
            return res.status(404).json({
                ...errors,
                'err': 'Kullanıcı bulunamadı'
            })
        }
    })
})

// @route   POST api/kullanici/uye-guncelle
// @desc    Update user (perm: "update-user")
// @access  Private
router.post('/uye-guncelle', async (req, res) => {
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
        slug,
        name,
        permission_level,
        avatar
    }

    if (password) {
        const getSalt = bcrypt.genSaltSync(10)
        const getHash = bcrypt.hashSync(password, getSalt)
        updatedUser.password = getHash;
    }

    const keys = Object.keys(updatedUser)
    const values = Object.values(updatedUser)
    try {
        await mariadb(`UPDATE user SET ${keys.map((key, index) => `${key} = '${values[index]}'`)} WHERE id='${id}'`)
        log_success('update-user', username, id)
        res.status(200).json({
            'success': 'success'
        })
    } catch (err) {
        log_fail('update-user', username, id)
        console.log(err)
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
        user = await mariadb(`SELECT name FROM user WHERE id='${user_id_body}'`)
    } catch (err) {
        console.log(err)
    }

    try {
        await mariadb(`DELETE FROM user WHERE id=${user_id_body}`)
        res.status(200).json({ 'success': 'success' })
        log_success('delete-user', username, '', user[0].name)
    } catch (err) {
        log_fail('delete-user', username, user_id_body)
        res.status(400).json({ 'err': 'Silme sırasında bir şeyler yanlış gitti.' })
    }
})

// @route   GET api/kullanici/adminpage
// @desc    Return to see if user can see the page or not (perm: "see-admin-page")
// @access  Private
router.get('/adminpage', async (req, res) => {
    let username, user_id, count
    try {
        const check_res = await check_permission(req.headers.authorization, "see-admin-page")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        res.status(403).json({ 'err': err })
    }

    if (!req.query.withprops)
        return res.status(200).json({
            'success': 'success'
        })
    else {
        try {
            count = await mariadb(`SELECT (SELECT COUNT(*) FROM anime) AS ANIME_COUNT, (SELECT COUNT(*) FROM manga) AS MANGA_COUNT, (SELECT COUNT(*) FROM episode) AS EPISODE_COUNT, (SELECT COUNT(*) FROM download_link) AS DOWNLOADLINK_COUNT, (SELECT COUNT(*) FROM watch_link) AS WATCHLINK_COUNT, (SELECT COUNT(*) FROM user) AS USER_COUNT, (SELECT permission_set FROM permission WHERE slug=(SELECT permission_level FROM user WHERE name="${username}")) as PERMISSION_LIST, (SELECT name FROM permission WHERE slug=(SELECT permission_level FROM user WHERE name="${username}")) as PERMISSION_NAME`)
        } catch (err) {
            console.log(err)
        }
        return res.status(200).json({ ...count[0] })
    }
})

// @route   GET api/kullanici/uye-liste
// @desc    Get all users (perm: "update-permission")
// @access  Private
router.get('/uye-liste', async (req, res) => {
    let username, user_id, users
    try {
        const check_res = await check_permission(req.headers.authorization, "update-permission")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        res.status(403).json({ 'err': err })
    }

    try {
        users = await mariadb(`SELECT id, slug, name, permission_level, avatar, email FROM user`)
        res.status(200).json(users)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: error_messages.database_error })
    }
})

module.exports = router;