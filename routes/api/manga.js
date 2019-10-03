const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const is_perm = require('../../validation/is_perm')
const sendDiscordEmbed = require('../../config/discord_embed')
const downloadImage = require('../../config/download_image')
const deleteImage = require('../../config/delete_image')
const log_success = require('../../config/log_success')
const log_fail = require('../../config/log_fail')
const jsdom = require("jsdom");
const mariadb = require('../../config/maria')
const axios = require("axios")
jsdom.defaultDocumentFeatures = {
    FetchExternalResources: ['script'],
    ProcessExternalResources: ['script'],
    MutationEvents: '2.0',
    QuerySelector: false
};
const { JSDOM } = jsdom;

const slugify = text => {
    const a = 'àáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ♭·/_,:;'
    const b = 'aaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzhf------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(p, c =>
            b.charAt(a.indexOf(c)))     // Replace special chars
        .replace(/&/g, '-and-')         // Replace & with 'and'
        .replace(/[^\w\-]+/g, '')      // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '')             // Trim - from end of text
}

// @route   GET api/manga/manga-ekle
// @desc    Add manga (perm: "add-manga")
// @access  Private
router.post('/manga-ekle', (req, res) => {
    is_perm(req.headers.authorization, "add-manga").then(({ is_perm, username, user_id }) => {
        if (is_perm) {
            mariadb.query(`SELECT name FROM manga WHERE name="${req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}"`)
                .then(manga => {
                    if (manga[0]) res.status(400).json({ 'err': 'Bu manga zaten ekli.' })
                    else {
                        const { translators, editors, authors, header } = req.body
                        const synopsis = req.body.synopsis.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
                        const name = req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
                        let release_date = new Date(1)
                        if (req.body.release_date) release_date = req.body.release_date
                        const cover_art = req.body.cover_art
                        const mal_link = req.body.mal_link.split("?")[0]
                        const download_link = req.body.download_link
                        const mos_link = req.body.mos_link
                        const slug = slugify(name)
                        const genreList = []
                        //Önden alınan stringi Array haline getir
                        genresS = req.body.genres.split(',')
                        //Here we gooooooooooooooooooo!!!! (Türleri İngilizce'den Türkçe'ye çevir.)
                        genresS.forEach(geName => {
                            geName = geName.replace(/Action/, 'Aksiyon').replace(/Adventure/, 'Macera').replace(/Cars/, 'Arabalar')
                                .replace(/Comedy/, 'Komedi').replace(/Dementia/, 'Kişilik Bölünmesi').replace(/Demons/, 'Şeytanlar')
                                .replace(/Drama/, 'Dram').replace(/Fantasy/, 'Fantastik').replace(/Game/, 'Oyun').replace(/Historical/, 'Tarihi')
                                .replace(/Horror/, 'Korku').replace(/Kids/, 'Çocuklar').replace(/Magic/, 'Büyü').replace(/Martial Arts/, 'Dövüş Sanatları')
                                .replace(/Military/, 'Askeri').replace(/Music/, 'Müzik').replace(/Mystery/, 'Gizem').replace(/Parody/, 'Parodi')
                                .replace(/Police/, 'Polis').replace(/Psychological/, 'Psikolojik').replace(/Romance/, 'Romantizm').replace(/Samurai/, 'Samuray')
                                .replace(/School/, 'Okul').replace(/Sci-Fi/, 'Bilim Kurgu').replace(/Slice of Life/, 'Günlük Yaşam').replace(/Space/, 'Uzay')
                                .replace(/Sports/, 'Sporlar').replace(/Super Power/, 'Süper Güçler').replace(/Supernatural/, 'Doğaüstü').replace(/Thriller/, 'Gerilim')
                                .replace(/Vampire/, 'Vampir')
                            genreList.push(geName)
                        })
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
                            mos_link,
                            genres: genreList.join(','),
                        }
                        const keys = Object.keys(newManga)
                        const values = Object.values(newManga)
                        mariadb.query(`INSERT INTO manga (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)
                            .then(result => {
                                log_success('add-manga', username, result.insertId)
                                if (header !== "-" && header) downloadImage(header, "header", slug, "manga")
                                res.status(200).json({ 'success': 'success' })
                                sendDiscordEmbed('manga', result.insertId, req.headers.origin)
                            })
                            .catch(err => {
                                log_fail('add-manga', username)
                                console.log(err)
                                res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
                            })
                    }
                })
            return false
        }
        else {
            log_fail('add-manga', username)
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    })
})

// @route   POST api/manga/manga-guncelle
// @desc    Update manga (perm: "update-manga")
// @access  Private
router.post('/manga-guncelle', (req, res) => {
    const { id } = req.body

    is_perm(req.headers.authorization, "update-anime").then(({ is_perm, username }) => {
        if (is_perm) {
            const { release_date, slug, translators, editors, genres, authors, header } = req.body
            const mal_link = req.body.mal_link.split("?")[0]
            const synopsis = req.body.synopsis.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
            const name = req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
            const cover_art = req.body.cover_art.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
            const download_link = req.body.download_link.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
            const mos_link = req.body.mos_link.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
            if (header !== "-" && header) downloadImage(header, "header", slug, "manga")
            if (header === "-") deleteImage(slug, "anime")
            const updatedManga = {
                synopsis,
                name,
                slug,
                translators,
                editors,
                authors,
                cover_art,
                mal_link,
                download_link,
                mos_link,
                release_date: new Date(release_date).toISOString().slice(0, 19).replace('T', ' '),
                genres
            }
            const keys = Object.keys(updatedManga)
            const values = Object.values(updatedManga)
            mariadb.query(`UPDATE manga SET ${keys.map((key, index) => `${key} = "${values[index]}"`)} WHERE id="${id}"`)
                .then(_ => {
                    res.status(200).json({ 'success': 'success' })
                    log_success('update-manga', username, id)
                })
                .catch(_ => {
                    log_fail('update-manga', username, id)
                    res.status(404).json({ 'err': 'Güncellemede bir sorun oluştu.' })
                })
            return false
        }
        else {
            log_fail('update-manga', username, id)
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    })
})

// @route   GET api/manga/delete-manga
// @desc    Delete manga (perm: "delete-manga")
// @access  Private
router.post('/manga-sil/', (req, res) => {
    const { id } = req.body
    is_perm(req.headers.authorization, "update-anime").then(({ is_perm, username }) => {
        if (is_perm) {
            mariadb.query(`SELECT name, slug FROM manga WHERE id="${id}"`).then(manga => {
                mariadb.query(`DELETE FROM manga WHERE id=${id}`)
                    .then(_ => {
                        res.status(200).json({ 'success': 'success' })
                        deleteImage(manga[0].slug, "manga")
                        log_success('delete-manga', username, '', manga[0].name)
                    })
                    .catch(err => {
                        console.log(err)
                        res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
                        log_fail('delete-manga', username, id)
                    })
            })
            return false
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
            log_fail('delete-manga', username, id)
        }
    })
})

// @route   GET api/manga/arama-liste
// @desc    Get latest mangas
// @access  Private
router.get('/arama-liste/:page?', (req, res) => {
    if (!req.query.text) {
        mariadb.query(`SELECT id, slug, name, synopsis, cover_art, genres, authors FROM manga ORDER BY name LIMIT ${req.params.page * 12},12`)
            .then(mangas => {
                const mangaList = mangas.map(manga => {
                    manga.genres = manga.genres.split(',')
                    manga.authors = manga.authors.split(',')
                    return manga
                })
                res.status(200).json(mangaList)
            })
    }
    else {
        mariadb.query(`SELECT id, slug, name, synopsis, cover_art, genres, authors FROM manga WHERE name LIKE "%${req.query.text}%" ORDER BY name`)
            .then(mangas => {
                const mangaList = mangas.map(manga => {
                    manga.genres = manga.genres.split(',')
                    manga.authors = manga.authors.split(',')
                    return manga
                })
                res.status(200).json(mangaList)
            })
    }
})

// @route   GET api/manga/liste
// @desc    Get all mangas
// @access  Private
router.get('/liste', (req, res) => {
    mariadb.query("SELECT slug, name, synopsis, genres, cover_art FROM manga ORDER BY name")
        .then(mangas => {
            const mangaList = mangas.map(manga => {
                manga.genres = manga.genres.split(',')
                return manga
            })
            res.status(200).json(mangaList)
        })
})

// @route   GET api/manga/liste
// @desc    Get all mangas
// @access  Private
router.get('/admin-liste', (req, res) => {
    is_perm(req.headers.authorization, "see-admin-page").then(({ is_perm }) => {
        if (is_perm) {
            mariadb.query("SELECT * FROM manga ORDER BY name")
                .then(mangas => {
                    const mangaList = mangas.map(manga => {
                        manga.genres = manga.genres.split(',')
                        return manga
                    })
                    res.status(200).json(mangaList)
                })
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/manga/:id/:mangaid
// @desc    View manga
// @access  Private
router.get('/:slug', (req, res) => {
    /* if (!req.params.id) {
        res.status(403).json({ "err": "Giriş yapmanız gerekiyor" })
    } */
    mariadb.query(`SELECT *, (SELECT name FROM user WHERE id=manga.created_by) as created_by FROM manga WHERE slug='${req.params.slug}'`).then(manga => {
        if (!manga[0]) {
            return res.status(404).json({ 'err': 'Görüntülemek istediğiniz mangayı bulamadık.' });
        } else {
            res.json({ ...manga[0] });
            /* mariadb.query(`INSERT INTO view_count (id, count) VALUES ('${manga[0].slug + '-' + req.params.mangaid}',1) ON DUPLICATE KEY UPDATE count = count + 1`) */
        }
    })
})

module.exports = router;
