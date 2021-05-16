const express = require('express')
const router = express.Router()
const { IndexAPIRequestsLimiter } = require('../../middlewares/rate-limiter')

const { Sequelize, Anime, Episode, sequelize } = require("../../config/sequelize")

// @route   GET api/
// @desc    Index route
// @access  Public
router.get('/', async (req, res) => {
    const calendarList = await Anime.findAll({
        where: {
            series_status: {
                [Sequelize.Op.or]: ["currently_airing", "not_aired_yet"]
            },
            trans_status: {
                [Sequelize.Op.or]: ["currently_airing", "not_aired_yet"]
            }
        },
        attributes: ["name", "cover_art", "slug", "series_status", "release_date"],
        order: [sequelize.literal("HOUR(release_date)"), sequelize.literal("MINUTE(release_date)")],
        include: {
            model: Episode,
            as: "episodes",
            where: {
                special_type: ""
            },
            order: [[sequelize.literal("episode_number + 0"), "DESC"]],
            attributes: ["episode_number"],
            limit: 1,
            required: false,
        },
    })

    if (!calendarList) res.status(404)
    return res.status(200).json(calendarList)
})

module.exports = router;