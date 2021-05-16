const express = require('express')
const router = express.Router()
const check_permission = require('../../middlewares/check_permission')
const error_messages = require('../../config/error_messages')
const { LogAddMotd, LogUpdateMotd, LogDeleteMotd } = require('../../methods/database_logs')
const { GeneralAPIRequestsLimiter } = require('../../middlewares/rate-limiter')
const authCheck = require('../../middlewares/authCheck')

// Models
const { Sequelize, Motd } = require("../../config/sequelize")

// @route   GET api/motd/motd-ekle
// @desc    Add motd (add-motd)
// @access  Private
router.post('/motd-ekle', authCheck("add-motd"), async (req, res) => {
    const { is_active, title, subtitle, content_type, content_id, can_user_dismiss } = req.body

    if ((!content_type && content_id) || (content_type && !content_id) || !subtitle) return res.status(400).json({ 'err': error_messages.bad_request })

    try {
        const result = await Motd.create({
            is_active: is_active ? is_active : 1,
            title: title ? title : "",
            subtitle: subtitle,
            content_type: content_type ? content_type : null,
            content_id: content_id ? content_id : null,
            can_user_dismiss: can_user_dismiss ? can_user_dismiss : 1,
            created_by: req.authUser.id
        })

        LogAddMotd({
            username: req.authUser.name,
            motd_id: result.id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/motd/motd-guncelle
// @desc    Update motd (update-motd)
// @access  Private
router.post('/motd-guncelle', authCheck("update-motd"), async (req, res) => {
    const { motd_id, is_active } = req.body

    if (!motd_id || !(is_active === 0 || is_active === 1)) return res.status(400).json({ 'err': error_messages.bad_request })

    try {
        const motd_data = await Motd.findOne({ where: { id: motd_id } })

        if (!motd_data) return res.status(404).json({ 'err': error_messages.not_found })

        motd_data.is_active = is_active

        await motd_data.save()

        LogUpdateMotd({
            username: req.authUser.name,
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
router.post('/motd-sil', authCheck("delete-motd"), async (req, res) => {
    const { motd_id } = req.body

    if (!motd_id) return res.status(400).json({ 'err': error_messages.bad_request })

    try {
        await Motd.destroy({ where: { id: motd_id } })

        LogDeleteMotd({
            username: req.authUser.name,
            motd_id: motd_id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/motd/
// @desc    Get motd
// @access  Public
router.get('/admin-liste', authCheck("see-motd"), async (req, res) => {
    const { content_id, content_type } = req.query

    if ((!content_type && content_id) || (content_type && !content_id)) return res.status(200).json([])

    try {
        const motd = await Motd.findAll(
            {
                order: [['id', 'DESC']]
            }
        )

        res.status(200).json(motd)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/motd/
// @desc    Get motd
// @access  Public
router.get('/', GeneralAPIRequestsLimiter, async (req, res) => {
    const { content_id, content_type } = req.query

    if ((!content_type && content_id) || (content_type && !content_id)) return res.status(200).json([])

    try {
        const motd = await Motd.findAll(
            {
                where: {
                    content_id: content_id ? content_id : null,
                    content_type: content_type ? content_type : null,
                    is_active: 1
                },
                attributes: [
                    'id',
                    'title',
                    'subtitle',
                    'can_user_dismiss',
                    [
                        Sequelize.literal(`(
                            SELECT name
                            FROM user
                            WHERE
                                id = motd.created_by
                        )`),
                        'created_by'
                    ]
                ],
                order: [['id', 'DESC']]
            }
        )

        res.status(200).json(motd)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

module.exports = router;