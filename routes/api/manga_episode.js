const express = require('express')
const router = express.Router()
const fs = require('fs')
const Path = require('path')
const check_permission = require('../../validation/check_permission')
const sendDiscordEmbed = require('../../methods/discord_embed')
const downloadImage = require('../../methods/download_image')
const deleteImage = require('../../methods/delete_image')
const log_success = require('../../methods/log_success')
const log_fail = require('../../methods/log_fail')
const mariadb = require('../../config/maria')
const slugify = require('../../methods/slugify').generalSlugify
const genre_map = require("../../config/maps/genremap")
const error_messages = require("../../config/error_messages")

var multer = require('multer');

const uploadError = (path) => {
    fs.rmdirSync()
}

const manga_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { manga_slug, episode_number } = req.body
        const path = Path.resolve(__dirname, `../../images/manga_episodes/${manga_slug}/${episode_number}`)
        if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true })
        cb(null, path)
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({
    storage: manga_storage,
    fileFilter: function (req, file, callback) {
        var ext = Path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return callback(new Error('Bu menüden sadece "png", "jpg", "gif" ve "jpeg" uzantılı dosyalar ekleyebilirsiniz.'))
        }
        callback(null, true)
    }
}).array('manga_pages')

// @route   GET api/manga-bolum/ekle
// @desc    Add manga chapters to service
// @access  Private
router.post('/ekle', async (req, res) => {
    let username, user_id, mangas
    try {
        const check_res = await check_permission(req.headers.authorization, "add-manga-episode")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    upload(req, res, async function (err) {
        if (err) {
            return res.status(500).json({ err: err.message })
        }

        const { manga_id, credits, episode_number, episode_name } = req.body
        let files = []

        req.files.forEach(file => {
            files.push({
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            })
        })

        newEpisode = {
            manga_id: manga_id ? manga_id : "",
            credits: credits ? credits : "",
            episode_name: episode_name ? episode_name : "",
            episode_number: episode_number ? episode_number : "",
            pages: JSON.stringify(files, ("\"", "'")),
            created_by: user_id
        }

        const keys = Object.keys(newEpisode)
        const values = Object.values(newEpisode)
        try {
            const result = await mariadb(`INSERT INTO manga_episode (${keys.join(', ')}) VALUES (${values.map(value => `'${value}'`).join(',')})`)
            // log_success('add-episode', username, result.insertId)
            res.status(200).json({ 'success': 'success' })

            const embedData = {
                type: "manga-episode",
                manga_id,
                credits,
                episode_name,
                episode_number
            }

            sendDiscordEmbed(embedData)
        } catch (err) {
            console.log(err)
            // log_fail('add-episode', username, req.body.anime_id, req.body.episode_number, req.body.special_type)
            return res.status(500).json({ 'err': error_messages.database_error })
        }
    })
})

// @route   GET api/manga-bolum/:slug
// @desc    Get image paths and other stuff for reading page
// @access  Public
router.get('/:slug/read', async (req, res) => {
    let manga
    const { slug } = req.params

    try {
        manga = await mariadb(`SELECT episode_number, episode_name, credits, pages, (SELECT name FROM manga WHERE id=manga_episode.manga_id) as manga_name, (SELECT cover_art FROM manga WHERE id=manga_episode.manga_id) as cover_art, (SELECT name FROM user WHERE id=manga_episode.created_by) as created_by FROM manga_episode WHERE manga_id=(SELECT id FROM manga WHERE slug='${slug}')`)
        console.log(manga)
        if (manga.length === 0) {
            return res.status(404).json({ 'err': 'Görüntülemek istediğiniz mangayı bulamadık.' });
        } else {
            res.json(manga);
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

module.exports = router;