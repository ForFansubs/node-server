const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const check_permission = require('../../validation/check_permission')
const sendDiscordEmbed = require('../../methods/discord_embed')
const downloadImage = require('../../methods/download_image')
const deleteImage = require('../../methods/delete_image')
const log_success = require('../../methods/log_success')
const log_fail = require('../../methods/log_fail')
const jsdom = require("jsdom");
const mariadb = require('../../config/maria')
const axios = require("axios")
const slugify = require('../../methods/slugify').generalSlugify
const genre_map = require("../../config/maps/genremap")
const error_messages = require("../../config/error_messages")
jsdom.defaultDocumentFeatures = {
    FetchExternalResources: ['script'],
    ProcessExternalResources: ['script'],
    MutationEvents: '2.0',
    QuerySelector: false
};
const { JSDOM } = jsdom;

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
        manga = await mariadb(`SELECT name FROM manga WHERE name="${req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}"`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    if (manga[0]) res.status(400).json({ 'err': 'Bu manga zaten ekli.' })
    else {
        const { translators, editors, authors, header } = req.body
        const synopsis = req.body.synopsis.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
        const name = req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
        let release_date = new Date(1)
        if (req.body.release_date) release_date = req.body.release_date
        const cover_art = req.body.cover_art
        let mal_link = req.body.mal_link.split("?")[0]
        mal_link = mal_link.split("/").pop().join("")
        const download_link = req.body.download_link
        const mos_link = req.body.mos_link
        const slug = slugify(name)
        const genreList = []
        genresS = genresS.mapReplace(genre_map)
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
        try {
            const result = await mariadb(`INSERT INTO manga (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)
            log_success('add-manga', username, result.insertId)
            if (header !== "-" && header) downloadImage(header, "header", slug, "manga")
            res.status(200).json({ 'success': 'success' })
            sendDiscordEmbed('manga', result.insertId, req.headers.origin)
        } catch (err) {
            log_fail('add-manga', username)
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

    const { name, cover_art, download_link, mos_link, release_date, slug, translators, editors, genres, authors, header, mal_link } = req.body
    const synopsis = req.body.synopsis.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
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

    try {
        await mariadb(`UPDATE manga SET ${keys.map((key, index) => `${key} = "${values[index]}"`)} WHERE id="${id}"`)
        res.status(200).json({ 'success': 'success' })
        log_success('update-manga', username, id)
    } catch (err) {
        log_fail('update-manga', username, id)
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
        res.status(200).json({ 'success': 'success' })
        deleteImage(manga[0].slug, "manga")
        log_success('delete-manga', username, '', manga[0].name)
    } catch (err) {
        console.log(err)
        res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
        log_fail('delete-manga', username, id)
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

// @route   GET api/manga/:slug
// @desc    View manga
// @access  Public
router.get('/:slug', async (req, res) => {
    let manga

    try {
        manga = await mariadb(`SELECT name, slug, id, synopsis, translators, editors, authors, genres, cover_art, mal_link, mos_link, release_date, download_link, trans_status, series_status, airing, (SELECT name FROM user WHERE id=manga.created_by) as created_by FROM manga WHERE slug='${req.params.slug}'`)
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
