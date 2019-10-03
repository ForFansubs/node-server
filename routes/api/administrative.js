const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const is_perm = require('../../validation/is_perm')
const mariadb = require('../../config/maria')
const downloadImage = require('../../config/download_image')
const { deleteCache } = require('../../config/cloudflare_api')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const axios = require('axios')

/* router.get('/get-dump', (req, res) => {
    dump().then(result => res.status(200).json(result))
}) */

// @route   GET api/administrative/force-header-update
// @desc    Force update header images
// @access  Public
router.get('/force-header-update', (req, res) => {
    is_perm(req.headers.authorization, "see-administrative-stuff").then(({ is_perm }) => {
        if (is_perm) {
            res.status(200).json({ "ok": "ok" })
            fs.readdir(path.resolve(__dirname, '../../images/anime'), (err, files) => {
                const lenght = Object.keys(files).length
                files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
                for (let i = 0; i < lenght; i++) {
                    const fileName = files[i]
                    if (fileName) {
                        const filePath = path.resolve(__dirname, '../../images/anime', fileName)
                        fs.unlinkSync(filePath)
                    }
                }
                mariadb.query(`SELECT slug FROM anime`).then(animes => {
                    const lenght = Object.keys(animes).length
                    for (let i = 0; i < lenght; i++) {
                        const slug = animes[i].slug
                        setTimeout(() => {
                            axios.get('https://wallhaven.now.sh/search?keyword=' + slug)
                                .then(resp => {
                                    for (const image of resp.data.images) {
                                        if (image.width >= 1920 && image.width > image.height) {
                                            axios.get('https://wallhaven.now.sh/details/' + image.id).then(resp => {
                                                downloadImage(resp.data.fullImage, "header", slug, "anime")
                                            }).catch(_ => console.log(slug + " alırken bir sorun oluştu."))
                                            break;
                                        }
                                    }
                                })
                                .catch(_ => console.log(slug + " alırken bir sorun oluştu."))
                        }, 3000 * i, slug)
                    }
                })
            });
            fs.readdir(path.resolve(__dirname, '../../images/manga'), (err, files) => {
                const lenght = Object.keys(files).length
                files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
                for (let k = 0; k < lenght; k++) {
                    const fileName = files[k]
                    if (fileName) {
                        const filePath = path.resolve(__dirname, '../../images/manga', fileName)
                        fs.unlinkSync(filePath)
                    }
                }
                mariadb.query(`SELECT slug FROM manga`).then(mangas => {
                    const lenght = Object.keys(mangas).length
                    for (let i = 0; i < lenght; i++) {
                        const slug = mangas[i].slug
                        setTimeout(() => {
                            axios.get('https://wallhaven.now.sh/search?keyword=' + slug)
                                .then(resp => {
                                    for (const image of resp.data.images) {
                                        if (image.width >= 1920 && image.width > image.height) {
                                            axios.get('https://wallhaven.now.sh/details/' + image.id).then(resp => {
                                                downloadImage(resp.data.fullImage, "header", slug, "manga")
                                            }).catch(_ => console.log(slug + " alırken bir sorun oluştu."))
                                            break;
                                        }
                                    }
                                })
                                .catch(_ => console.log(slug + " alırken bir sorun oluştu."))
                        }, 3000 * i, slug)
                    }
                })
            });
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/administrative/force-anime-header-update
// @desc    Force update header images
// @access  Public
router.get('/force-anime-header-update', (req, res) => {
    is_perm(req.headers.authorization, "see-administrative-stuff").then(({ is_perm }) => {
        if (is_perm) {
            res.status(200).json({ "ok": "ok" })
            fs.readdir(path.resolve(__dirname, '../../images/anime'), (err, files) => {
                files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
                const lenght = Object.keys(files).length
                for (let i = 0; i < lenght; i++) {
                    const fileName = files[i]
                    if (fileName) {
                        const filePath = path.resolve(__dirname, '../../images/anime', fileName)
                        fs.unlinkSync(filePath)
                    }
                }
                mariadb.query(`SELECT slug FROM anime`).then(animes => {
                    const lenght = Object.keys(animes).length
                    for (let i = 0; i < lenght; i++) {
                        const slug = animes[i].slug
                        setTimeout(() => {
                            axios.get('https://wallhaven.now.sh/search?keyword=' + slug)
                                .then(resp => {
                                    for (const image of resp.data.images) {
                                        if (image.width >= 1920 && image.width > image.height) {
                                            axios.get('https://wallhaven.now.sh/details/' + image.id).then(resp => {
                                                downloadImage(resp.data.fullImage, "header", slug, "anime")
                                            }).catch(_ => console.log(slug + " alırken bir sorun oluştu."))
                                            break;
                                        }
                                    }
                                })
                                .catch(_ => console.log(slug + " alırken bir sorun oluştu."))
                        }, 3000 * i, slug)
                    }
                })
            });
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/administrative/force-manga-header-update
// @desc    Force update header images
// @access  Public
router.get('/force-manga-header-update', (req, res) => {
    is_perm(req.headers.authorization, "see-administrative-stuff").then(({ is_perm }) => {
        if (is_perm) {
            res.status(200).json({ "ok": "ok" })
            fs.readdir(path.resolve(__dirname, '../../images/manga'), (err, files) => {
                const lenght = Object.keys(files).length
                files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
                for (let i = 0; i < lenght; i++) {
                    const fileName = files[i]
                    if (fileName) {
                        const filePath = path.resolve(__dirname, '../../images/manga', fileName)
                        fs.unlinkSync(filePath)
                    }
                }
                mariadb.query(`SELECT slug FROM manga`).then(mangas => {
                    const lenght = Object.keys(mangas).length
                    for (let i = 0; i < lenght; i++) {
                        const slug = mangas[i].slug
                        setTimeout(() => {
                            axios.get('https://wallhaven.now.sh/search?keyword=' + slug)
                                .then(resp => {
                                    for (const image of resp.data.images) {
                                        if (image.width >= 1920 && image.width > image.height) {
                                            axios.get('https://wallhaven.now.sh/details/' + image.id).then(resp => {
                                                downloadImage(resp.data.fullImage, "header", slug, "manga")
                                            }).catch(_ => console.log(slug + " alırken bir sorun oluştu."))
                                            break;
                                        }
                                    }
                                })
                                .catch(_ => console.log(slug + " alırken bir sorun oluştu."))
                        }, 3000 * i, slug)
                    }
                })
            });
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/administrative/force-cover_art-update
// @desc    Force update cover_art images
// @access  Public
router.get('/force-cover_art-update', (req, res) => {
    is_perm(req.headers.authorization, "see-administrative-stuff").then(({ is_perm }) => {
        if (is_perm) {
            res.status(200).json({ "ok": "ok" })
            mariadb.query(`SELECT id, mal_link, name FROM anime`).then(animes => {
                const animeLenght = Object.keys(animes).length
                animes.forEach((anime, i) => {
                    const animeMALID = anime.mal_link.split('/')[4]
                    const animeID = anime.id
                    const animeNAME = anime.name
                    setTimeout(() => {
                        axios.get('https://api.jikan.moe/v3/anime/' + animeMALID).then(res => {
                            mariadb.query(`UPDATE anime SET cover_art="${res.data.image_url}" WHERE id="${animeID}"`)
                            console.log(animeNAME + " animesinin cover artı güncelleniyor.")
                        })
                    }, 3000 * i)
                })
                mariadb.query(`SELECT id, mal_link, name FROM manga`).then(mangas => {
                    mangas.forEach((manga, k) => {
                        const mangaMALID = manga.mal_link.split('/')[4]
                        const mangaID = manga.id
                        const mangaNAME = manga.name
                        setTimeout(() => {
                            axios.get('https://api.jikan.moe/v3/manga/' + mangaMALID).then(res => {
                                mariadb.query(`UPDATE manga SET cover_art="${res.data.image_url}" WHERE id="${mangaID}"`)
                                console.log(mangaNAME + " mangasının cover artı güncelleniyor.")
                            })
                        }, 3000 * (k + animeLenght))
                    })
                })
            })
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/administrative/force-cover_art-update
// @desc    Force update cover_art images
// @access  Public
router.get('/force-anime-cover_art-update', (req, res) => {
    is_perm(req.headers.authorization, "see-administrative-stuff").then(({ is_perm }) => {
        if (is_perm) {
            res.status(200).json({ "ok": "ok" })
            mariadb.query(`SELECT id, mal_link, name FROM anime`).then(animes => {
                animes.forEach((anime, i) => {
                    const animeMALID = anime.mal_link.split('/')[4]
                    const animeID = anime.id
                    const animeNAME = anime.name
                    setTimeout(() => {
                        axios.get('https://api.jikan.moe/v3/anime/' + animeMALID).then(res => {
                            mariadb.query(`UPDATE anime SET cover_art="${res.data.image_url}" WHERE id="${animeID}"`)
                            console.log(animeNAME + " animesinin cover artı güncelleniyor.")
                        })
                    }, 3000 * i)
                })
            })
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/administrative/force-cover_art-update
// @desc    Force update cover_art images
// @access  Public
router.get('/force-manga-cover_art-update', (req, res) => {
    is_perm(req.headers.authorization, "see-administrative-stuff").then(({ is_perm }) => {
        if (is_perm) {
            res.status(200).json({ "ok": "ok" })
            mariadb.query(`SELECT id, mal_link, name FROM manga`).then(mangas => {
                mangas.forEach((manga, k) => {
                    const mangaMALID = manga.mal_link.split('/')[4]
                    const mangaID = manga.id
                    const mangaNAME = manga.name
                    setTimeout(() => {
                        axios.get('https://api.jikan.moe/v3/manga/' + mangaMALID).then(res => {
                            mariadb.query(`UPDATE manga SET cover_art="${res.data.image_url}" WHERE id="${mangaID}"`)
                            console.log(mangaNAME + " mangasının cover artı güncelleniyor.")
                        })
                    }, 3000 * k)
                })
            })
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/administrative/force-header-optimize
// @desc    Optimize header images
// @access  Public
router.get('/force-header-optimize', (req, res) => {
    is_perm(req.headers.authorization, "see-administrative-stuff").then(({ is_perm }) => {
        if (is_perm) {
            fs.readdir(path.resolve(__dirname, '../../images/anime'), (err, files) => {
                const lenght = Object.keys(files).length
                for (let i = 0; i < lenght; i++) {
                    const fileName = files[i]
                    const filePath = path.resolve(__dirname, '../../images/anime', fileName)
                    setTimeout(() => {
                        const file = fs.readFileSync(filePath)
                        fs.unlinkSync(filePath)
                        sharp(file).resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(filePath)
                    }, 1000 * i, fileName)
                }
            });
            fs.readdir(path.resolve(__dirname, '../../images/manga'), (err, files) => {
                const lenght = Object.keys(files).length
                for (let i = 0; i < lenght; i++) {
                    const fileName = files[i]
                    const filePath = path.resolve(__dirname, '../../images/manga', fileName)
                    setTimeout(() => {
                        const file = fs.readFileSync(filePath)
                        fs.unlinkSync(filePath)
                        sharp(file).resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(filePath)
                    }, 1000 * i, fileName)
                }
            });
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/administrative/force-restart
// @desc    Force restart
// @access  Public
router.get('/force-restart', (req, res) => {
    is_perm(req.headers.authorization, "see-administrative-stuff").then(({ is_perm }) => {
        if (is_perm) {
            process.exit(1);
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/administrative/force-cf-cache-purge
// @desc    Force CF cache purge
// @access  Public
router.get('/force-cf-cache-purge', (req, res) => {
    is_perm(req.headers.authorization, "see-administrative-stuff").then(({ is_perm }) => {
        if (is_perm) {
            deleteCache(res)
        }
        else {
            res.status(403).json({ 'err': 'Bu yetkiyi kullanamazsınız.' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})


module.exports = router;