const express = require('express')
const router = express.Router()
const Path = require('path')
const standartSlugify = require('standard-slugify')

// @route   GET api/resimler/anime/:slug
// @desc    Get anime images
// @access  Public
router.get('/anime/:slug', (req, res) => {
    const slug = standartSlugify(req.params.slug)
    if (req.query.type === "logo")
        res.sendFile(Path.resolve(__dirname, '../../images/anime', `${slug}.png`), (err) => {
            if (err) {
                res.status(404).end()
            }
        })
    else
        res.sendFile(Path.resolve(__dirname, '../../images/anime', `${slug}.jpeg`), (err) => {
            if (err) {
                res.status(404).end()
            }
        })
})

// @route   GET api/resimler/manga/:slug
// @desc    Get manga images
// @access  Public
router.get('/manga/:slug', (req, res) => {
    const slug = standartSlugify(req.params.slug)
    res.sendFile(Path.resolve(__dirname, '../../images/manga', `${slug}.jpeg`), (err) => {
        if (err) {
            res.status(404).end()
        }
    })
})

// @route   GET api/resimler/manga/:slug/oku/:episode_number/:filename
// @desc    Get manga episode images
// @access  Public
router.get('/manga/:slug/oku/:episode_number/:filename', (req, res) => {
    const { slug, episode_number, filename } = req.params

    const path = Path.resolve(__dirname, `../../images/manga_episodes/${slug}/${episode_number}`, `${filename}`)
    res.sendFile(path, (err) => {
        if (err) {
            res.status(404).end()
        }
    })
})

module.exports = router;