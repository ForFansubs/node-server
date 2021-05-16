const express = require('express')
const router = express.Router()
const check_permission = require('../../middlewares/check_permission')
const error_messages = require("../../config/error_messages")
const standartSlugify = require('standard-slugify')
const authCheck = require('../../middlewares/authCheck')

const { LogAddPermission, LogUpdatePermission, LogDeletePermission } = require('../../methods/database_logs')

// Models
const { Permission } = require("../../config/sequelize")

// @route   POST api/yetki/yetki-ekle
// @desc    Update permission (perm: "add-permission")
// @access  Private
router.post('/yetki-ekle', authCheck("add-permission"), async (req, res) => {
    const { name, color, permission_set } = req.body

    try {
        const result = await Permission.create({
            name: name,
            color: color,
            permission_set: permission_set,
            slug: standartSlugify(name)
        })

        LogAddPermission({
            process_type: 'add-permission',
            username: req.authUser.name,
            permission_id: result.id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   POST api/yetki/yetki-liste
// @desc    Update permission (perm: "update-permission")
// @access  Private
router.post('/yetki-guncelle', authCheck("update-permission"), async (req, res) => {
    const { id, name, color, permission_set } = req.body

    try {
        await Permission.update({
            name: name,
            color: color,
            permission_set: permission_set
        }, { where: { id: id } })

        LogUpdatePermission({
            process_type: 'update-permission',
            username: req.authUser.name,
            permission_id: id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/yetki/delete-permission
// @desc    Delete permission (perm: "delete-permission")
// @access  Private
router.post('/yetki-sil', authCheck("delete-permission"), async (req, res) => {
    let permission
    const { permission_id } = req.body

    try {
        permission = await Permission.findOne({ where: { id: permission_id } })
        await Permission.destroy({ where: { id: permission_id } })

        LogDeletePermission({
            process_type: 'delete-permission',
            username: req.authUser.name,
            permission_name: permission.name
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/yetki/yetki-liste
// @desc    Get all permissions (perm: "update-permission")
// @access  Private
router.get('/yetki-liste', authCheck("update-permission"), async (req, res) => {
    try {
        const perms = await Permission.findAll()
        res.status(200).json(perms)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/yetki/:slug
// @desc    Get all permissions (perm: "add-permission")
// @access  Private
router.get('/:slug', authCheck("add-permission"), async (req, res) => {
    const { slug } = req.params

    try {
        let perms = await Permission.findOne({ where: { slug: slug } })
        perms.permission_set = perms.permission_set.join(',')
        res.status(200).json(perms)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

module.exports = router;