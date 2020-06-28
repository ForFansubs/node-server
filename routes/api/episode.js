const express = require('express')
const router = express.Router()
const check_permission = require('../../middlewares/check_permission')
const downloadLinkExtract = require('../../methods/link-extraction-download')
const watchLinkExtract = require('../../methods/link-extraction-watch')
const sendDiscordEmbed = require('../../methods/discord_embed')
const Sequelize = require('sequelize')
const Validator = require('validator')
const error_messages = require("../../config/error_messages")
const supported_sites = require("../../config/supported_sites")

const { LogAddEpisode, LogUpdateEpisode, LogDeleteEpisode, LogAddDownloadLink, LogDeleteDownloadLink, LogAddWatchLink, LogDeleteWatchLink } = require("../../methods/database_logs")
const { GeneralAPIRequestsLimiter } = require('../../middlewares/rate-limiter')

// Models
const Episode = require('../../models/Episode')
const WatchLink = require('../../models/WatchLink')
const DownloadLink = require('../../models/DownloadLink')


// @route   GET api/bolum/:slug/watch
// @desc    View episodes
// @access  Public
router.get('/:slug/watch', GeneralAPIRequestsLimiter, async (req, res) => {
    let eps
    const { slug } = req.params

    try {
        eps = await Episode.findAll({
            where:
            {
                anime_id: {
                    [Sequelize.Op.eq]: Sequelize.literal(`(
                        SELECT id
                        FROM anime
                        WHERE
                        slug = "${slug}"
                        )`)
                },
                special_type: {
                    [Sequelize.Op.ne]: "toplu"
                }
            },
            attributes: [
                'id',
                'episode_number',
                'special_type',
                'credits',
                [
                    Sequelize.literal(`(
                        SELECT name
                        FROM anime
                        WHERE
                            id = episode.anime_id
                    )`),
                    'anime_name'
                ],
                [
                    Sequelize.literal(`(
                        SELECT slug
                        FROM anime
                        WHERE
                            id = episode.anime_id
                    )`),
                    'anime_slug'
                ],
                [
                    Sequelize.literal(`(
                        SELECT cover_art
                        FROM anime
                        WHERE
                            id = episode.anime_id
                    )`),
                    'cover_art'
                ],
            ],
            order: [['special_type'], [Sequelize.fn('ABS', Sequelize.col('episode_number'))]]
        })
        res.status(200).json(eps)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/bolum/izleme-linkleri/
// @desc    View watch links
// @access  Public
router.post('/izleme-linkleri', GeneralAPIRequestsLimiter, async (req, res) => {
    let eps
    const { slug } = req.body
    let [special_type, episode_number] = req.body.episode_data.split('-')

    special_type === "bolum" ? special_type = "" : null

    try {
        // TODO: Subquery'leri direkt olarak yazma!
        eps = await WatchLink.findAll(
            {
                attributes: [
                    'link',
                    'type',
                    'id'
                ],
                where: {
                    episode_id: {
                        [Sequelize.Op.eq]: Sequelize.literal(`(SELECT id FROM episode WHERE anime_id=(SELECT id FROM anime WHERE slug="${slug}") AND special_type='${special_type}' AND episode_number='${episode_number}')`)
                    }
                },
                order: ['type']
            })
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
    const { episode_id } = req.body

    try {
        await check_permission(req.headers.authorization, "delete-watch-link")
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        const eps = await WatchLink.findAll({ where: { episode_id: episode_id }, order: ['type'] })
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
    const { episode_id } = req.body

    try {
        const check_res = await check_permission(req.headers.authorization, "delete-download-link")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        const eps = await DownloadLink.findAll({ where: { episode_id: episode_id }, order: ['type'] })
        res.status(200).json(eps)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   POST api/bolum/bolum-ekle
// @desc    Add episode (perm: "add-episode")
// @access  Private
router.post('/bolum-ekle', async (req, res) => {
    const { episode_number, anime_id, special_type, credits } = req.body

    let username, user_id, anime
    try {
        const check_res = await check_permission(req.headers.authorization, "add-episode")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        anime = await Episode.findOne({ where: { episode_number: episode_number, anime_id: anime_id, special_type: special_type } })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    if (anime) res.status(400).json({ 'err': 'Bu bölüm zaten ekli.' })
    else {
        if (!episode_number && special_type === '') res.status(400).json({ 'err': 'Bölüm numarası veya tür seçmelisiniz.' })

        try {
            const result = await Episode.create({
                anime_id,
                episode_number,
                credits,
                created_by: user_id,
                special_type
            })

            LogAddEpisode({
                process_type: 'add-episode',
                username: username,
                episode_id: result.id
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
            console.log(err)
            return res.status(500).json({ 'err': error_messages.database_error })
        }
    }

})

// @route   POST api/bolum/bolum-duzenle
// @desc    Update episode (perm: "update-episode")
// @access  Private
router.post('/bolum-duzenle', async (req, res) => {
    let username
    try {
        const check_res = await check_permission(req.headers.authorization, "update-episode")
        username = check_res.username
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    switch (req.body.request) {
        case "update-visibility":
            try {
                await Episode.update({ can_user_download: req.body.value }, { where: { id: req.body.id } })

                LogUpdateEpisode({
                    process_type: 'update-episode',
                    request: req.body.request,
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
        case "update-data":
            const { credits, id } = req.body

            try {
                await Episode.update({ credits: credits }, { where: { id: id } })

                LogUpdateEpisode({
                    process_type: 'update-episode',
                    username: username,
                    request: req.body.request,
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
    const { episode_id } = req.body

    let username
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-episode")
        username = check_res.username
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        const episode = await Episode.findOne({ where: { id: episode_id } })
        Promise.all([Episode.destroy({ where: { id: episode_id } }), DownloadLink.destroy({ where: { episode_id: episode_id } }), WatchLink.destroy({ where: { episode_id: episode_id } })])

        LogDeleteEpisode({
            process_type: 'delete-episode',
            username: username,
            anime_id: episode.anime_id,
            episode_number: episode.episode_number,
            special_type: episode.special_type
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

    const { link, type } = downloadLinkExtract(req.body.link)
    if (!type) return res.status(400).json({ 'err': 'Link tanımlanamadı.' })

    try {
        anime = await DownloadLink.findOne({ where: { link: link } })

        if (anime) return res.status(400).json({ 'err': 'Bu link zaten ekli.' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    const { anime_id, episode_id } = req.body
    if (!Validator.isURL(link)) return res.status(400).json({ 'err': 'Link doğru değil' })

    try {
        const result = await DownloadLink.create({
            anime_id,
            episode_id,
            type: type,
            link: link,
            created_by: user_id
        })

        LogAddDownloadLink({
            process_type: 'add-download-link',
            username: username,
            download_link_id: result.id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        return res.status(500).json({ 'err': 'Bir şeyler yanlış gitti.' })
    }
})

// @route   POST api/bolum/indirme-linki-sil
// @desc    İndirme linki sil (perm: "delete-download-link")
// @access  Private
router.post('/indirme-linki-sil', async (req, res) => {
    const { episode_id, downloadlink_id } = req.body

    let username
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-download-link")
        username = check_res.username
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        const download_link = await DownloadLink.findOne({ where: { id: downloadlink_id } })
        await DownloadLink.destroy({ where: { id: downloadlink_id } })

        LogDeleteDownloadLink({
            process_type: 'delete-download-link',
            username: username,
            episode_id: episode_id,
            download_link_type: download_link.type
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

    const { type, src } = watchLinkExtract(link)
    if (!type) return res.status(400).json({ 'err': 'Link tanımlanamadı.' })

    try {
        anime = await WatchLink.findOne({ where: { link: src } })

        if (anime) return res.status(400).json({ 'err': 'Bu link zaten ekli.' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    try {
        const result = await WatchLink.create({
            anime_id,
            episode_id,
            type: type,
            link: src,
            created_by: user_id
        })

        LogAddWatchLink({
            process_type: 'add-watch-link',
            username: username,
            watch_link_id: result.id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
    }
})

// @route   POST /episode/izleme-linki-sil
// @desc    İzleme linki sil (perm: "delete-watch-link")
// @access  Private
router.post('/izleme-linki-sil', async (req, res) => {
    const { episode_id, watchlink_id } = req.body

    let username
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-watch-link")
        username = check_res.username
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        const watch_link = await WatchLink.findOne({ where: { id: watchlink_id } })

        await WatchLink.destroy({ where: { id: watchlink_id } })

        LogDeleteWatchLink({
            process_type: 'delete-watch-link',
            username: username,
            episode_id: episode_id,
            watch_link_type: watch_link.type
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
    try {
        await check_permission(req.headers.authorization, "add-download-link")
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }
    const list = Object.values(supported_sites.download_links)
    res.status(200).json({ list })
})

// @route   POST  api/bolum/watch-link-list
// @desc    İzleme linkleri listesi
// @access  Private
router.get('/watch-link-list', async (req, res) => {
    try {
        await check_permission(req.headers.authorization, "add-watch-link")
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    const list = Object.values(supported_sites.watch_links)
    res.status(200).json({ list })
})

// @route   GET api/bolum/info/:animeid
// @desc    View episodes
// @access  Public
router.get('/info/:anime_id', GeneralAPIRequestsLimiter, async (req, res) => {
    const { anime_id } = req.params

    try {
        const eps = await Episode.findAll({ where: { anime_id: anime_id }, order: [['special_type'], [Sequelize.fn('ABS', Sequelize.col('episode_number'))]] })

        return res.status(200).json(eps)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   POST api/bolum/download-links/:animeslug
// @desc    View download links
// @access  Public
router.post('/download-links/:anime_slug', GeneralAPIRequestsLimiter, async (req, res) => {
    const { anime_slug } = req.params
    const { episode_id } = req.body

    try {
        const eps = await DownloadLink.findAll({
            where: {
                anime_id: {
                    [Sequelize.Op.eq]: Sequelize.literal(`(SELECT id FROM anime WHERE slug='${anime_slug}')`)
                },
                episode_id: episode_id
            }
        })
        return res.status(200).json(eps)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

module.exports = router;