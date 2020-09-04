const package = require('../../package.json')
const express = require('express')
const router = express.Router()
const check_permission = require('../../middlewares/check_permission')
const axios = require("axios")
const genremap = require('../../config/maps/genremap')
const standartSlugify = require('standard-slugify')
const Log = require('../../db/models/Log')
const Anime = require('../../db/models/Anime')
const Manga = require('../../db/models/Manga')
const Episode = require('../../db/models/Episode')
const MangaEpisode = require('../../db/models/MangaEpisode')
const Sequelize = require('sequelize')
const { IndexAPIRequestsLimiter } = require('../../middlewares/rate-limiter')

// @route   GET api/
// @desc    Index route
// @access  Private
router.get('/', async (req, res) => {
    let admin = false
    try {
        await check_permission(req.headers.authorization, "see-admin-page")
        admin = true
    } catch (err) {
        admin = false
    }

    const response = {
        author: 'aybertocarlos',
        contact: 'aybertocarlos@gmail.com',
        version: package.version,
        "release-name": package["release-name"],
        status: 'OK',
        admin
    }
    res.status(200).json(response)
})

// @route   GET api/logs
// @desc    View logs (perm: "see-logs")
// @access  Private
router.get('/logs', async (req, res) => {
    try {
        await check_permission(req.headers.authorization, "see-logs")
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }
    try {
        const logs = await Log.findAll({ order: [['id', 'DESC']] })
        return res.status(200).json(logs)
    } catch (err) {
        res.status(400).json({ 'err': 'Kayıtları alırken bir sorun oluştu.' })
        return false
    }
})

// @route   GET api/latest-batch-episodes
// @desc    Get latest batch links
// @access  Public
router.get('/latest-batch-episodes', IndexAPIRequestsLimiter, async (req, res) => {
    try {
        const episodes = await Episode.findAll({
            where: { episode_number: "0", special_type: "toplu" },
            attributes: [
                'id',
                'episode_number',
                'anime_id',
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
                ]
            ], order: [['created_time', 'DESC']], limit: 6
        })

        res.status(200).json(episodes)
    } catch (err) {
        console.log(err)
    }
})

// @route   GET api/latest-works
// @desc    Get latest animes
// @access  Public
router.get('/latest-works', async (req, res) => {
    try {
        const [animes, mangas, episodes, manga_episodes] = await Promise.all([
            Anime.findAll({
                attributes: [
                    'name',
                    'slug',
                    'id',
                    'version',
                    'synopsis',
                    'genres',
                    'cover_art',
                    'release_date',
                    [
                        Sequelize.literal(`(
                            SELECT name
                            FROM user
                            WHERE
                                id = anime.created_by
                        )`),
                        'created_by'
                    ],
                    'created_time'
                ],
                limit: 24,
                order: [['id', 'DESC']]
            }),
            Manga.findAll({
                attributes: [
                    'name',
                    'slug',
                    'id',
                    'synopsis',
                    'genres',
                    'cover_art',
                    'release_date',
                    [
                        Sequelize.literal(`(
                            SELECT name
                            FROM user
                            WHERE
                                id = manga.created_by
                        )`),
                        'created_by'
                    ],
                    'created_time'
                ],
                limit: 24,
                order: [['id', 'DESC']]
            }),
            Episode.findAll({
                attributes: [
                    'id',
                    'episode_number',
                    'special_type',
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
                    [
                        Sequelize.literal(`(
                            SELECT name
                            FROM user
                            WHERE
                                id = episode.created_by
                        )`),
                        'created_by'
                    ],
                    'created_time'
                ],
                limit: 18,
                order: [['created_time', 'DESC']],
                where: { special_type: { [Sequelize.Op.ne]: "toplu" } }
            }),
            MangaEpisode.findAll({
                attributes: [
                    'episode_number',
                    'episode_name',
                    [
                        Sequelize.literal(`(
                            SELECT name
                            FROM manga
                            WHERE
                                id = manga_episode.manga_id
                        )`),
                        'manga_name'
                    ],
                    [
                        Sequelize.literal(`(
                            SELECT slug
                            FROM manga
                            WHERE
                                id = manga_episode.manga_id
                        )`),
                        'manga_slug'
                    ],
                    [
                        Sequelize.literal(`(
                            SELECT cover_art
                            FROM manga
                            WHERE
                                id = manga_episode.manga_id
                        )`),
                        'manga_cover'
                    ],
                    [
                        Sequelize.literal(`(
                            SELECT name
                            FROM user
                            WHERE
                                id = manga_episode.created_by
                        )`),
                        'created_by'
                    ],
                    'created_time'
                ],
                limit: 18,
                order: [['created_time', 'DESC']],
            })])

        return res.status(200).json({
            animes,
            mangas,
            episodes,
            manga_episodes
        })
    } catch (err) {
        console.log(err)
    }
})

// @route   GET api/featured-anime
// @desc    Get featured-anime
// @access  Public
router.get('/featured-anime', async (req, res) => {
    try {
        const featured_animes = await Anime.findAll({
            where: { is_featured: 1 },
            attributes: [
                'pv',
                'name',
                'slug',
                'id',
                'version',
                'synopsis',
                'genres',
            ],
            limit: 12,
            order: [['created_time', 'DESC']]
        })

        return res.status(200).json(featured_animes)
    } catch (err) {
        console.log(err)
    }
})

// @route   GET api/header-getir/:link
// @desc    Get anime header
// @access  Public
router.get('/header-getir', (req, res) => {
    const { type } = req.query
    const { name } = req.body
    axios.get(`https://kitsu.io/api/edge/${type ? type : "anime"}?filter[slug]=` + standartSlugify(name))
        .then(resp => {
            const { data } = resp.data

            if (data.length === 0) res.status(404).send()
            if (data[0] && data[0].attributes.coverImage.original)
                res.status(200).json({ header: data[0].attributes.coverImage.original, cover_art: data[0].attributes.posterImage.original })
            else res.status(404).send()
        })
        .catch(err => {
            console.log(err)
            res.status(404)
        })
})

// @route   GET api/genre-list
// @desc    Get genre-list
// @access  Public
router.get('/genre-list', (req, res) => {
    const list = Object.values(genremap)

    res.status(200).json({ list })
})

module.exports = router;