const express = require('express')
const router = express.Router()
const check_permission = require('../../middlewares/check_permission')
const sendDiscordEmbed = require('../../methods/discord_embed')
const downloadImage = require('../../methods/download_image')
const deleteImage = require('../../methods/delete_image')
const Sequelize = require("sequelize");
const standartSlugify = require('standard-slugify')
const genre_map = require("../../config/maps/genremap")
const error_messages = require("../../config/error_messages")
const { deleteMangaFolders } = require('../../methods/manga-episode')

const { LogAddManga, LogUpdateManga, LogDeleteManga } = require("../../methods/database_logs")

const Manga = require('../../models/Manga')
const MangaEpisode = require('../../models/MangaEpisode')

// @route   GET api/manga/manga-ekle
// @desc    Add manga (perm: "add-manga")
// @access  Private
router.post('/manga-ekle', async (req, res) => {
    let username, user_id, manga
    try {
        const check_res = await check_permission(req.headers.authorization, "add-manga")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        manga = await Manga.findOne({ where: { name: req.body.name } })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    if (manga) res.status(400).json({ 'err': 'Bu manga zaten ekli.' })
    else {
        const { translators, editors, authors, header, cover_art, logo, download_link, reader_link, synopsis, name } = req.body

        //Release date için default bir değer oluştur, eğer MAL'dan data alındıysa onunla değiştir
        let release_date = new Date(1)
        if (req.body.release_date) release_date = req.body.release_date

        //Mal linkinin id'sini al, tekrardan buildle
        let mal_link_id = req.body.mal_link.split("/")[4]
        mal_link = `https://myanimelist.net/manga/${mal_link_id}`

        //Türleri string olarak al ve mapten Türkçeye çevir
        let genres = req.body.genres
        genres = genres.mapReplace(genre_map)

        const slug = standartSlugify(name)

        try {
            //Eğer logo linki verilmişse al ve diske kaydet
            if (logo) {
                try {
                    await downloadImage(logo, "logo", slug, "manga")
                } catch (err) {
                    console.log(err)
                }
            }

            //Cover_art'ı diske indir
            try {
                await downloadImage(cover_art, "cover", slug, "manga")
            } catch (err) {
                console.log(err)
            }

            //Header linki yollanmışsa alıp diske kaydet
            if (header) {
                try {
                    await downloadImage(header, "header", slug, "manga")
                } catch (err) {
                    console.log(err)
                }
            }

            const result = await Manga.create({
                synopsis,
                name,
                slug,
                translators,
                editors,
                release_date: new Date(release_date).toISOString().slice(0, 19).replace('T', ' '),
                created_by: user_id,
                authors,
                cover_art,
                mal_link,
                download_link,
                reader_link,
                genres,
            })

            if (header !== "-" && header) downloadImage(header, "header", slug, "manga")

            LogAddManga({
                process_type: 'add-manga',
                username: username,
                manga_id: result.id
            })

            sendDiscordEmbed({
                type: "manga",
                manga_id: result.id
            })

            return res.status(200).json({ 'success': 'success' })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
        }
    }
})

// @route   POST api/manga/manga-guncelle
// @desc    Update manga (perm: "update-manga")
// @access  Private
router.post('/manga-guncelle', async (req, res) => {
    const { id } = req.body

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "update-manga")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    const { name, cover_art, download_link, reader_link, release_date, translators, editors, genres, authors, header, logo, mal_link } = req.body
    const synopsis = req.body.synopsis.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")

    //Cover_art'ı diske indir
    try {
        await downloadImage(cover_art, "cover", slug, "manga")
    } catch (err) {
        return res.status(500).json({ "err": "Coverart güncellenirken bir sorun oluştu." })
    }

    //Eğer logo inputuna "-" konulmuşsa, diskteki logoyu sil
    if (logo === "-") {
        try {
            await deleteImage(slug, "manga", "logo")
        } catch (err) {
            return res.status(500).json({ "err": "Logo silinirken bir sorun oluştu." })
        }
    }

    //Eğer logo linki verilmişse al ve diske kaydet
    if (logo && logo !== "-") {
        try {
            await downloadImage(logo, "logo", slug, "manga")
        } catch (err) {
            return res.status(500).json({ "err": "Coverart güncellenirken bir sorun oluştu." })
        }
    }

    //Eğer header inputuna "-" konulmuşsa, diskteki resmi sil
    if (header === "-") {
        deleteImage(slug, "manga", "header")
    }

    //Eğer bir header linki gelmişse, bu resmi indirip diskteki resmi değiştir
    if (header && header !== "-") {
        downloadImage(header, "header", slug, "manga")
    }

    const keys = Object.keys(updatedManga)
    const values = Object.values(updatedManga)

    try {
        await Manga.update({
            synopsis,
            name,
            translators,
            editors,
            authors,
            cover_art,
            mal_link,
            download_link,
            reader_link,
            release_date: new Date(release_date).toISOString().slice(0, 19).replace('T', ' '),
            genres
        }, { where: { id: id } })

        LogUpdateManga({
            process_type: 'update-manga',
            username: username,
            manga_id: id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        return res.status(404).json({ 'err': 'Güncellemede bir sorun oluştu.' })
    }
})

// @route   GET api/manga/manga-sil
// @desc    Delete manga (perm: "delete-manga")
// @access  Private
router.post('/manga-sil/', async (req, res) => {
    let manga
    const { id } = req.body

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-manga")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        manga = await Manga.findOne({ where: { id: id } })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    try {
        Promise.all([deleteMangaFolders(manga.slug), MangaEpisode.destroy({ where: { manga_id: id } }), Manga.destroy({ where: { id: id } })])

        //Mangayla bağlantılı resimleri diskte varsa sil.
        try {
            await deleteImage(manga.slug, "manga", "header")
        } catch (err) {
            console.log(err)
        }
        try {
            await deleteImage(manga.slug, "manga", "logo")
        } catch (err) {
            console.log(err)
        }
        try {
            await deleteImage(manga.slug, "manga", "cover")
        } catch (err) {
            console.log(err)
        }

        LogDeleteManga({
            process_type: 'delete-manga',
            username: username,
            manga_name: manga.name
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        console.log(err)
        res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
    }
})

// @route   GET api/manga/liste
// @desc    Get all mangas
// @access  Private
router.get('/liste', async (req, res) => {
    let mangas

    try {
        mangas = await Manga.findAll({
            attributes: [
                'slug',
                'name',
                'synopsis',
                'genres',
                'cover_art'
            ], order: ['name']
        })

        const mangaList = mangas.map(manga => {
            manga.genres = manga.genres.split(',')
            return manga
        })

        res.status(200).json(mangaList)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/manga/admin-liste
// @desc    Get all mangas
// @access  Private
router.get('/admin-liste', async (req, res) => {
    try {
        const check_res = await check_permission(req.headers.authorization, "see-admin-page")
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        const mangas = await Manga.findAll({ order: ['name'] })
        const mangaList = mangas.map(manga => {
            manga.genres = manga.genres.split(',')
            return manga
        })
        res.status(200).json(mangaList)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/manga/:slug/admin-view
// @desc    View manga
// @access  Private
router.get('/:slug/admin-view', async (req, res) => {
    const { slug } = req.params

    try {
        let manga = await Manga.findOne({ where: { slug: slug } })
        const episodes = await MangaEpisode.findAll({ where: { manga_id: manga.id } })
        if (!manga) {
            return res.status(404).json({ 'err': 'Görüntülemek istediğiniz mangayı bulamadık.' });
        } else {
            manga.dataValues.episodes = episodes || []
            res.json(manga);
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

// @route   GET api/manga/:slug
// @desc    View manga
// @access  Public
router.get('/:slug', async (req, res) => {
    const { slug } = req.params

    try {
        const manga = await Manga.findOne({
            where: {
                slug: slug
            },
            attributes: [
                'name',
                'slug',
                'id',
                'synopsis',
                'translators',
                'editors',
                'authors',
                'genres',
                'cover_art',
                'mal_link',
                'reader_link',
                'download_link',
                [
                    Sequelize.literal(`(SELECT COUNT(*) FROM manga_episode WHERE manga_id=manga.id)`),
                    'episode_count'
                ],
                'release_date',
                'trans_status',
                'series_status',
                [
                    Sequelize.literal(`(
                        SELECT name
                        FROM user
                        WHERE
                            id = manga.created_by
                    )`),
                    'created_by'
                ]
            ]
        })

        if (!manga) {
            return res.status(404).json({ 'err': 'Görüntülemek istediğiniz mangayı bulamadık.' });
        } else {
            res.json(manga);
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

module.exports = router;
