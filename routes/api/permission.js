const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const is_perm = require('../../validation/is_perm')
const log_success = require('../../config/log_success')
const log_fail = require('../../config/log_fail')
const mariadb = require('../../config/maria')

const slugify = text => {
    const a = 'àáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ♭·/_,:;'
    const b = 'aaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzhf------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
        .replace(/\s+/g, '')           // Replace spaces with -
        .replace(p, c =>
            b.charAt(a.indexOf(c)))     // Replace special chars
        .replace(/&/g, '')         // Replace & with 'and'
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '')             // Trim - from end of text
}

// @route   POST api/permission/yetki-ekle
// @desc    Update permission (perm: "add-permission")
// @access  Private
router.post('/yetki-ekle', (req, res) => {
    const {name, color, permission_set} = req.body
    is_perm(req.headers.authorization, "add-permission").then(({ is_perm, username }) => {
        if (is_perm) {
            const newPerm = {
                name: name,
                color: color,
                permission_set: permission_set,
                slug: slugify(name)
            }
            newPerm.permission_set = JSON.stringify(newPerm.permission_set.split(','))
            const keys = Object.keys(newPerm)
            const values = Object.values(newPerm)
            mariadb.query(`INSERT INTO permission (${keys.join(', ')}) VALUES (${values.map(value => `'${value}'`).join(',')})`)
                .then(result => {
                    res.status(200).json({ 'success': 'success' })
                    log_success('add-permission', username, result.insertId)
                })
                .catch(_ => {
                    log_fail('add-permission', username, '', name)
                    res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
                })
            return false
        }
        else {
            log_fail('add-permission', username, '', name)
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   POST api/permission/yetki-liste
// @desc    Update permission (perm: "update-permission")
// @access  Private
router.post('/yetki-guncelle', (req, res) => {
    const {id, name, color, permission_set} = req.body
    is_perm(req.headers.authorization, "update-permission").then(({ is_perm, username }) => {
        if (is_perm) {
            const updatedPerm = {
                name: name,
                color: color,
                permission_set: permission_set
            }
            updatedPerm.permission_set = JSON.stringify(updatedPerm.permission_set.split(','))
            const keys = Object.keys(updatedPerm)
            const values = Object.values(updatedPerm)
            mariadb.query(`UPDATE permission SET ${keys.map((key, index) => `${key} = '${values[index]}'`)} WHERE id='${id}'`)
                .then(_ => {
                    log_success('update-permission', username, id)
                    res.status(200).json({ 'success': 'success' })
                })
                .catch(_ => {
                    log_fail('update-permission', username, id)
                    res.status(400).json({ 'err': 'Güncelleme sırasında bir şeyler yanlış gitti.' })
                })
            return false
        }
        else {
            log_fail('update-permission', username, id)
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/permission/delete-permission
// @desc    Delete permission (perm: "delete-permission")
// @access  Private
router.post('/yetki-sil', (req, res) => {
    const {permission_id} = req.body
    is_perm(req.headers.authorization, "delete-permission").then(({ is_perm, username }) => {
        if (is_perm) {
            mariadb.query(`SELECT name FROM permission WHERE id='${permission_id}'`)
                .then(permission => {
                    mariadb.query(`DELETE FROM permission WHERE id=${permission_id}`)
                        .then(_ => {
                            res.status(200).json({ 'success': 'success' })
                            log_success('delete-permission', username, '', permission[0].name)
                        })
                        .catch(_ => {
                            log_fail('delete-permission', username, permission_id)
                            res.status(400).json({ 'err': 'Silme sırasında bir şeyler yanlış gitti.' })
                        })
                    return false
                })
        }
        else {
            log_fail('delete-permission', username, permission_id)
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/permission/yetki-liste
// @desc    Get all permissions (perm: "add-permission")
// @access  Private
router.get('/yetki-liste', (req, res) => {
    is_perm(req.headers.authorization, "add-permission").then(({ is_perm }) => {
        if (is_perm) {
            mariadb.query(`SELECT * FROM permission`)
                .then(perms => {
                    res.status(200).json(perms)
                })
                .catch(_ => _)
            return false
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/permission/yetki-liste
// @desc    Get all permissions (perm: "add-permission")
// @access  Private
router.get('/:slug', (req, res) => {
    is_perm(req.headers.authorization, "add-permission").then(({ is_perm }) => {
        if (is_perm) {
            mariadb.query(`SELECT * FROM permission WHERE slug='${req.params.slug}'`)
                .then(perms => {
                    perms[0].permission_set = JSON.parse(perms[0].permission_set).join(',')
                    res.status(200).json(perms[0])
                })
                .catch(err => console.log(err))
            return false
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

module.exports = router;