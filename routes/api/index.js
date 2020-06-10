const package = require('../../package.json')
const express = require('express')
const router = express.Router()
const check_permission = require('../../middlewares/check_permission')
const jsdom = require("jsdom")
const mariadb = require('../../config/maria')
const axios = require("axios")
const genremap = require('../../config/maps/genremap')
const standartSlugify = require('standard-slugify')

jsdom.defaultDocumentFeatures = {
    FetchExternalResources: ['script'],
    ProcessExternalResources: ['script'],
    MutationEvents: '2.0',
    QuerySelector: false
};
const { JSDOM } = jsdom;

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
    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "see-logs")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }
    try {
        const logs = await mariadb(`SELECT user, process_type, text, process, created_time, id FROM log ORDER BY id DESC`)
        res.status(200).json(logs)
    } catch (err) {
        res.status(400).json({ 'err': 'Kayıtları alırken bir sorun oluştu.' })
        return false
    }
})

// @route   GET api/latest-batch-episodes
// @desc    Get latest batch links
// @access  Public
router.get('/latest-batch-episodes', async (req, res) => {
    try {
        const episodes = await mariadb(`
        SELECT 
        id, 
        episode_number, 
        anime_id, 
        (SELECT name FROM anime WHERE id=episode.anime_id) as name, 
        (SELECT slug FROM anime WHERE id=episode.anime_id) as slug 
        FROM episode 
        WHERE episode_number="0" AND special_type="toplu"
        ORDER BY 
        created_time 
        DESC LIMIT 6`)
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
            mariadb(`
            SELECT id, slug, name, synopsis, release_date, cover_art, genres, (SELECT name FROM user WHERE id=anime.created_by) as created_by, created_time, version 
            FROM anime 
            ORDER BY id 
            DESC LIMIT 12`
            ),
            mariadb(`
            SELECT id, slug, name, synopsis, release_date, cover_art, (SELECT name FROM user WHERE id=manga.created_by) as created_by, created_time, genres 
            FROM manga 
            ORDER BY created_time 
            DESC LIMIT 12`
            ),
            mariadb(`
            SELECT 
            ep.id as episode_id, ep.episode_number as episode_number, ep.special_type as special_type, ep.credits as credits, ep.created_time as created_time, (SELECT name FROM user WHERE id=ep.created_by) as created_by, an.cover_art as cover_art, an.name as anime_name, an.id as anime_id, an.version as anime_version, an.slug as anime_slug 
            FROM episode as ep 
            INNER JOIN anime as an 
            ON ep.anime_id = an.id 
            WHERE ep.special_type!='toplu' 
            ORDER BY ep.id 
            DESC LIMIT 12`
            ),
            mariadb(`
            SELECT
            (SELECT name FROM manga WHERE id=manga_episode.manga_id) as manga_name,
            (SELECT cover_art FROM manga WHERE id=manga_episode.manga_id) as manga_cover,
            (SELECT slug FROM manga WHERE id=manga_episode.manga_id) as manga_slug,
            episode_number,
            episode_name,
            (SELECT name FROM user WHERE id=manga_episode.created_by) as created_by,
            created_time
            FROM manga_episode
            ORDER BY created_time
            DESC LIMIT 12`
            )])
        const data = {
            animes,
            mangas,
            episodes,
            manga_episodes
        }
        res.status(200).json(data)
    } catch (err) {
        console.log(err)
    }
})

// @route   GET api/featured-anime
// @desc    Get featured-anime
// @access  Public
router.get('/featured-anime', async (req, res) => {
    try {
        const anime = await mariadb(`
        SELECT 
        pv, 
        name, 
        synopsis, 
        id, 
        slug, 
        premiered, 
        genres, 
        version 
        FROM anime
        WHERE is_featured = 1
        ORDER BY 
        created_time
        DESC`)
        res.status(200).json(anime)
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
            if (resp.data.data[0] && resp.data.data[0].attributes.coverImage.original)
                res.status(200).json({ header: resp.data.data[0].attributes.coverImage.original, cover_art: resp.data.data[0].attributes.posterImage.original })
            else res.status(404)
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