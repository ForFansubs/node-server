const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const is_perm = require('../../validation/is_perm')
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
    const a = "àáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ♭°·/_,:;'"
    const b = "aaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzhf0------'"
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(p, c =>
            b.charAt(a.indexOf(c)))     // Replace special chars
        .replace(/&/g, '-and-')         // Replace & with 'and'
        /* .replace(/[^\w\-]+/g, '')       // Remove all non-word chars */
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '')             // Trim - from end of text
}

router.get('/', (req, res) => {
    const response = {
        author: 'aybertocarlos',
        contact: 'aybertocarlos@gmail.com',
        version: '2.1.0.0',
        status: 'OK',
    }
    res.status(200).json(response)
})

// @route   GET api/logs
// @desc    View logs (perm: "see-logs")
// @access  Private
router.get('/logs', (req, res) => {
    is_perm(req.headers.authorization, "see-logs").then(({ is_perm }) => {
        if (is_perm) {
            mariadb.query(`SELECT user, process_type, text, process, created_time, id FROM log ORDER BY id DESC`)
                .then(logs => {
                    res.status(200).json(logs)
                })
                .catch(err => {
                    res.status(400).json({ 'err': 'Kayıtları alırken bir sorun oluştu.' })
                })
            return false
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    })
})

// @route   GET api/en-son-konular
// @desc    Get latest animes
// @access  Public
router.get('/en-son-konular', (req, res) => {
    mariadb.query(`SELECT id, slug, name, synopsis, cover_art, genres, version FROM anime ORDER BY id DESC LIMIT 16`)
        .then(
            animes => mariadb.query(`SELECT ep.*, an.cover_art, an.name as anime_name, an.id as anime_id, an.version as anime_version, an.slug as anime_slug FROM episode as ep INNER JOIN anime as an on ep.anime_id = an.id WHERE ep.special_type!='toplu' ORDER BY ep.id DESC LIMIT 18`)
                .then(episodes => mariadb.query(`SELECT id, slug, name, synopsis, cover_art, genres FROM manga ORDER BY created_time DESC LIMIT 16`).then(mangas => {
                    const data = {
                        animes,
                        mangas,
                        episodes
                    }
                    res.status(200).json(data)
                })
                )
        )
})

// @route   GET api/latest-batch-episodes
// @desc    Get latest batch links
// @access  Public
router.get('/latest-batch-episodes', (req, res) => {
    mariadb.query(`SELECT id, episode_number, anime_id, (SELECT name FROM anime WHERE id=episode.anime_id) as anime_name, (SELECT slug FROM anime WHERE id=episode.anime_id) as anime_slug FROM episode WHERE episode_number="0" ORDER BY created_time DESC LIMIT 6`)
        .then(episodes => res.status(200).json(episodes))
})

// @route   GET api/latest-works
// @desc    Get latest animes
// @access  Public
router.get('/latest-works', (req, res) => {
    mariadb.query(`SELECT id, slug, name, synopsis, cover_art, genres, (SELECT name FROM user WHERE id=anime.created_by) as created_by, created_time, version FROM anime ORDER BY id DESC LIMIT 8`)
        .then(
            animes => mariadb.query(`SELECT ep.*, (SELECT name FROM user WHERE id=ep.created_by) as created_by, an.cover_art, an.name as anime_name, an.id as anime_id, an.version as anime_version, an.slug as anime_slug FROM episode as ep INNER JOIN anime as an on ep.anime_id = an.id WHERE ep.special_type!='toplu' ORDER BY ep.id DESC LIMIT 18`)
                .then(episodes => mariadb.query(`SELECT id, slug, name, synopsis, cover_art, (SELECT name FROM user WHERE id=manga.created_by) as created_by, created_time, genres FROM manga ORDER BY created_time DESC LIMIT 8`).then(mangas => {
                    const data = {
                        animes,
                        mangas,
                        episodes
                    }
                    res.status(200).json(data)
                })
                )
        )
        .catch(_ => res.status(404).json({ err: "err" }))
})

// @route   GET api/featured-anime
// @desc    Get featured-anime
// @access  Public
router.get('/featured-anime', (req, res) => {
    mariadb.query("SELECT `pv`, `name`, `synopsis`, `id`, `slug`, `premiered`, `genres` FROM anime WHERE is_featured = 1")
        .then(anime => res.status(200).json(anime))
})

// @route   POST api/ta-konu-getir
// @desc    Get anime synopsis from TA
// @access  Public
router.post('/ta-konu-getir', (req, res) => {
    //TürkAnime'ye GET isteği at.
    axios.get('http://www.turkanime.tv/anime/' + slugify(req.body.name))
        .then(resp => {
            //Gelen HTML datayı JSDOM'da kontrol edilebilir hale dönüştür.
            const dom = new JSDOM(resp.data)
            //#animedetay id'li div var mı kontrol et.
            if (dom.window.document.querySelector("#animedetay") !== null) {
                //Eğer varsa #animedetay -> ozet classlı divin içindeki yazıları al. Ön tarafa yolla.
                res.status(200).json({ 'konu': dom.window.document.querySelector("#animedetay").querySelector(".ozet").textContent, 'ta_link': `http://www.turkanime.tv/anime/${slugify(req.body.name)}` })
            }
            //#animedetay id'li div yoksa hata yok. (Genelde slug yanlış olduğu için 404 dönütü alınıyor.)
            else {
                res.status(404).json({ 'data': 'Konu TürkAnimede bulunamadı' })
            }
        })
        //Eğer isteği yollarken hata oluştuysa, ön tarafa hata yolla.
        .catch(err => {
            console.log(err)
            res.status(404).json({ 'data': 'Konu TürkAnimede bulunamadı' })
        })
})

// @route   GET api/ta-konu-getir
// @desc    Get anime header
// @access  Public
router.get('/header-getir/:link', (req, res) => {
    axios.get('https://kitsu.io/api/edge/anime?filter[slug]=' + req.params.link)
        .then(resp => {
            if (resp.data.data[0] && resp.data.data[0].attributes.coverImage.original)
                res.status(200).json({ header: resp.data.data[0].attributes.coverImage.original })
            else res.status(404)
        })
        .catch(err => {
            console.log(err)
            res.status(404)
        })
})

// @route   GET api/mos-konu-getir
// @desc    Get manga synopsis from MOS
// @access  Public
router.get('/mos-konu-getir/:name', (req, res) => {
    axios.get('https://puzzmos.com/manga/' + slugify(req.params.name))
        .then(resp => {
            const dom = new JSDOM(resp.data)
            if (dom.window.document.querySelector("#blog-page").querySelector(".col-md-9").querySelector("p") !== null) {
                res.status(200).json({ 'konu': dom.window.document.querySelector("#blog-page").querySelector(".col-md-9").querySelector("p").textContent, 'mos_link': 'https://puzzmos.com/manga/' + slugify(req.params.name) })
            }
            else {
                res.status(404).json({ 'data': 'Konu MOŞ\'da bulunamadı' })
            }
        })
        .catch(err => {
            res.status(404).json({ 'data': 'Konu MOŞ\'da bulunamadı' })
        })
})

// @route   GET api/genre-list
// @desc    Get genre-list
// @access  Public
router.get('/genre-list', (req, res) => {
    const list = ['Aksiyon', 'Arabalar', 'Askeri', 'Bilim Kurgu', 'Büyü', 'Çocuklar', 'Doğaüstü', 'Dram', 'Dövüş Sanatları', 'Fantastik', 'Gerilim', 'Gizem', 'Günlük Yaşam', 'Kişilik Bölünmesi', 'Komedi', 'Korku', 'Macera', 'Müzik', 'Okul', 'Oyun', 'Parodi', 'Polis', 'Psikolojik', 'Romantizm', 'Samuray', 'Sporlar', 'Süper Güçler', 'Şeytanlar', 'Tarihi', 'Uzay', 'Vampir']

    res.status(200).json({ list })
})

module.exports = router;