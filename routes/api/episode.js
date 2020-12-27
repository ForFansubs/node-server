const express = require('express')
const router = express.Router()
const check_permission = require('../../middlewares/check_permission')
const downloadLinkExtract = require('../../methods/link-extraction-download')
const watchLinkExtract = require('../../methods/link-extraction-watch')
const sendDiscordEmbed = require('../../methods/discord_embed')
const Validator = require('validator')
const error_messages = require("../../config/error_messages")
const supported_sites = require("../../config/supported_sites")

const { LogAddEpisode, LogUpdateEpisode, LogDeleteEpisode, LogAddDownloadLink, LogDeleteDownloadLink, LogAddWatchLink, LogDeleteWatchLink } = require("../../methods/database_logs")
const { GeneralAPIRequestsLimiter } = require('../../middlewares/rate-limiter')

// Models
const { Sequelize, Episode, DownloadLink, WatchLink } = require("../../config/sequelize")
const { watchLinkAdminViewSchema,
    downloadLinkAdminViewSchema,
    createEpisodeSchema,
    updateEpisodeSchema,
    addDownloadLinkSchema,
    deleteDownloadLinkSchema,
    addWatchLinkSchema,
    deleteWatchLinkSchema } = require('../../validators/episode')
const authCheck = require('../../middlewares/authCheck')


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
                'created_time',
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
// @desc    View watch links (perm: "delete-watch-link")
// @access  Public
router.post('/izleme-linkleri/admin-view', authCheck("delete-watch-link"), async (req, res) => {
    await watchLinkAdminViewSchema.validateAsync(req.body)
    const { episode_id } = req.body

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
router.post('/indirme-linkleri/admin-view', authCheck("delete-download-link"), async (req, res) => {
    await downloadLinkAdminViewSchema.validateAsync(req.body)
    const { episode_id } = req.body

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
router.post('/bolum-ekle', authCheck("add-episode"), async (req, res) => {
    await createEpisodeSchema.validateAsync(req.body)
    const { episode_number, anime_id, special_type, credits, can_user_download } = req.body

    let anime

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
                created_by: req.authUser.id,
                special_type,
                can_user_download: can_user_download ? can_user_download : 1
            })

            LogAddEpisode({
                process_type: 'add-episode',
                username: req.authUser.name,
                episode_id: result.id
            })

            if (req.body.send_discord_embed) {
                sendDiscordEmbed({
                    type: "episode",
                    anime_id,
                    credits,
                    special_type,
                    episode_number
                })
            }

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
router.post('/bolum-duzenle', authCheck("update-episode"), async (req, res) => {
    await updateEpisodeSchema.validateAsync(req.body)

    switch (req.body.request) {
        case "update-visibility":
            try {
                await Episode.update({ can_user_download: req.body.value }, { where: { id: req.body.id } })

                LogUpdateEpisode({
                    process_type: 'update-episode',
                    request: req.body.request,
                    username: req.authUser.name,
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
                    username: req.authUser.name,
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
router.post('/bolum-sil', authCheck("delete-episode"), async (req, res) => {
    await deleteEpisodeSchema.validateAsync(req.body)
    const { episode_id } = req.body

    try {
        const episode = await Episode.findOne({ where: { id: episode_id } })
        Promise.all([Episode.destroy({ where: { id: episode_id } }), DownloadLink.destroy({ where: { episode_id: episode_id } }), WatchLink.destroy({ where: { episode_id: episode_id } })])

        LogDeleteEpisode({
            process_type: 'delete-episode',
            username: req.authUser.name,
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
router.post('/indirme-linki-ekle', authCheck("add-download-link"), async (req, res) => {
    await addDownloadLinkSchema.validateAsync(req.body)
    let anime

    let links = req.body.link.split('\n')
    let link_errors = {}

    for (const linkTemp of links) {
        if (linkTemp === "") continue

        const { link, type } = downloadLinkExtract(linkTemp)
        if (!type) {
            link_errors[linkTemp] = "Link tanımlanamadı."
            continue
        }

        try {
            anime = await DownloadLink.findOne({ raw: true, where: { link: link } })

            if (anime) {
                link_errors[linkTemp] = "Bu link zaten ekli."
                continue
            }
        } catch (err) {
            console.log(err)
            link_errors[linkTemp] = error_messages.database_error
            continue
        }

        const { anime_id, episode_id } = req.body
        if (!Validator.isURL(link)) {
            link_errors[linkTemp] = "Bu bir link değil."
            continue
        }

        try {
            const result = await DownloadLink.create({
                anime_id,
                episode_id,
                type: type,
                link: link,
                created_by: req.authUser.id
            })

            LogAddDownloadLink({
                process_type: 'add-download-link',
                username: req.authUser.name,
                download_link_id: result.id
            })
        } catch (err) {
            link_errors[linkTemp] = error_messages.database_error
            continue
        }
    }

    return res.status(200).json({
        'success': 'success',
        'errors': link_errors
    })
})

// @route   POST api/bolum/indirme-linki-sil
// @desc    İndirme linki sil (perm: "delete-download-link")
// @access  Private
router.post('/indirme-linki-sil', authCheck("delete-download-link"), async (req, res) => {
    await deleteDownloadLinkSchema.validateAsync(req.body)
    const { episode_id, downloadlink_id } = req.body

    try {
        const download_link = await DownloadLink.findOne({ where: { id: downloadlink_id } })
        await DownloadLink.destroy({ where: { id: downloadlink_id } })

        LogDeleteDownloadLink({
            process_type: 'delete-download-link',
            username: req.authUser.name,
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
// @desc    Yeni bölüm izleme linki ekle (perm: "add-watch-link")
// @access  Private
router.post('/izleme-linki-ekle', authCheck("add-watch-link"), async (req, res) => {
    await addWatchLinkSchema.validateAsync(req.body)
    let anime

    const links = req.body.link.split("\n")
    let link_errors = {}

    for (const linkTemp of links) {
        if (linkTemp === "") continue

        const { type, src } = watchLinkExtract(linkTemp)
        if (!type) {
            link_errors[linkTemp] = "Link tanımlanamadı."
            continue
        }

        try {
            anime = await WatchLink.findOne({ where: { link: src }, raw: true })

            if (anime) {
                link_errors[linkTemp] = "Bu link zaten ekli."
                continue
            }
        } catch (err) {
            console.log(err)
            link_errors[linkTemp] = error_messages.database_error
            continue
        }

        const { anime_id, episode_id } = req.body
        if (!Validator.isURL(linkTemp)) {
            link_errors[linkTemp] = "Bu bir link değil."
            continue
        }

        try {
            const result = await WatchLink.create({
                anime_id,
                episode_id,
                type: type,
                link: src,
                created_by: req.authUser.id
            })

            LogAddWatchLink({
                process_type: 'add-watch-link',
                username: req.authUser.name,
                watch_link_id: result.id
            })
        } catch (err) {
            console.log(err)
            link_errors[`${linkTemp}`] = error_messages.database_error
            continue
        }
    }

    return res.status(200).json({
        'success': 'success',
        'errors': link_errors
    })
})

// @route   POST /episode/izleme-linki-sil
// @desc    İzleme linki sil (perm: "delete-watch-link")
// @access  Private
router.post('/izleme-linki-sil', authCheck("delete-watch-link"), async (req, res) => {
    await deleteWatchLinkSchema.validateAsync(req.body)
    const { episode_id, watchlink_id } = req.body

    try {
        const watch_link = await WatchLink.findOne({ where: { id: watchlink_id } })

        await WatchLink.destroy({ where: { id: watchlink_id } })

        LogDeleteWatchLink({
            process_type: 'delete-watch-link',
            username: req.authUser.name,
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
router.get('/download-link-list', authCheck("add-download-link"), async (req, res) => {
    const list = Object.values(supported_sites.download_links)
    res.status(200).json({ list })
})

// @route   POST  api/bolum/watch-link-list
// @desc    İzleme linkleri listesi
// @access  Private
router.get('/watch-link-list', authCheck("add-watch-link"), async (req, res) => {
    const list = Object.values(supported_sites.watch_links)
    res.status(200).json({ list })
})

// @route   GET api/bolum/info/:animeid
// @desc    View episodes
// @access  Public
router.get('/info/:anime_id', GeneralAPIRequestsLimiter, async (req, res) => {
    const { anime_id } = req.params

    try {
        const eps = await Episode.findAll(
            {
                where: { anime_id: anime_id },
                order: [['special_type'],
                [Sequelize.fn('ABS', Sequelize.col('episode_number'))]]
            }
        )

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