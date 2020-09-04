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
// @access  Public
router.get('/', async (req, res) => {
    const calendarList = Anime.findAll({ where: "" })
})

// @route   GET api/
// @desc    Index route
// @access  Public
router.post('/', async (req, res) => {

})

// @route   GET api/
// @desc    Index route
// @access  Public
router.put('/:id', async (req, res) => {

})

// @route   GET api/
// @desc    Index route
// @access  Public
router.delete('/:id', async (req, res) => {

})


module.exports = router;