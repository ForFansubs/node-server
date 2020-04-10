const express = require('express')
const router = express.Router()
const path = require('path')
const standartSlugify = require('standard-slugify')

// @route   GET api/images/anime/:slug
// @desc    Get anime images
// @access  Public
router.get('/anime/:slug', (req, res) => {
    const slug = standartSlugify(req.params.slug)
    res.sendFile(path.resolve(__dirname, '../../images/anime', `${slug}.jpeg`), (err) => {
        if (err) {
            res.status(404).end()
        }
    })
})

// @route   GET api/images/manga/:slug
// @desc    Get manga images
// @access  Public
router.get('/manga/:slug', (req, res) => {
    const slug = standartSlugify(req.params.slug)
    res.sendFile(path.resolve(__dirname, '../../images/manga', `${slug}.jpeg`), (err) => {
        if (err) {
            res.status(404).end()
        }
    })
})

module.exports = router;