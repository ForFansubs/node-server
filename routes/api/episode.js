const express = require('express')
const router = express.Router()
const check_permission = require('../../validation/check_permission')
const downloadLinkExtract = require('../../methods/link-extraction-download')
const watchLinkExtract = require('../../methods/link-extraction-watch')
const sendDiscordEmbed = require('../../methods/discord_embed')
const mariadb = require('../../config/maria')
const Validator = require('validator')
const error_messages = require("../../config/error_messages")
const supported_sites = require("../../config/supported_sites")

const { LogAddEpisode, LogUpdateEpisode, LogDeleteEpisode, LogAddDownloadLink, LogDeleteDownloadLink, LogAddWatchLink, LogDeleteWatchLink } = require("../../methods/database_logs")

// @route   GET api/bolum/:slug/watch
// @desc    View episodes
// @access  Public
router.get('/:slug/watch', async (req, res) => {
    let eps
    const { slug } = req.params

    try {
        eps = await mariadb(`SELECT *, (SELECT name FROM anime WHERE id=episode.anime_id) as anime_name, (SELECT slug FROM anime WHERE id=episode.anime_id) as anime_slug, (SELECT cover_art FROM anime WHERE id=episode.anime_id) as cover_art FROM episode WHERE anime_id=(SELECT id FROM anime WHERE slug="${slug}") AND special_type!='toplu' ORDER BY special_type, ABS(episode_number)`)
        res.status(200).json(eps)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/bolum/izleme-linkleri/
// @desc    View watch links
// @access  Public
router.post('/izleme-linkleri', async (req, res) => {
    let eps
    const { slug } = req.body
    let [special_type, episode_number] = req.body.episode_data.split('-')

    special_type === "bolum" ? special_type = "" : null

    try {
        eps = await mariadb(`SELECT link, type, id FROM watch_link WHERE episode_id=(SELECT id FROM episode WHERE anime_id=(SELECT id FROM anime WHERE slug="${slug}") AND special_type='${special_type}' AND episode_number='${episode_number}') ORDER BY type`)
        res.status(200).json(eps)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/bolum/izleme-linkleri/admin-view
// @desc    View watch links
// @access  Public
router.post('/izleme-linkleri/admin-view', async (req, res) => {
    let username, user_id, eps
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-watch-link")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        eps = await mariadb(`SELECT * FROM watch_link WHERE episode_id="${req.body.episode_id}" ORDER BY type`)
        res.status(200).json(eps)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/bolum/indirme-linkleri/admin-view
// @desc    View watch links
// @access  Public
router.post('/indirme-linkleri/admin-view', async (req, res) => {
    let username, user_id, eps
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-download-link")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        eps = await mariadb(`SELECT * FROM download_link WHERE episode_id="${req.body.episode_id}" ORDER BY type`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   POST api/bolum/bolum-ekle
// @desc    Add episode (perm: "add-episode")
// @access  Private
router.post('/bolum-ekle', async (req, res) => {
    let username, user_id, anime
    try {
        const check_res = await check_permission(req.headers.authorization, "add-episode")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        anime = await mariadb(`SELECT episode_number, anime_id FROM episode WHERE episode_number='${req.body.episode_number}' AND anime_id='${req.body.anime_id}' AND special_type='${req.body.special_type}'`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    if (anime[0]) res.status(400).json({ 'err': 'Bu bölüm zaten ekli.' })
    else {
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
            await mariadb(`INSERT INTO episode (${keys.join(', ')}) VALUES (${values.map(value => `'${value}'`).join(',')})`)

            LogAddEpisode({
                process_type: 'add-episode',
                username: username,
                episode_id: result.insertId
            })

            sendDiscordEmbed({
                type: "episode",
                anime_id,
                credits,
                special_type,
                episode_number
            })

            return res.status(200).json({ 'success': 'success' })
        } catch (err) {
            return res.status(500).json({ 'err': error_messages.database_error })
        }
    }

})

// @route   POST api/bolum/bolum-duzenle
// @desc    Update episode (perm: "update-episode")
// @access  Private
router.post('/bolum-duzenle', async (req, res) => {
    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "update-episode")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    switch (req.body.request) {
        case "update-visibility":
            try {
                await mariadb(`UPDATE episode SET can_user_download="${req.body.value}" WHERE id=${req.body.id}`)
                res.status(200).json({ 'success': 'success' })
                LogUpdateEpisode({
                    process_type: 'update-episode',
                    username: username,
                    episode_id: req.body.id,
                    can_user_download: req.body.value
                })
            } catch (err) {
                console.log(err)
                return res.status(500).json({ 'err': error_messages.database_error })
            }
            break
        case "update-data":
            const { credits, id } = req.body

            const data = {
                credits: credits
            }

            const keys = Object.keys(data)
            const values = Object.values(data)

            try {
                await mariadb(`UPDATE episode SET ${keys.map((key, index) => `${key} = "${values[index]}"`)} WHERE id="${id}"`)

                LogUpdateEpisode({
                    process_type: 'update-episode',
                    username: username,
                    episode_id: req.body.id,
                    can_user_download: req.body.value
                })

                return res.status(200).json({ 'success': 'success' })
            } catch (err) {
                console.log(err)
                return res.status(500).json({ 'err': error_messages.database_error })
            }
            break
        default:
            return res.status(500).json({ 'err': 'İşlem türü belirtmediniz!' })
    }
})

// @route   GET api/bolum/bolum-sil
// @desc    Delete episode (perm: "delete-episode")
// @access  Private
router.post('/bolum-sil', async (req, res) => {
    let episode
    const { episode_id } = req.body

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-episode")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        episode = await mariadb(`SELECT * FROM episode WHERE id=${episode_id}`)
        Promise.all([mariadb(`DELETE FROM episode WHERE id=${episode_id}`), mariadb(`DELETE FROM download_link WHERE episode_id=${episode_id}`), mariadb(`DELETE FROM watch_link WHERE episode_id=${episode_id}`)])

        LogDeleteEpisode({
            process_type: 'delete-episode',
            username: username,
            anime_id: episode[0].anime_id,
            episode_number: episode[0].episode_number,
            special_type: episode[0].special_type
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        return res.status(500).json({ 'err': 'Bir şeyler yanlış gitti.' })
    }
})


// @route   POST  api/bolum/indirme-linki-ekle
// @desc    Yeni bölüm indirme linki ekle (perm: "add-download-link")
// @access  Private
router.post('/indirme-linki-ekle', async (req, res) => {
    let username, user_id, anime
    try {
        const check_res = await check_permission(req.headers.authorization, "add-download-link")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    const extract = downloadLinkExtract(req.body.link)
    if (!extract) return res.status(400).json({ 'err': 'Link tanımlanamadı.' })
    try {
        anime = await mariadb(`SELECT link FROM download_link WHERE link='${extract.link}'`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    if (anime[0]) res.status(400).json({ 'err': 'Bu link zaten ekli.' })
    else {
        const { anime_id, episode_id, resolution } = req.body
        if (!Validator.isURL(extract.link)) return res.status(400).json({ 'err': 'Link doğru değil' })
        const newDownloadLink = {
            anime_id,
            episode_id,
            type: extract.type,
            resolution,
            link: extract.link,
            created_by: user_id
        }
        const keys = Object.keys(newDownloadLink)
        const values = Object.values(newDownloadLink)

        try {
            const result = await mariadb(`INSERT INTO download_link (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)

            LogAddDownloadLink({
                process_type: 'add-download-link',
                username: username,
                download_link_id: result.insertId
            })

            return res.status(200).json({ 'success': 'success' })
        } catch (err) {
            return res.status(500).json({ 'err': 'Bir şeyler yanlış gitti.' })
        }
    }
})

// @route   POST api/bolum/indirme-linki-sil
// @desc    İndirme linki sil (perm: "delete-download-link")
// @access  Private
router.post('/indirme-linki-sil', async (req, res) => {
    let downloadlink
    const { episode_id, downloadlink_id } = req.body

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-download-link")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        downloadlink = await mariadb(`SELECT type FROM download_link WHERE id='${downloadlink_id}'`)
        await mariadb.query(`DELETE FROM download_link WHERE id=${downloadlink_id}`)

        LogDeleteDownloadLink({
            process_type: 'delete-download-link',
            username: username,
            episode_id: episode_id,
            download_link_type: downloadlink[0].type
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   POST api/bolum/izleme-linki-ekle
// @desc    Yeni bölüm indirme linki ekle (perm: "add-watch-link")
// @access  Private
router.post('/izleme-linki-ekle', async (req, res) => {
    let username, user_id, anime
    try {
        const check_res = await check_permission(req.headers.authorization, "add-watch-link")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    const { anime_id, episode_id, link } = req.body
    const extract = watchLinkExtract(link)
    if (!extract) return res.status(400).json({ 'err': 'Link tanımlanamadı.' })
    try {
        anime = await mariadb(`SELECT link FROM watch_link WHERE link='${extract.src}'`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    if (anime[0]) res.status(400).json({ 'err': 'Bu link zaten ekli.' })
    else {
        const newWatchLink = {
            anime_id,
            episode_id,
            type: extract.type,
            link: extract.src,
            created_by: user_id
        }
        const keys = Object.keys(newWatchLink)
        const values = Object.values(newWatchLink)
        try {
            const result = await mariadb(`INSERT INTO watch_link (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)

            LogAddWatchLink({
                process_type: 'add-watch-link',
                username: username,
                watch_link_id: result.insertId
            })

            return res.status(200).json({ 'success': 'success' })
        } catch (err) {
            console.log(err)
        }
    }
})

// @route   POST /episode/izleme-linki-sil
// @desc    İzleme linki sil (perm: "delete-watch-link")
// @access  Private
router.post('/izleme-linki-sil', async (req, res) => {
    let watchlink
    const { episode_id, watchlink_id } = req.body

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-watch-link")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        watchlink = await mariadb(`SELECT type FROM watch_link WHERE id='${watchlink_id}'`)
        await mariadb(`DELETE FROM watch_link WHERE id=${watchlink_id}`)

        LogDeleteWatchLink({
            process_type: 'delete-watch-link',
            username: username,
            episode_id: episode_id,
            watch_link_type: watchlink[0].type
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   POST  api/bolum/download-link-list
// @desc    İndirme linkleri listesi
// @access  Private
router.get('/download-link-list', async (req, res) => {
    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "add-download-link")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }
    const links = Object.values(supported_sites.download_links)
    res.status(200).json({ links })
})

// @route   POST  api/bolum/watch-link-list
// @desc    İzleme linkleri listesi
// @access  Private
router.get('/watch-link-list', async (req, res) => {
    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "add-watch-link")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    const list = Object.values(supported_sites.watch_links)
    res.status(200).json({ list })
})

// @route   GET api/bolum/info/:animeid
// @desc    View episodes
// @access  Public
router.get('/info/:animeid', async (req, res) => {
    let eps

    try {
        eps = await mariadb(`SELECT * FROM episode WHERE anime_id='${req.params.animeid}' ORDER BY special_type, ABS(episode_number)`)
        res.status(200).json(eps)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   POST api/bolum/download-links/:animeslug
// @desc    View download links
// @access  Public
router.post('/download-links/:animeslug', async (req, res) => {
    let eps

    try {
        eps = await mariadb(`SELECT link, type, resolution, id FROM download_link WHERE anime_id=(SELECT id FROM anime WHERE slug='${req.params.animeslug}') AND episode_id='${req.body.episode_id}' ORDER BY type`)
        res.status(200).json(eps)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

module.exports = router;