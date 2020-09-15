const express = require('express')
const router = express.Router()
const check_permission = require('../../middlewares/check_permission')
const error_messages = require("../../config/error_messages")
const standartSlugify = require('standard-slugify')

const { LogAddPermission, LogUpdatePermission, LogDeletePermission } = require('../../methods/database_logs')

// Models
const { Permission } = require("../../config/sequelize")

// @route   POST api/yetki/yetki-ekle
// @desc    Update permission (perm: "add-permission")
// @access  Private
router.post('/yetki-ekle', async (req, res) => {
    const { name, color, permission_set } = req.body

    let username
    try {
        const check_res = await check_permission(req.headers.authorization, "add-permission")
        username = check_res.username
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        const result = await Permission.create({
            name: name,
            color: color,
            permission_set: permission_set,
            slug: standartSlugify(name)
        })

        LogAddPermission({
            process_type: 'add-permission',
            username: username,
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
router.post('/yetki-guncelle', async (req, res) => {
    const { id, name, color, permission_set } = req.body

    let username
    try {
        const check_res = await check_permission(req.headers.authorization, "update-permission")
        username = check_res.username
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        await Permission.update({
            name: name,
            color: color,
            permission_set: permission_set
        }, { where: { id: id } })

        LogUpdatePermission({
            process_type: 'update-permission',
            username: username,
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
router.post('/yetki-sil', async (req, res) => {
    let permission
    const { permission_id } = req.body

    let username
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-permission")
        username = check_res.username
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        permission = await Permission.findOne({ where: { id: permission_id } })
        await Permission.destroy({ where: { id: permission_id } })

        LogDeletePermission({
            process_type: 'delete-permission',
            username: username,
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
router.get('/yetki-liste', async (req, res) => {
    try {
        await check_permission(req.headers.authorization, "update-permission")
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

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
router.get('/:slug', async (req, res) => {
    const { slug } = req.params

    try {
        await check_permission(req.headers.authorization, "add-permission")
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

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