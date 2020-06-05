const express = require('express')
const router = express.Router()
const fs = require('fs')
const Path = require('path')
const check_permission = require('../../validation/check_permission')
const sendDiscordEmbed = require('../../methods/discord_embed')
const mariadb = require('../../config/maria')
const error_messages = require("../../config/error_messages")

const { LogAddMangaEpisode, LogUpdateMangaEpisode, LogDeleteMangaEpisode } = require("../../methods/database_logs")

const multer = require('multer');

const getPath = (manga_slug, episode_number, filename) => Path.resolve(__dirname, `../../images/manga_episodes/${manga_slug}/${episode_number}${filename ? `/${filename}` : ""}`)

async function clearMangaFolder(manga_slug, episode_number, pages) {
    const existingPages = fs.readdirSync(getPath(manga_slug, episode_number))
    for (const page of existingPages) {
        if (!pages.find(p => p.filename === page)) {
            const pagePath = getPath(manga_slug, episode_number, page)
            fs.unlinkSync(pagePath, (err) => {
                if (err) {
                    return unlinkFileError(path, err)
                }
            })
        }
    }
}

async function deleteMangaFolder(manga_slug, episode_number, pages, options) {
    if (!manga_slug || !episode_number || !pages) throw "Parametreler eksik."

    const folderPath = getPath(manga_slug, episode_number)

    if (!fs.existsSync(folderPath)) throw "Dosya bulunamadı."

    for (const page of JSON.parse(pages)) {
        const filepath = getPath(manga_slug, episode_number, page.filename)
        fs.unlinkSync(filepath, (err) => {
            if (err) {
                return unlinkFileError(path, err)
            }
        })
    }

    fs.rmdirSync(folderPath)
}

const manga_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { manga_slug, episode_number } = req.body
        const path = getPath(manga_slug, episode_number)
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



// @route   GET api/manga-bolum/bolum-ekle
// @desc    Add manga chapters to service
// @access  Private
router.post('/bolum-ekle', async (req, res) => {
    let username, user_id
    const { manga_slug, episode_number } = req.body

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
        const { manga_id, manga_slug, credits, episode_number, episode_name } = req.body
        let files = []

        try {
            const episode = await mariadb(`SELECT * FROM manga_episode WHERE manga_id=${manga_id} AND episode_number="${episode_number}"`)
            if (episode[0]) return res.status(500).json({ 'err': error_messages.manga_episode_exists })
        } catch (err) {
            return console.log(err)
        }

        await clearMangaFolder(manga_slug, episode_number, req.files)

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

            LogAddMangaEpisode({
                process_type: 'add-manga-episode',
                username: username,
                manga_episode_id: result.insertId
            })

            sendDiscordEmbed({
                type: "manga-episode",
                manga_id,
                credits,
                episode_name,
                episode_number
            })

            return res.status(200).json({ 'success': 'success' })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ 'err': error_messages.database_error })
        }
    })
})

// @route   POST api/manga-bolum/bolum-guncelle
// @desc    Update manga episode (perm: "update-manga-episode")
// @access  Private
router.post('/bolum-guncelle', async (req, res) => {
    let username, user_id
    const { credits, episode_name, id } = req.body

    try {
        const check_res = await check_permission(req.headers.authorization, "update-manga-episode")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    const data = {
        episode_name: episode_name,
        credits: credits
    }

    const keys = Object.keys(data)
    const values = Object.values(data)

    try {
        await mariadb(`UPDATE manga_episode SET ${keys.map((key, index) => `${key} = "${values[index]}"`)} WHERE id="${id}"`)

        LogUpdateMangaEpisode({
            process_type: 'update-manga-episode',
            username: username,
            manga_episode_id: req.body.id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/manga-bolum/bolum-sil
// @desc    Delete episode (perm: "delete-episode")
// @access  Private
router.post('/bolum-sil', async (req, res) => {
    let episode
    const { episode_id } = req.body

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-manga-episode")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        const manga_episode_data = await mariadb(
            `SELECT *,
            (SELECT slug FROM manga WHERE id=manga_episode.manga_id) as manga_slug,
            (SELECT name FROM manga WHERE id=manga_episode.manga_id) as manga_name
            FROM
            manga_episode
            WHERE
            id=${episode_id}`
        )
        const { manga_id, manga_slug, manga_name, episode_number, pages } = manga_episode_data[0]
        Promise.all([deleteMangaFolder(manga_slug, episode_number, pages), mariadb(`DELETE FROM manga_episode WHERE id=${episode_id}`)])

        LogDeleteMangaEpisode({
            process_type: 'delete-manga-episode',
            username: username,
            episode_number: episode_number,
            manga_name: manga_name
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        return res.status(500).json({ 'err': 'Bir şeyler yanlış gitti.' })
    }
})

// @route   GET api/manga-bolum/:slug/read
// @desc    Get image paths and other stuff for reading page
// @access  Public
router.get('/:slug/read', async (req, res) => {
    let manga
    const { slug } = req.params

    try {
        manga = await mariadb(`
        SELECT 
            episode_number,
            episode_name,
            credits,
            pages,
            (SELECT name FROM manga WHERE id = manga_episode.manga_id) as manga_name,
            (SELECT cover_art FROM manga WHERE id = manga_episode.manga_id) as cover_art,
            (SELECT name FROM user WHERE id = manga_episode.created_by) as created_by
            FROM
            manga_episode
            WHERE
            manga_id = (SELECT id FROM manga WHERE slug = '${slug}')
            ORDER BY
            ABS(manga_episode.episode_number)`)
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