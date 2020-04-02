const express = require('express')
const router = express.Router()
const is_perm = require('../../validation/is_perm')
const log_success = require('../../methods/log_success')
const log_fail = require('../../methods/log_fail')
const downloadLinkExtract = require('../../methods/link-extraction-download')
const watchLinkExtract = require('../../methods/link-extraction-watch')
const sendDiscordEmbed = require('../../methods/discord_embed')
const jsdom = require("jsdom");
const mariadb = require('../../config/maria')
const Validator = require('validator')
const axios = require("axios")
jsdom.defaultDocumentFeatures = {
    FetchExternalResources: ['script'],
    ProcessExternalResources: ['script'],
    MutationEvents: '2.0',
    QuerySelector: false
};
const { JSDOM } = jsdom;

const stringify = text => {
    return text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
}

const internalAddWatchLink = (link, anime_id, episode_number, created_by_id) => {
    const extract = watchLinkExtract(link)
    if (!extract && extract.src.match("www.turkanime.tv")) return
    mariadb.query(`SELECT link FROM watch_link WHERE link='${extract.src}'`)
        .then(anime => {
            let linkList = {}
            if (anime[0]) return
            else {
                mariadb.query(`SELECT id FROM episode WHERE special_type="" AND episode_number="${episode_number}" AND anime_id="${anime_id}"`).then(episode => {
                    const newWatchLink = {
                        anime_id,
                        episode_id: episode[0].id,
                        type: extract.type,
                        link: extract.src,
                        created_by: created_by_id
                    }
                    const keys = Object.keys(newWatchLink)
                    const values = Object.values(newWatchLink)
                    mariadb.query(`INSERT INTO watch_link (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)
                        .catch(err => {
                            console.log(err)
                        })
                })
            }
        })
}

// @route   GET api/episode/watch
// @desc    View episodes
// @access  Public
router.get('/:slug/watch', (req, res) => {
    const { slug } = req.params

    mariadb.query(`SELECT *, (SELECT name FROM anime WHERE id=episode.anime_id) as anime_name, (SELECT slug FROM anime WHERE id=episode.anime_id) as anime_slug, (SELECT cover_art FROM anime WHERE id=episode.anime_id) as cover_art FROM episode WHERE anime_id=(SELECT id FROM anime WHERE slug="${slug}") AND special_type!='toplu' ORDER BY special_type, ABS(episode_number)`)
        .then(eps => {
            res.status(200).json(eps)
        })
        .catch(_ => res.status(400).json({ 'err': 'İzleme sayfa bilgileri alınırken bir şeyler yanlış gitti.' }));
})

// @route   GET api/episode/watch-links/
// @desc    View watch links
// @access  Public
router.post('/izleme-linkleri', (req, res) => {
    const { slug } = req.body
    let [special_type, episode_number] = req.body.episode_data.split('-')

    special_type === "bolum" ? special_type = "" : null

    mariadb.query(`SELECT link, type, id FROM watch_link WHERE episode_id=(SELECT id FROM episode WHERE anime_id=(SELECT id FROM anime WHERE slug="${slug}") AND special_type='${special_type}' AND episode_number='${episode_number}') ORDER BY type`)
        .then(eps => {
            res.status(200).json(eps)
        })
        .catch(err => {
            console.log(err)
            res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
        });
})

// @route   GET api/episode/watch-links/admin-view
// @desc    View watch links
// @access  Public
router.post('/izleme-linkleri/admin-view', (req, res) => {
    is_perm(req.headers.authorization, "delete-watch-link").then(({ is_perm }) => {
        if (is_perm) {
            mariadb.query(`SELECT * FROM watch_link WHERE episode_id="${req.body.episode_id}" ORDER BY type`)
                .then(eps => {
                    res.status(200).json(eps)
                })
                .catch(err => {
                    console.log(err)
                    res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
                })
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/episode/watch-links/admin-view
// @desc    View watch links
// @access  Public
router.post('/indirme-linkleri/admin-view', (req, res) => {
    is_perm(req.headers.authorization, "delete-download-link").then(({ is_perm }) => {
        if (is_perm) {
            mariadb.query(`SELECT * FROM download_link WHERE episode_id="${req.body.episode_id}" ORDER BY type`)
                .then(eps => {
                    res.status(200).json(eps)
                })
                .catch(err => {
                    console.log(err)
                    res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
                })
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/episode/bolum-ekle
// @desc    Add episode (perm: "add-episode")
// @access  Private
router.post('/bolum-ekle', (req, res) => {
    is_perm(req.headers.authorization, "add-episode").then(({ is_perm, username, user_id }) => {
        if (is_perm) {
            mariadb.query(`SELECT episode_number, anime_id FROM episode WHERE episode_number='${req.body.episode_number}' AND anime_id='${req.body.anime_id}' AND special_type='${req.body.special_type}'`)
                .then(anime => {
                    if (anime[0]) res.status(400).json({ 'err': 'Bu bölüm zaten ekli.' })
                    else {
                        const { anime_id, credits, special_type } = req.body
                        req.body.episode_number ? episode_number = req.body.episode_number : episode_number = null
                        if (!req.body.episode_number && special_type === '') res.status(400).json({ 'err': 'Bölüm numarası veya tür seçmelisiniz.' })
                        let newEpisode
                        if (episode_number) {
                            newEpisode = {
                                anime_id,
                                episode_number,
                                credits,
                                created_by: user_id,
                                special_type
                            }
                        }
                        else {
                            newEpisode = {
                                anime_id,
                                credits,
                                created_by: user_id,
                                special_type
                            }
                        }
                        const keys = Object.keys(newEpisode)
                        const values = Object.values(newEpisode)
                        mariadb.query(`INSERT INTO episode (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)
                            .then(result => {
                                log_success('add-episode', username, result.insertId)
                                res.status(200).json({ 'success': 'success' })
                                sendDiscordEmbed('episode', anime_id, credits, special_type, episode_number, result.insertId, req.headers.origin)
                            })
                            .catch(err => {
                                res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
                                log_fail('add-episode', username, req.body.anime_id, req.body.episode_number, req.body.special_type)

                            })
                    }
                })
                .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }))
            return false
        }
        else {
            log_fail('add-episode', username, req.body.anime_id, req.body.episode_number, req.body.special_type)
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/episode/bolum-duzenle
// @desc    Update episode (perm: "update-episode")
// @access  Private
router.post('/bolum-duzenle', (req, res) => {
    is_perm(req.headers.authorization, "update-episode").then(({ is_perm, username }) => {
        if (is_perm) {
            switch (req.body.request) {
                case "update-visibility":
                    mariadb.query(`UPDATE episode SET seen_download_page="${req.body.value}" WHERE id=${req.body.id}`).then(_ => {
                        res.status(200).json({ 'success': 'success' })
                        log_success('update-episode', username, req.body.id, req.body.value)
                    }).catch(_ => res.status(500).json({ 'err': 'Bir şeyler yanlış gitti.' }))
                    break
                case "update-data":
                    const { credits, id } = req.body

                    const data = {
                        credits: credits
                    }

                    const keys = Object.keys(data)
                    const values = Object.values(data)

                    mariadb.query(`UPDATE episode SET ${keys.map((key, index) => `${key} = "${values[index]}"`)} WHERE id="${id}"`).then(_ => {
                        res.status(200).json({ 'success': 'success' })
                        log_success('update-episode', username, req.body.id, req.body.value)
                    }).catch(_ => res.status(500).json({ 'err': 'Bir şeyler yanlış gitti.' }))
                    break
                default:
                    res.status(500).json({ 'err': 'İşlem türü belirtmediniz!' })
                    break
            }
        }
        else {
            log_fail('update-episode', username, req.body.id)
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/episode/bolum-sil
// @desc    Delete episode (perm: "delete-episode")
// @access  Private
router.post('/bolum-sil', (req, res) => {
    const { episode_id } = req.body
    is_perm(req.headers.authorization, "delete-episode").then(({ is_perm, username }) => {
        if (is_perm) {
            mariadb.query(`SELECT * FROM episode WHERE id=${episode_id}`).then(episode => {
                mariadb.query(`DELETE FROM episode WHERE id=${episode_id}`)
                    .then(_ => {
                        res.status(200).json({ 'success': 'success' })
                        mariadb.query(`DELETE FROM download_link WHERE episode_id=${episode_id}`)
                        mariadb.query(`DELETE FROM watch_link WHERE episode_id=${episode_id}`)
                        log_success('delete-episode', username, episode[0].anime_id, episode[0].episode_number, episode[0].special_type)
                    })
                    .catch(_ => {
                        res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
                        log_fail('delete-episode', username, episode[0].anime_id, episode[0].episode_number, episode[0].special_type)
                    })
                    .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }))
                return false
            })
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})


// @route   POST api/episode/indirme-linki-ekle
// @desc    Yeni bölüm indirme linki ekle (perm: "add-download-link")
// @access  Private
router.post('/indirme-linki-ekle', (req, res) => {
    is_perm(req.headers.authorization, "add-download-link").then(({ is_perm, username, user_id }) => {
        if (is_perm) {
            const extract = downloadLinkExtract(req.body.link)
            if (!extract) return res.status(400).json({ 'err': 'Link tanımlanamadı.' })
            mariadb.query(`SELECT link FROM download_link WHERE link='${extract.link}'`)
                .then(anime => {
                    if (anime[0]) res.status(400).json({ 'err': 'Bu link zaten ekli.' })
                    else {
                        const { anime_id, episode_id, resolution } = req.body
                        if (!Validator.isURL(extract.link)) return res.status(400).json({ 'err': 'Link doğru değil' })
                        const newDownloadLink = {
                            anime_id,
                            episode_id,
                            type: extract.type,
                            resolution,
                            link: extract.link,
                            created_by: user_id
                        }
                        const keys = Object.keys(newDownloadLink)
                        const values = Object.values(newDownloadLink)
                        mariadb.query(`INSERT INTO download_link (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)
                            .then(result => {
                                log_success('add-download-link', username, result.insertId)
                                res.status(200).json({ 'success': 'success' })
                            })
                            .catch(_ => {
                                res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
                                log_fail('add-download-link', username, req.body.episode_id, extract.type)
                            })
                    }
                })
                .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }))
            return false
        }
        else {
            log_fail('add-download-link', username, req.body.episode_id, downloadLinkExtract(req.body.link))
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET /episode/indirme-linki-sil/:id/:episodeid/:downloadlink
// @desc    İndirme linki sil (perm: "delete-download-link")
// @access  Private
router.post('/indirme-linki-sil', (req, res) => {
    const { episode_id, downloadlink_id } = req.body

    is_perm(req.headers.authorization, "delete-download-link").then(({ is_perm, username }) => {
        if (is_perm) {
            mariadb.query(`SELECT type FROM download_link WHERE id='${downloadlink_id}'`)
                .then(downloadlink => {
                    mariadb.query(`DELETE FROM download_link WHERE id=${downloadlink_id}`)
                        .then(_ => {
                            res.status(200).json({ 'success': 'success' })
                            log_success('delete-download-link', username, episode_id, downloadlink[0].type)
                        })
                        .catch(_ => {
                            res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
                            log_fail('delete-download-link', username, episode_id, downloadlink_id)
                        })
                })
                .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }))
            return false
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
            log_fail('delete-download-link', username, episode_id, downloadlink_id)
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   POST api/episode/izleme-linki-ekle
// @desc    Yeni bölüm indirme linki ekle (perm: "add-watch-link")
// @access  Private
router.post('/izleme-linki-ekle', (req, res) => {
    is_perm(req.headers.authorization, "add-watch-link").then(({ is_perm, username, user_id }) => {
        if (is_perm) {
            const { anime_id, episode_id, link } = req.body
            const extract = watchLinkExtract(link)
            if (!extract) return res.status(400).json({ 'err': 'Link tanımlanamadı.' })
            mariadb.query(`SELECT link FROM watch_link WHERE link='${extract.src}'`)
                .then(anime => {
                    if (anime[0]) res.status(400).json({ 'err': 'Bu link zaten ekli.' })
                    else {
                        const newWatchLink = {
                            anime_id,
                            episode_id,
                            type: extract.type,
                            link: extract.src,
                            created_by: user_id
                        }
                        const keys = Object.keys(newWatchLink)
                        const values = Object.values(newWatchLink)
                        mariadb.query(`INSERT INTO watch_link (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)
                            .then(result => {
                                res.status(200).json({ 'success': 'success' })
                                log_success('add-watch-link', username, result.insertId)
                            })
                            .catch(err => {
                                console.log(err)
                                log_fail('add-watch-link', username, req.body.episode_id, extract.type)
                            })
                    }
                })
                .catch(err => {
                    console.log(err)
                    res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
                })
            return false
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
            log_fail('add-watch-link', username, req.body.episode_id, watchLinkExtract(req.body.link).type)
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET /episode/izleme-linki-sil/:id/:episodeid:/:downloadlink
// @desc    İzleme linki sil (perm: "delete-watch-link")
// @access  Private
router.post('/izleme-linki-sil', (req, res) => {
    const { episode_id, watchlink_id } = req.body
    is_perm(req.headers.authorization, "delete-watch-link").then(({ is_perm, username }) => {
        if (is_perm) {
            mariadb.query(`SELECT type FROM watch_link WHERE id='${watchlink_id}'`)
                .then(watchlink => {
                    mariadb.query(`DELETE FROM watch_link WHERE id=${watchlink_id}`)
                        .then(_ => {
                            res.status(200).json({ 'success': 'success' })
                            log_success('delete-watch-link', username, episode_id, watchlink[0].type)
                        })
                        .catch(_ => {
                            log_fail('delete-watch-link', username, episode_id, watchlink_id)
                        })
                })
            return false
        }
        else {
            log_fail('delete-watch-link', username, episode_id, watchlink_id)
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   POST api/episode/download-link-list
// @desc    İndirme linkleri listesi
// @access  Private
router.get('/download-link-list', (req, res) => {
    is_perm(req.headers.authorization, "add-download-link").then(({ is_perm }) => {
        if (is_perm) {
            const list = ['mega.nz', 'yadi.sk', 'mail.ru', 'userscloud', 'pcloud', '1drv.ms', 'onedrive.live', 'stream.moe', 'drive.google.com', 'mediafire.com', 'ddl.to', 'https://oload.life', 'https://download.ru/']
            res.status(200).json({ list })
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   POST api/episode/watch-link-list
// @desc    İzleme linkleri listesi
// @access  Private
router.get('/watch-link-list', (req, res) => {
    is_perm(req.headers.authorization, "add-watch-link").then(({ is_perm }) => {
        if (is_perm) {
            const list = ['vk.com', 'tune.pk', 'sendvid.com', 'oload.life', 'video.sibnet.ru', 'drive.google.com', 'ok.ru', 'dailymotion.com', 'my.mail.ru', 'mega.nz', 'myvi.ru', 'mp4upload.com', 'cloudvideo.tv', 'hdvid.tv', 'rapidvideo.com', 'rapidvid.to', 'streamango.com', 'userscloud.com', 'yourupload.com', 'www.fembed.com', 'youtu.be', 'youtube', 'rutube.ru', 'vidfast.co', 'vidia.tv', 'vidsat.net', 'supervideo.tv', 'clipwatching.com', 'jetload.net', 'fastplay.to', 'mystream.to', 'streamwire.net']
            res.status(200).json({ list })
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/episode/:id/:animeid
// @desc    View episodes
// @access  Public
router.get('/info/:animeid', (req, res) => {
    mariadb.query(`SELECT * FROM episode WHERE anime_id='${req.params.animeid}' ORDER BY special_type, ABS(episode_number)`)
        .then(eps => {
            res.status(200).json(eps)
        })
        .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }));
})

// @route   GET api/episode/download-links/:animeslug
// @desc    View download links
// @access  Public
router.post('/download-links/:animeslug', (req, res) => {
    mariadb.query(`SELECT link, type, resolution, id FROM download_link WHERE anime_id=(SELECT id FROM anime WHERE slug='${req.params.animeslug}') AND episode_id='${req.body.episode_id}' ORDER BY type`)
        .then(eps => {
            res.status(200).json(eps)
        })
        .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }));
})

module.exports = router;