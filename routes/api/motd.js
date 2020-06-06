const express = require('express')
const router = express.Router()
const mariadb = require('../../config/maria')
const check_permission = require('../../middlewares/check_permission')
const error_messages = require('../../config/error_messages')
const { LogAddMotd } = require('../../methods/database_logs')

// @route   GET api/motd/motd-ekle
// @desc    Add motd (add-motd)
// @access  Private
router.post('/motd-ekle', async (req, res) => {
    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "add-motd")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        console.log(err)
        return res.status(403).json({ 'err': err })
    }

    const { is_active, title, subtitle, content_type, content_id, can_user_dismiss } = req.body

    if ((!content_type && content_id) || (content_type && !content_id) || !subtitle) return res.status(400).json({ 'err': error_messages.bad_request })

    const newEpisode = {
        is_active: is_active ? is_active : 1,
        title: title ? title : "",
        subtitle: subtitle ? subtitle : "",
        content_type: content_type ? content_type : "",
        content_id: content_id ? content_id : null,
        can_user_dismiss: can_user_dismiss ? can_user_dismiss : 1,
        created_by: user_id
    }

    const keys = Object.keys(newEpisode)
    const values = Object.values(newEpisode)
    try {
        const result = await mariadb(`INSERT INTO motd (${keys.join(', ')}) VALUES (${values.map(value => value ? `"${value}"` : `NULL`).join(',')})`)

        LogAddMotd({
            username: username,
            motd_id: result.isertId
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/motd/motd-sil
// @desc    Delete motd (delete-motd)
// @access  Private
router.post('/motd-sil', async (req, res) => {
    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-motd")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    const { motd_id } = req.body

    if (!motd_id) return res.status(400).json({ 'err': error_messages.bad_request })

    try {
        await mariadb(`DELETE FROM motd WHERE id=${motd_id}`)

        LogDeleteMotd({
            username: username,
            motd_id: motd_id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/motd/motd-sil
// @desc    Delete motd (delete-motd)
// @access  Private
router.post('/', async (req, res) => {
    const { content_id, content_type } = req.params

    if ((!content_type && content_id) || (content_type && !content_id)) return res.status(400).json({ 'err': error_messages.bad_request })

    try {
        const motd = await mariadb(`
        SELECT
        id,
        is_active,
        title,
        subtitle,
        content_type,
        content_id,
        can_user_dismiss,
        (SELECT name FROM user WHERE id=motd.created_by) as created_by
        FROM motd
        ${content_id && content_type ?
                `WHERE content_id="${content_id}" AND content_type="${content_type}"`
                :
                ""
            }
        ORDER BY id
        DESC`)

        res.status(200).json(motd)
    } catch (err) {
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

module.exports = router;