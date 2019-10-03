const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const is_perm = require('../../validation/is_perm')
const log_success = require('../../config/log_success')
const log_fail = require('../../config/log_fail')
const mariadb = require('../../config/maria')
const keys = require('../../config/keys');

const { NODE_ENV } = process.env

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

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

// @route   GET api/kullanici/kayit/admin
// @desc    Register user (perm: "add-user")
// @access  Private
router.post('/kayit/admin', (req, res) => {
    const { name, email, password } = req.body

    is_perm(req.headers.authorization, "add-user").then(({ is_perm, username }) => {
        if (is_perm) {
            const { errors, isValid } = validateRegisterInput(req.body);
            // Check Validation
            if (!isValid) {
                return res.status(400).json(errors);
            }
            mariadb.query(`SELECT name, email FROM user WHERE email='${email}' OR name='${name}'`).then(user => {
                if (user[0]) {
                    errors.username = "Kullanıcı adı veya email kullanılıyor."
                    return res.status(400).json({
                        ...errors,
                        'err': 'Kullanıcı adı veya email kullanılıyor'
                    });
                } else {
                    const avatar = gravatar.url(req.body.email, {
                        s: '200', // Size
                        r: 'pg', // Rating
                        d: 'mm' // Default
                    });
                    let newUser = {
                        slug: slugify(name),
                        name: name,
                        email: email,
                        avatar,
                        password: password,
                        activated: 1,
                    }
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            newUser.password = hash;
                            const keys = Object.keys(newUser)
                            const values = Object.values(newUser)
                            mariadb.query(`INSERT INTO user (${keys.join(', ')}) VALUES (${values.map(value => `'${value}'`).join(',')})`)
                                .then(result => {
                                    res.status(200).json({ 'success': 'success' })
                                    log_success('add-user', username, result.insertId)
                                })
                                .catch(_ => {
                                    log_fail('add-user', username, '', name)
                                    res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
                                })
                        });
                    })
                }
            })
        }
        else {
            log_fail('add-user', username, '', name)
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    })
        .catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/kullanici/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post('/giris', (req, res) => {
    const {
        errors,
        isValid
    } = validateLoginInput(req.body);

    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    const name = req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1");
    const password = req.body.password

    // Find user by email
    mariadb.query(`SELECT name, password, avatar, activated, id FROM user WHERE name='${name}'`).then(user => {
        // Check for user
        if (!user[0]) {
            errors.username = 'Kullanıcı bulunamadı';
            return res.status(404).json({
                ...errors,
                'err': ''
            });
        }
        // Check Password
        bcrypt.compare(password, user[0].password).then(isMatch => {
            if (isMatch) {
                if (!user[0].activated) {
                    errors.username = "Kullanıcı aktif edilmemiş"

                    return res.status(403).json({
                        ...errors,
                        'err': 'Lütfen email kutunuzu kontrol edin.'
                    });
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
                        });
                    }
                );
            } else {
                errors.password = 'Şifre yanlış';
                return res.status(404).json({
                    ...errors,
                    'err': 'Kullanıcı bulunamadı'
                });
            }
        });
    });
});

// @route   POST api/kullanici/uye-guncelle
// @desc    Update user (perm: "update-user")
// @access  Private
router.post('/uye-guncelle', (req, res) => {
    const { id, slug, name, password, permission_level, avatar } = req.body
    is_perm(req.headers.authorization, "update-user").then((is_perm, username) => {
        if (is_perm) {
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
            mariadb.query(`UPDATE user SET ${keys.map((key, index) => `${key} = '${values[index]}'`)} WHERE id='${id}'`)
                .then(_ => {
                    log_success('update-user', username, id)
                    res.status(200).json({
                        'success': 'success'
                    })
                })
                .catch(_ => {
                    log_fail('update-user', username, id)
                    console.log(err)
                })
            return false
        }
        else {
            log_fail('update-user', username, id)
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/kullanici/uye-sil
// @desc    Delete user (perm: "delete-permission")
// @access  Private
router.post('/uye-sil', (req, res) => {
    const { user_id } = req.body
    is_perm(req.headers.authorization, "delete-user").then(({ is_perm, username }) => {
        if (is_perm) {
            mariadb.query(`SELECT name FROM user WHERE id='${user_id}'`)
                .then(user => {
                    mariadb.query(`DELETE FROM user WHERE id=${user_id}`)
                        .then(_ => {
                            res.status(200).json({ 'success': 'success' })
                            log_success('delete-user', username, '', user[0].name)
                        })
                        .catch(_ => {
                            log_fail('delete-user', username, user_id)
                            res.status(400).json({ 'err': 'Silme sırasında bir şeyler yanlış gitti.' })
                        })
                    return false
                })
        }
        else {
            log_fail('delete-user', username, user_id)
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/kullanici/adminpage
// @desc    Return to see if user can see the page or not (perm: "see-admin-page")
// @access  Private
router.get('/adminpage', (req, res) => {
    is_perm(req.headers.authorization, "see-admin-page").then(({ is_perm, username }) => {
        if (is_perm) {
            if (!req.query.withprops)
                return res.status(200).json({
                    'success': 'success'
                })
            else {
                mariadb.query(`SELECT (SELECT COUNT(*) FROM anime) AS ANIME_COUNT, (SELECT COUNT(*) FROM manga) AS MANGA_COUNT, (SELECT COUNT(*) FROM episode) AS EPISODE_COUNT, (SELECT COUNT(*) FROM download_link) AS DOWNLOADLINK_COUNT, (SELECT COUNT(*) FROM watch_link) AS WATCHLINK_COUNT, (SELECT COUNT(*) FROM user) AS USER_COUNT, (SELECT permission_set FROM permission WHERE slug=(SELECT permission_level FROM user WHERE name="${username}")) as PERMISSION_LIST, (SELECT name FROM permission WHERE slug=(SELECT permission_level FROM user WHERE name="${username}")) as PERMISSION_NAME`)
                    .then(count => {
                        return res.status(200).json({ ...count[0] })
                    })
            }
        }
        else {
            return res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
});

// @route   GET api/kullanici/uye-liste
// @desc    Get all users (perm: "update-permission")
// @access  Private
router.get('/uye-liste', (req, res) => {
    is_perm(req.headers.authorization, "update-permission").then(({ is_perm }) => {
        if (is_perm) {
            mariadb.query(`SELECT id, slug, name, permission_level, avatar, email FROM user`)
                .then(users => {
                    res.status(200).json(users)
                })
                .catch(err => console.log(err))
            return false
        }
        else {
            res.status(403).json({
                'err': 'Yetkisiz kullanım!'
            })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

module.exports = router;