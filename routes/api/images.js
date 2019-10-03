const express = require('express')
const router = express.Router()
const path = require('path')

// @route   GET api/images/anime/:slug
// @desc    Get anime images
// @access  Public
router.get('/anime/:slug', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../images/anime', `${req.params.slug}`), (err) => {
        if (err) {
            res.status(err.status).end()
        }
    })
})

// @route   GET api/images/manga/:slug
// @desc    Get manga images
// @access  Public
router.get('/manga/:slug', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../images/manga', `${req.params.slug}`), (err) => {
        if (err) {
            res.status(err.status).end()
        }
    })
})

module.exports = router;