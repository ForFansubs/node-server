const express = require('express')
const router = express.Router()
const Path = require('path')
const standartSlugify = require('standard-slugify')
const sanitize = require("sanitize-filename")

const rateLimit = require("express-rate-limit");

const MangaEpisodeImageLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 5 minutes
    max: 1000, // start blocking after 1000 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 5 dakika sonra tekrar deneyin."
});

const VariousImageLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutes
    max: 500, // start blocking after 500 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 3 dakika sonra tekrar deneyin."
});

// @route   GET api/resimler/anime/:slug
// @desc    Get anime images
// @access  Public
router.get('/anime/:slug', VariousImageLimiter, (req, res) => {
    const slug = standartSlugify(req.params.slug) // Old compatibility
    if (req.query.type === "logo")
        res.sendFile(Path.resolve(__dirname, '../../images/anime', `${sanitize(slug)}.png`), (err) => {
            if (err) {
                res.status(404).end()
            }
        })
    else
        res.sendFile(Path.resolve(__dirname, '../../images/anime', `${sanitize(slug)}.jpeg`), (err) => {
            if (err) {
                res.status(404).end()
            }
        })
})

// @route   GET api/resimler/manga/:slug
// @desc    Get manga images
// @access  Public
router.get('/manga/:slug', VariousImageLimiter, (req, res) => {
    const slug = standartSlugify(req.params.slug)
    if (req.query.type === "logo")
        res.sendFile(Path.resolve(__dirname, '../../images/manga', `${sanitize(slug)}.png`), (err) => {
            if (err) {
                res.status(404).end()
            }
        })
    else
        res.sendFile(Path.resolve(__dirname, '../../images/manga', `${sanitize(slug)}.jpeg`), (err) => {
            if (err) {
                res.status(404).end()
            }
        })
})

// @route   GET api/resimler/manga/:slug/oku/:episode_number/:filename
// @desc    Get manga episode images
// @access  Public
router.get('/manga/:slug/oku/:episode_number/:filename', MangaEpisodeImageLimiter, (req, res) => {
    const { slug, episode_number, filename } = req.params

    const path = Path.resolve(__dirname, `../../images/manga_episodes/${sanitize(slug)}/${sanitize(episode_number)}`, `${sanitize(filename)}`)
    res.sendFile(path, (err) => {
        if (err) {
            res.status(404).end()
        }
    })
})

module.exports = router;