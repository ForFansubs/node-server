const express = require('express')
const router = express.Router()
const check_permission = require('../../validation/check_permission')
const log_success = require('../../methods/log_success')
const mariadb = require('../../config/maria')
const error_messages = require("../../config/error_messages")
const slugify = require('../../methods/slugify').permissionSlugify

// @route   POST api/yetki/yetki-ekle
// @desc    Update permission (perm: "add-permission")
// @access  Private
router.post('/yetki-ekle', async (req, res) => {
    const { name, color, permission_set } = req.body

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "add-permission")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }


    const newPerm = {
        name: name,
        color: color,
        permission_set: permission_set,
        slug: slugify(name)
    }
    newPerm.permission_set = JSON.stringify(newPerm.permission_set)
    const keys = Object.keys(newPerm)
    const values = Object.values(newPerm)

    try {
        const result = await mariadb(`INSERT INTO permission (${keys.join(', ')}) VALUES (${values.map(value => `'${value}'`).join(',')})`)
        res.status(200).json({ 'success': 'success' })
        log_success('add-permission', username, result.insertId)
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

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "update-permission")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    const updatedPerm = {
        name: name,
        color: color,
        permission_set: permission_set
    }
    updatedPerm.permission_set = JSON.stringify(updatedPerm.permission_set)
    const keys = Object.keys(updatedPerm)
    const values = Object.values(updatedPerm)
    try {
        await mariadb(`UPDATE permission SET ${keys.map((key, index) => `${key} = '${values[index]}'`)} WHERE id='${id}'`)
        res.status(200).json({ 'success': 'success' })
        log_success('update-permission', username, id)
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

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-permission")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        permission = await mariadb(`SELECT name FROM permission WHERE id='${permission_id}'`)
        await mariadb.query(`DELETE FROM permission WHERE id=${permission_id}`)
        res.status(200).json({ 'success': 'success' })
        log_success('delete-permission', username, '', permission[0].name)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/yetki/yetki-liste
// @desc    Get all permissions (perm: "update-permission")
// @access  Private
router.get('/yetki-liste', async (req, res) => {
    let username, user_id, perms
    try {
        const check_res = await check_permission(req.headers.authorization, "update-permission")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        perms = await mariadb(`SELECT * FROM permission`)
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
    let username, user_id, perms
    try {
        const check_res = await check_permission(req.headers.authorization, "add-permission")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        perms = await mariadb(`SELECT * FROM permission WHERE slug='${req.params.slug}'`)
        perms[0].permission_set = JSON.parse(perms[0].permission_set).join(',')
        res.status(200).json(perms[0])
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

module.exports = router;