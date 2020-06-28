const express = require('express')
const router = express.Router()
const check_permission = require('../../middlewares/check_permission')
const sendDiscordEmbed = require('../../methods/discord_embed')
const downloadImage = require('../../methods/download_image')
const renameImage = require('../../methods/rename_image')
const deleteImage = require('../../methods/delete_image')
const Sequelize = require("sequelize");
const standartSlugify = require('standard-slugify')
const genre_map = require("../../config/maps/genremap")
const season_map = require("../../config/maps/seasonmap")
const status_map = require("../../config/maps/statusmap")
const error_messages = require("../../config/error_messages")

const { LogAddAnime, LogUpdateAnime, LogDeleteAnime, LogFeaturedAnime } = require("../../methods/database_logs")
const { GeneralAPIRequestsLimiter } = require('../../middlewares/rate-limiter')

// Models
const Anime = require('../../models/Anime')
const Episode = require('../../models/Episode')
const DownloadLink = require('../../models/DownloadLink')
const WatchLink = require('../../models/WatchLink')


String.prototype.mapReplace = function (map) {
    var regex = [];
    for (var key in map)
        regex.push(key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
    return this.replace(new RegExp(regex.join('|'), "g"), function (word) {
        return map[word];
    });
};

// @route   POST api/anime/anime-ekle
// @desc    Add anime (perm: "add-anime")
// @access  Private
router.post('/anime-ekle', async (req, res) => {
    let anime

    //Yetkiyi ve kullanıcıyı kontrol et. Kullanıcının "add-anime" yetkisi var mı bak.
    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "add-anime")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    //Eğer varsa anime daha önceden eklenmiş mi diye isimle kontrol et. 
    try {
        anime = await Anime.findOne({ raw: true, where: { name: req.body.name } })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    //Eğer varsa öne hata yolla.
    if (anime) return res.status(400).json({ 'err': 'Bu anime zaten ekli.' })

    //Yoksa değerleri variable'lara eşitle.
    const { header, cover_art, logo, translators, encoders, studios, version, trans_status, pv, name, synopsis } = req.body

    //Slug'ı yukardaki fonksiyonla oluştur.
    const slug = version === 'bd' ? standartSlugify(name) + "-bd" : standartSlugify(name)

    //Release date için default bir değer oluştur, eğer MAL'dan data alındıysa onunla değiştir
    let release_date = new Date(1)
    if (req.body.release_date) release_date = req.body.release_date

    //Mal linkinin id'sini al, tekrardan buildle
    let mal_link_id = req.body.mal_link.split("/")[4]
    const mal_link = `https://myanimelist.net/anime/${mal_link_id}`

    //Türleri string olarak al ve mapten Türkçeye çevir
    let genres = req.body.genres
    genres = genres.mapReplace(genre_map)

    //Yayınlanma sezonunu string olarak al, mapten Türkçeye çevir
    let premiered = req.body.premiered
    if (premiered) premiered = premiered.mapReplace(season_map)

    //Bölüm sayısı MAL'da bulunduysa al sisteme kaydet
    if (req.body.episode_count) episode_count = req.body.episode_count

    //Seri durumunu string olarak al, mapten Türkçeye çevir
    const series_status = req.body.series_status.mapReplace(status_map)

    //Database'e yolla.
    try {
        const result = await Anime.create({
            synopsis,
            name,
            slug,
            translators,
            encoders,
            series_status,
            trans_status,
            release_date: new Date(release_date).toISOString().slice(0, 19).replace('T', ' '),
            created_by: user_id,
            episode_count,
            studios,
            cover_art,
            mal_link,
            genres,
            premiered,
            version,
            pv
        })

        LogAddAnime({
            process_type: 'add-anime',
            username: username,
            anime_id: result.id
        })

        //Discord Webhook isteği yolla.
        sendDiscordEmbed({
            type: "anime",
            anime_id: result.id
        })

        //Eğer logo linki verilmişse al ve diske kaydet
        if (logo) {
            try {
                await downloadImage(logo, "logo", slug, "anime")
            } catch (err) {
                console.log(err)
            }
        }

        //Cover_art'ı diske indir
        try {
            await downloadImage(cover_art, "cover", slug, "anime")
        } catch (err) {
            console.log(err)
        }

        //Header linki yollanmışsa alıp diske kaydet
        if (header) {
            try {
                await downloadImage(header, "header", slug, "anime")
            } catch (err) {
                console.log(err)
            }
        }

        res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
    }
})

// @route   POST api/anime/anime-guncelle
// @desc    Update anime (perm: "update-anime")
// @access  Private
router.post('/anime-guncelle', async (req, res) => {
    let anime
    const { id } = req.body
    //Yetkiyi ve kullanıcı kontrol et. "update-anime" yetkisi var mı bak.
    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "update-anime")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    //Güncellenecek animeyi database'te bul
    try {
        anime = await Anime.findOne({ raw: true, where: { id: id } })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    //Önden gelen dataları variablelara kaydet.
    const { name, header, synopsis, cover_art, logo, release_date, mal_link, premiered, translators, encoders, genres, studios, episode_count, series_status, version, trans_status, pv } = req.body
    let { slug } = anime

    //Eğer içeriğin türü değiştiyse, slug'ı ona göre değiştir.
    if (version !== anime.version) {
        const oldSlug = slug
        slug = version === "bd" ? `${slug}-bd` : `${slug.replace('-bd', '')}`
        try {
            await renameImage(oldSlug, slug, "logo", "anime")
            await renameImage(oldSlug, slug, "header", "anime")
            await renameImage(oldSlug, slug, "cover", "anime")
        } catch (err) {
            console.log(err)
        }
    }

    //Database'teki satırı güncelle.
    try {
        await Anime.update({
            synopsis,
            name,
            slug,
            translators,
            encoders,
            series_status,
            trans_status,
            release_date: new Date(release_date).toISOString().slice(0, 19).replace('T', ' '),
            created_by: user_id,
            episode_count,
            studios,
            cover_art,
            mal_link,
            genres,
            premiered,
            version,
            pv
        }, {
            where: {
                id: id
            }
        })

        LogUpdateAnime({
            process_type: 'update-anime',
            username: username,
            anime_id: id
        })

        //Cover_art'ı diske indir
        downloadImage(cover_art, "cover", slug, "anime")

        //Eğer logo inputuna "-" konulmuşsa, diskteki logoyu sil
        if (logo === "-") {
            deleteImage(slug, "anime", "logo")
        }

        //Eğer logo linki verilmişse al ve diske kaydet
        if (logo && logo !== "-") {
            downloadImage(logo, "logo", slug, "anime")
        }

        //Eğer header inputuna "-" konulmuşsa, diskteki resmi sil
        if (header === "-") {
            deleteImage(slug, "anime", "header")
        }

        //Eğer bir header linki gelmişse, bu resmi indirip diskteki resmi değiştir
        if (header && header !== "-") {
            downloadImage(header, "header", slug, "anime")
        }

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        return res.status(500).json({ 'err': 'Güncellemede bir sorun oluştu.' })
    }
})

// @route   GET api/anime/anime-sil
// @desc    Delete anime (perm: "delete-anime")
// @access  Private
router.post('/anime-sil/', async (req, res) => {
    let anime
    const { id } = req.body

    let username
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-anime")
        username = check_res.username
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    anime = await Anime.findOne({ raw: true, where: { id: id } })

    if (!anime) return res.status(500).json({ 'err': error_messages.database_error })

    try {
        await Promise.all(
            [
                Anime.destroy({ where: { id: id } })
            ],
            [
                Episode.destroy({ where: { anime_id: id } })
            ],
            [
                DownloadLink.destroy({ where: { anime_id: id } })
            ],
            [
                WatchLink.destroy({ where: { anime_id: id } })
            ]
        )
        //Animeyle bağlantılı resimleri diskte varsa sil.
        try {
            await deleteImage(anime.slug, "anime", "header")
        } catch (err) {
            console.log(err)
        }
        try {
            await deleteImage(anime.slug, "anime", "logo")
        } catch (err) {
            console.log(err)
        }
        try {
            await deleteImage(anime.slug, "anime", "cover")
        } catch (err) {
            console.log(err)
        }

        LogDeleteAnime({
            process_type: 'delete-anime',
            username: username,
            anime_name: anime.name
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   POST api/anime/update-featured-anime
// @desc    Featured anime (perm: "featured-anime")
// @access  Private
router.post('/update-featured-anime', async (req, res) => {
    const { data } = req.body

    let username
    try {
        const check_res = await check_permission(req.headers.authorization, "featured-anime")
        username = check_res.username
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        Anime.update({ is_featured: 0 }, { where: { is_featured: 1 } })
    } catch (err) {
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    try {
        await Anime.update({ is_featured: 1 }, {
            where: {
                name: {
                    [Sequelize.Op.in]: data.map(({ name }) => name)
                },
                version: {
                    [Sequelize.Op.in]: data.map(({ version }) => version)
                }
            }
        })
        res.status(200).json({ 'success': 'success' })
        LogFeaturedAnime({
            process_type: 'featured-anime',
            username: username
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/anime/admin-featured-anime
// @desc    Get featured-anime
// @access  Public
router.get('/admin-featured-anime', async (req, res) => {
    try {
        await check_permission(req.headers.authorization, "see-admin-page")
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }
    try {
        const anime = await Anime.findAll({ where: { is_featured: 1 } })
        res.status(200).json(anime)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: error_messages.database_error })
    }
})

// @route   GET api/anime/liste
// @desc    Get all animes
// @access  Public
router.get('/liste', GeneralAPIRequestsLimiter, async (req, res) => {
    let animes

    try {
        animes = await Anime.findAll({ raw: true, attributes: ['slug', 'name', 'synopsis', 'version', 'genres', 'premiered', 'cover_art'], order: ['name'] })
        const animeList = animes.map(anime => {
            anime.genres = anime.genres.split(',')
            return anime
        })
        res.status(200).json(animeList)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: error_messages.database_error })
    }
})

// @route   GET api/anime/admin-liste
// @desc    Get all animes with all data
// @access  Public
router.get('/admin-liste', async (req, res) => {
    try {
        await check_permission(req.headers.authorization, "see-admin-page")
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        const animes = await Anime.findAll({ order: ['name'] })
        res.status(200).json(animes)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: error_messages.database_error })
    }
})

// @route   GET api/anime/:slug/admin-view
// @desc    View anime
// @access  Private
router.get('/:slug/admin-view', async (req, res) => {
    let anime, episodes
    try {
        await check_permission(req.headers.authorization, "update-anime")
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        anime = await Anime.findOne({ where: { slug: req.params.slug } })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: error_messages.database_error })
    }

    if (!anime) {
        return res.status(404).json({ 'err': 'Görüntülemek istediğiniz animeyi bulamadık.' });
    } else {
        //Anime bulunduysa bölümlerini çek.
        try {
            episodes = await Episode.findAll({ where: { anime_id: anime.id }, order: [['special_type'], [Sequelize.fn('ABS', Sequelize.col('episode_number'))]] })
            anime.dataValues.episodes = episodes
            res.status(200).json(anime)
        } catch (err) {
            console.log(err)
            return res.status(500).json({ err: error_messages.database_error })
        }
    }

})

// @route   GET api/anime/:slug
// @desc    View anime
// @access  Public
router.get('/:slug', GeneralAPIRequestsLimiter, async (req, res) => {
    let anime, episodes
    try {
        anime = await Anime.findOne({
            where: { slug: req.params.slug },
            attributes: [
                'name',
                'slug',
                'id',
                'version',
                'synopsis',
                'translators',
                'encoders',
                'studios',
                'genres',
                'cover_art',
                'mal_link',
                'episode_count',
                'release_date',
                'premiered',
                'trans_status',
                'series_status',
                [
                    Sequelize.literal(`(
                        SELECT name
                        FROM user
                        WHERE
                            id = anime.created_by
                    )`),
                    'created_by'
                ]
            ]
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: error_messages.database_error })
    }
    //Eğer anime yoksa hata yolla.
    if (!anime) {
        return res.status(404).json({ 'err': 'Görüntülemek istediğiniz animeyi bulamadık.' });
    } else {
        //Anime bulunduysa bölümlerini çek.
        try {
            episodes = await Episode.findAll({ where: { anime_id: anime.id, can_user_download: 1 }, order: [['special_type'], [Sequelize.fn('ABS', Sequelize.col('episode_number'))]] })
            anime.dataValues.episodes = episodes
            res.status(200).json(anime)
        } catch (err) {
            console.log(err)
            return res.status(500).json({ err: error_messages.database_error })
        }
    }
})

module.exports = router;
