const sitemap = require('express-sitemap')
const Sequelize = require('sequelize')
const Anime = require('../models/Anime')
const Manga = require('../models/Manga')
const Episode = require('../models/Episode')
const MangaEpisode = require('../models/MangaEpisode')

function episodeTitleParser(episodenumber, specialtype) {
    if (specialtype && specialtype !== "toplu") {
        return `${specialtype}${episodenumber}`
    }
    else return `bolum${episodenumber}`
}

const generateSitemap = async () => {
    let map = {
        '/': ['get']
    }

    let route = {
        '/': {
            changefreq: 'always',
            priority: 1.0
        },
        '/ekip-alimlari': {
            priority: 0.3
        },
        '/ara': {
            priority: 0.5
        },
        '/admin': {
            disallow: true,
        },
    }

    try {
        const anime = await Anime.findAll({ raw: true })
        const manga = await Manga.findAll({ raw: true })
        const episode = await Episode.findAll({
            raw: true,
            where:
            {
                special_type: {
                    [Sequelize.Op.ne]: "toplu"
                }
            },
            attributes: [
                'episode_number',
                'special_type',
                [
                    Sequelize.literal(`(
                    SELECT slug
                    FROM anime
                    WHERE
                        id = episode.anime_id
                )`),
                    'anime_slug'
                ]
            ],
            order: [['special_type'], [Sequelize.fn('ABS', Sequelize.col('episode_number'))]]
        })
        const manga_episode = await MangaEpisode.findAll({
            raw: true,
            attributes: [
                'episode_number',
                [
                    Sequelize.literal(`(
                        SELECT slug
                        FROM manga
                        WHERE
                            id = manga_episode.manga_id
                    )`),
                    'manga_slug'
                ]
            ],
            order: [[Sequelize.fn('ABS', Sequelize.col('episode_number'))]]
        })

        // Generate map object from data
        anime.map(({ slug }) => map[`/ceviriler/anime/${slug}`] = ["get"])
        manga.map(({ slug }) => map[`/ceviriler/manga/${slug}`] = ["get"])
        episode.map(({ anime_slug, episode_number, special_type }) => map[`/ceviriler/anime/${anime_slug}/izle/${episodeTitleParser(episode_number, special_type)}`] = ["get"])
        manga_episode.map(({ manga_slug, episode_number }) => map[`/ceviriler/manga/${manga_slug}/oku/${episode_number}`] = ["get"])

        // Generate sitemap from map and route objects, save it to ./config/sitemap.xml path
        sitemap({
            url: process.env.HOST_URL.replace('http://', '').replace('https://', ''),
            map: map,
            route: route
        }).XMLtoFile('./config/sitemap.xml')

        console.info(`✔️ Sitemap oluşturuldu. ${new Date().getHours() + ":" + new Date().getMinutes()}`)
    } catch (err) {
        console.log(err)
        console.error('❌ Sitemap oluşturulurken bir sorunla kaşılaştık.')
    }
}

module.exports = { generateSitemap }