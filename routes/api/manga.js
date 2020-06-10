const express = require('express')
const router = express.Router()
const check_permission = require('../../middlewares/check_permission')
const sendDiscordEmbed = require('../../methods/discord_embed')
const downloadImage = require('../../methods/download_image')
const deleteImage = require('../../methods/delete_image')
const mariadb = require('../../config/maria')
const standartSlugify = require('standard-slugify')
const genre_map = require("../../config/maps/genremap")
const error_messages = require("../../config/error_messages")

const { LogAddManga, LogUpdateManga, LogDeleteManga } = require("../../methods/database_logs")

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
        manga = await mariadb(`SELECT name FROM manga WHERE name="${req.body.name}"`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    if (manga[0]) res.status(400).json({ 'err': 'Bu manga zaten ekli.' })
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

        const newManga = {
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
        }

        const keys = Object.keys(newManga)
        const values = Object.values(newManga)
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

            const result = await mariadb(`INSERT INTO manga (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)

            if (header !== "-" && header) downloadImage(header, "header", slug, "manga")

            LogAddManga({
                process_type: 'add-manga',
                username: username,
                manga_id: result.insertId
            })

            sendDiscordEmbed({
                type: "manga",
                manga_id: result.insertId
            })

            return res.status(200).json({ 'success': 'success' })
        } catch (err) {
            console.log(err)
            res.status(500).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
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

    const updatedManga = {
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
    }

    const keys = Object.keys(updatedManga)
    const values = Object.values(updatedManga)

    try {
        await mariadb(`UPDATE manga SET ${keys.map((key, index) => `${key} = "${values[index]}"`)} WHERE id="${id}"`)

        LogUpdateManga({
            process_type: 'update-manga',
            username: username,
            manga_id: id
        })

        return res.status(200).json({ 'success': 'success' })
    } catch (err) {
        res.status(404).json({ 'err': 'Güncellemede bir sorun oluştu.' })
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
        manga = await mariadb(`SELECT name, slug FROM manga WHERE id="${id}"`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    try {
        await mariadb(`DELETE FROM manga WHERE id=${id}`)
        //Mangayla bağlantılı resimleri diskte varsa sil.
        try {
            await deleteImage(manga[0].slug, "manga", "header")
        } catch (err) {
            console.log(err)
        }
        try {
            await deleteImage(manga[0].slug, "manga", "logo")
        } catch (err) {
            console.log(err)
        }
        try {
            await deleteImage(manga[0].slug, "manga", "cover")
        } catch (err) {
            console.log(err)
        }

        LogDeleteManga({
            process_type: 'delete-manga',
            username: username,
            manga_name: manga[0].name
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
        mangas = await mariadb("SELECT slug, name, synopsis, genres, cover_art FROM manga ORDER BY name")
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
    let username, user_id, mangas
    try {
        const check_res = await check_permission(req.headers.authorization, "see-admin-page")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }
    try {
        mangas = await mariadb("SELECT * FROM manga ORDER BY name")
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
    try {
        const manga = await mariadb(`SELECT * FROM manga WHERE slug='${req.params.slug}'`)
        const episodes = await mariadb(`SELECT * FROM manga_episode WHERE manga_id=${manga[0].id}`)
        if (!manga[0]) {
            return res.status(404).json({ 'err': 'Görüntülemek istediğiniz mangayı bulamadık.' });
        } else {
            manga[0].episodes = episodes || []
            res.json({ ...manga[0] });
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
    let manga

    try {
        manga = await mariadb(`
        SELECT 
        name, 
        slug, 
        id, 
        synopsis, 
        translators, 
        editors, 
        authors, 
        genres, 
        cover_art, 
        mal_link, 
        reader_link, 
        release_date, 
        download_link, 
        trans_status, 
        series_status, 
        (SELECT name FROM user WHERE id=manga.created_by) as created_by,
        (SELECT COUNT(*) FROM manga_episode WHERE manga_id=manga.id) as episode_count
        FROM manga 
        WHERE slug="${req.params.slug}"`)
        if (!manga[0]) {
            return res.status(404).json({ 'err': 'Görüntülemek istediğiniz mangayı bulamadık.' });
        } else {
            res.json({ ...manga[0] });
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }
})

module.exports = router;
