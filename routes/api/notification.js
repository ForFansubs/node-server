const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const mariadb = require('../../config/maria')

// @route   GET api/bildirim/ekle
// @desc    Add notification (add-notification)
// @access  Private
router.post('/ekle', async (req, res) => {
    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "add-notification")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    const { anime_id, credits, special_type } = req.body
    req.body.episode_number ? episode_number = req.body.episode_number : episode_number = null
    if (!req.body.episode_number && special_type === '') res.status(400).json({ 'err': 'Bölüm numarası veya tür seçmelisiniz.' })
    let newEpisode
    if (episode_number) {
        newEpisode = {
            anime_id,
            episode_number,
            credits,
            created_by: user_id,
            special_type
        }
    }
    else {
        newEpisode = {
            anime_id,
            credits,
            created_by: user_id,
            special_type
        }
    }
    const keys = Object.keys(newEpisode)
    const values = Object.values(newEpisode)
    try {
        await mariadb(`INSERT INTO episode (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)
        log_success('add-episode', username, result.insertId)
        res.status(200).json({ 'success': 'success' })
        sendDiscordEmbed('episode', anime_id, credits, special_type, episode_number, result.insertId, req.headers.origin)
    } catch (err) {
        return res.status(500).json({ 'err': error_messages.database_error })
    }

})

module.exports = router;