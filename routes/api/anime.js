const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const is_perm = require('../../validation/is_perm')
const log_success = require('../../config/log_success')
const log_fail = require('../../config/log_fail')
const validateAnimeInput = require('../../validation/anime')
const sendDiscordEmbed = require('../../config/discord_embed')
const downloadImage = require('../../config/download_image')
const renameImage = require('../../config/rename_image')
const deleteImage = require('../../config/delete_image')
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

//TürkAnime'den konu çekme ve database'e anime eklerken slugını oluşturmak için kullanılan fonksiyon.
//TODO: Bu slug fonksiyonlarını başka bir dosyaya al. 
const slugify = text => {
    const a = "àáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ♭°·/_,:;'"
    const b = "aaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzhf0------'"
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(p, c =>
            b.charAt(a.indexOf(c)))     // Replace special chars
        .replace(/&/g, '-and-')         // Replace & with 'and'
        .replace(/[^\w\-]+/g, '-')      // Remove all non-word chars */
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '')             // Trim - from end of text
}

//Anime ekleme ekranında bölümlerin toplu açılması istenmişse, bu fonksiyon çalışır.
const internalBulkEpisodeAdd = (user_id, mal_link, anime_id, translators, encoders, ta_link, origin, episode_count) => {
    let episodeList = []
    let episodeNumbers = []
    //Bulunan bölümleri döndür.
    for (var episode = 1; episode <= episode_count; episode++) {
        //Emektar yazısını oluştur.
        const credits = `${translators} / ${encoders}`
        //Bölüm objesini oluştur.
        const newEpisode = [
            anime_id, episode, credits, user_id, ''
        ]
        //Objeyi listenin sonuna ekle.
        episodeList.push(newEpisode)
        episodeNumbers.push(episode)
    }
    //İlk parantez içindeki değerler, objelerin içinde sıralı verilerin, databaseteki tablein hangi sütunlarına ekleneceğini belirliyor.
    //İkinci virgül içindekiler de hangi verilerin alınacağını, hangilerinin alınmayacağını belirtiyor.
    mariadb.batch(`INSERT INTO episode (anime_id,episode_number,credits,created_by,special_type) VALUES (?, ?, ?, ?, ?)`, episodeList)
        .then(_ => _)
        .catch(err => console.log(err))
}

// @route   GET api/anime/anime-ekle
// @desc    Add anime (perm: "add-anime")
// @access  Private
router.post('/anime-ekle', (req, res) => {
    //Yetkiyi ve kullanıcıyı kontrol et. Kullanıcının "add-anime" yetkisi var mı bak.
    is_perm(req.headers.authorization, "add-anime").then(({ is_perm, username, user_id }) => {
        if (is_perm) {
            //Eğer varsa anime daha önceden eklenmiş mi diye isimle kontrol et. 
            mariadb.query(`SELECT name FROM anime WHERE name="${req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}" AND version="${req.body.version}"`)
                .then(anime => {
                    //Eğer varsa öne hata yolla.
                    if (anime[0]) res.status(400).json({ 'err': 'Bu anime zaten ekli.' })
                    else {
                        const {
                            errors,
                            isValid
                        } = validateAnimeInput(req.body);

                        // Kontrole bak. Eğer hata varsa öne yolla.
                        if (!isValid) {
                            return res.status(400).json(errors);
                        }
                        //Yoksa değerleri variable'lara eşitle.
                        const { header, cover_art, premiered, translators, encoders, studios, version } = req.body
                        const name = req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
                        const synopsis = req.body.synopsis.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
                        //Slug'ı yukardaki fonksiyonla oluştur.
                        const slug = version === 'bd' ? slugify(name) + "-bd" : slugify(name)
                        const genreList = []
                        let release_date = new Date(1)
                        if (req.body.release_date) release_date = req.body.release_date
                        //MAL linkinden arama değerlerini sil. Örnek => (https://myanimelist.net/anime/32526/Love_Live_Sunshine?q=love%20live)
                        const mal_link = req.body.mal_link.split("?")[0]
                        genresS = req.body.genres.split(',')
                        //Önden alınan stringi Array haline getir
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
                        //Again here we gooooooooooooooooooo!!!! (Sezonları İngilizce'den Türkçe'ye çevir.)
                        let premieredS = ''
                        if (premiered) premieredS = premiered.replace(/Fall/, 'Sonbahar').replace(/Winter/, 'Kış').replace(/Summer/, 'Yaz').replace(/Spring/, 'İlkbahar')
                        let episode_count = 0
                        if (req.body.episode_count) episode_count = req.body.episode_count
                        const newAnime = {
                            synopsis,
                            name,
                            slug,
                            translators,
                            encoders,
                            release_date: new Date(release_date).toISOString().slice(0, 19).replace('T', ' '),
                            created_by: user_id,
                            episode_count,
                            studios,
                            cover_art,
                            mal_link,
                            genres: genreList.join(','),
                            premiered: premieredS,
                            version
                        }
                        //Sütunları ve değerleri belirle.
                        const keys = Object.keys(newAnime)
                        const values = Object.values(newAnime)
                        //Database'e yolla.
                        mariadb.query(`INSERT INTO anime (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)
                            .then(result => {
                                //Başarılı olursa logla.
                                log_success('add-anime', username, result.insertId)

                                try {
                                    if (header !== "-" && header) downloadImage(header, slug, "anime-header")
                                    if (cover_art) downloadImage(cover_art, slug, "anime-header")
                                } catch (err) {
                                    conmsole.log(err)
                                }

                                res.status(200).json({ 'success': 'success' })
                                //Discord Webhook isteği yolla.
                                sendDiscordEmbed('anime', result.insertId, req.headers.origin)
                                //Eğer ön taraftan bölümlerin eklenmesi de istenmişse ekle.
                                if (req.body.getEpisodes && req.body.episode_count !== 0) {
                                    internalBulkEpisodeAdd(user_id, req.body.mal_link, result.insertId, req.body.translators, req.body.encoders, req.body.ta_link, req.headers.host, req.body.episode_count)
                                }
                            })
                            .catch(err => {
                                //Hata varsa logla. Hata ver.
                                console.log(err)
                                log_fail('add-anime', username)
                                res.status(400).json({ 'err': 'Ekleme sırasında bir şeyler yanlış gitti.' })
                            })
                    }
                })
            return false
        }
        else {
            //Eğer yetki yoksa logla. Hata ver.
            log_fail('add-anime', username)
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   POST api/anime/anime-guncelle
// @desc    Update anime (perm: "update-anime")
// @access  Private
router.post('/anime-guncelle', (req, res) => {
    const { id } = req.body
    //Yetkiyi ve kullanıcı kontrol et. "update-anime" yetkisi var mı bak.
    is_perm(req.headers.authorization, "update-anime").then(({ is_perm, username }) => {
        if (is_perm) {
            mariadb.query(`SELECT * FROM anime WHERE id="${id}"`).then(anime => {
                const { name, header, cover_art, release_date, mal_link, premiered, translators, encoders, genres, studios, episode_count } = req.body
                let { slug, version } = req.body
                const synopsis = req.body.synopsis.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
                if (slug === anime[0].slug && version !== anime[0].version) {
                    slug = version === "bd" ? `${slug}-bd` : `${slug.replace('-bd', '')}`
                    renameImage(anime[0].slug, slug, "anime-header")
                    renameImage(anime[0].slug, slug, "anime-cover")
                }
                else {
                    try {
                        if (header !== "-" && header) downloadImage(header, slug, "anime-header")
                        if (header === "-") deleteImage(slug, "anime-header")
                        if (cover_art) downloadImage(cover_art, slug, "anime-cover")
                    } catch (err) {
                        console.log(err)
                    }
                }
                const updatedAnime = {
                    synopsis,
                    name,
                    slug,
                    translators,
                    encoders,
                    studios,
                    cover_art,
                    episode_count,
                    mal_link,
                    release_date: new Date(release_date).toISOString().slice(0, 19).replace('T', ' '),
                    genres,
                    premiered,
                    version
                }
                const keys = Object.keys(updatedAnime)
                const values = Object.values(updatedAnime)
                //Database'teki satırı güncelle.
                mariadb.query(`UPDATE anime SET ${keys.map((key, index) => `${key} = "${values[index]}"`)} WHERE id="${id}"`)
                    .then(_ => {
                        res.status(200).json({ 'success': 'success' })
                        log_success('update-anime', username, id)
                    })
                    .catch(_ => {
                        log_fail('update-anime', username, id)
                        res.status(400).json({ 'err': 'Güncellemede bir sorun oluştu.' })
                    })
                return false
            })
        }
        else {
            log_fail('update-anime', username, id)
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/anime/delete-anime
// @desc    Delete anime (perm: "delete-anime")
// @access  Private
router.post('/anime-sil/', (req, res) => {
    const { id } = req.body
    is_perm(req.headers.authorization, "update-anime").then(({ is_perm, username }) => {
        if (is_perm) {
            mariadb.query(`SELECT name, slug FROM anime WHERE id=${id}`).then(anime => {
                mariadb.query(`DELETE FROM anime WHERE id=${id}`)
                    .then(_ => {
                        res.status(200).json({ 'success': 'success' })
                        mariadb.query(`DELETE FROM episode WHERE anime_id=${id}`)
                        mariadb.query(`DELETE FROM download_link WHERE anime_id=${id}`)
                        mariadb.query(`DELETE FROM watch_link WHERE anime_id=${id}`)
                        deleteImage(anime[0].slug, "anime-header")
                        log_success('delete-anime', username, '', anime[0].name)
                    })
                    .catch(_ => {
                        res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
                        log_fail('delete-anime', username, id)
                    })
                return false
            })
                .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }))
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
            log_fail('delete-anime', username, id)
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   POST api/anime/featured-anime
// @desc    Featured anime (perm: "featured-anime")
// @access  Private
router.post('/update-featured-anime', (req, res) => {
    const { data } = req.body
    is_perm(req.headers.authorization, "featured-anime").then(({ is_perm, username }) => {
        if (is_perm) {
            mariadb.query(`UPDATE anime SET is_featured = "0" WHERE is_featured="1"`)
                .then(_ => {
                    mariadb.query(`UPDATE anime SET is_featured = 1 WHERE (name, version) IN(${data.map(({ name, version }) => `("${name}", "${version}")`)})`)
                        .then(_ => {
                            res.status(200).json({ 'success': 'success' })
                            log_success('featured-anime', username)
                        })
                        .catch(err => {
                            console.log(err)
                            res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' })
                            log_fail('featured-anime', username)
                        })
                })
                .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }))
        }
        else {
            log_fail('featured-anime', username)
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    })
        .catch(err => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/featured-anime
// @desc    Get featured-anime
// @access  Public
router.get('/admin-featured-anime', (req, res) => {
    is_perm(req.headers.authorization, "featured-anime").then(({ is_perm, username }) => {
        if (is_perm) {
            mariadb.query("SELECT * FROM anime WHERE is_featured = 1")
                .then(anime => res.status(200).json(anime))
        }
        else {
            log_fail('featured-anime', username, anime_id)
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    })
        .catch(err => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/anime/liste
// @desc    Get all animes
// @access  Public
router.get('/liste', (req, res) => {
    mariadb.query("SELECT slug, name, version, synopsis, genres, premiered, cover_art FROM anime ORDER BY name")
        .then(animes => {
            const animeList = animes.map(anime => {
                anime.genres = anime.genres.split(',')
                return anime
            })
            res.status(200).json(animeList)
        })
})

// @route   GET api/anime/admin-liste
// @desc    Get all animes with all data
// @access  Public
router.get('/admin-liste', (req, res) => {
    is_perm(req.headers.authorization, "see-admin-page").then(({ is_perm }) => {
        if (is_perm) {
            mariadb.query("SELECT * FROM anime ORDER BY name")
                .then(animes => {
                    res.status(200).json(animes)
                })
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/anime/:id/:animeid
// @desc    View anime
// @access  Private
router.get('/:slug/admin-view', (req, res) => {
    //Kullanıcı giriş yapmadığı zaman konuyu gösterme, hata yolla.
    /* if (!req.params.id) {
        res.status(403).json({ "err": "Giriş yapmanız gerekiyor" })
    } */
    //Gelen istekteki ID'yi kullanarak animeyi çek.
    is_perm(req.headers.authorization, "add-anime").then(({ is_perm }) => {
        if (is_perm) {
            mariadb.query(`SELECT *, (SELECT name FROM user WHERE id=anime.created_by) as created_by FROM anime WHERE slug="${req.params.slug}"`)
                .then(anime => {
                    //Eğer anime yoksa hata yolla.
                    if (!anime[0]) {
                        return res.status(404).json({ 'err': 'Görüntülemek istediğiniz animeyi bulamadık.' });
                    } else {
                        //Anime bulunduysa bölümlerini çek.
                        mariadb.query(`SELECT * FROM episode WHERE anime_id="${anime[0].id}" ORDER BY special_type, ABS(episode_number)`)
                            .then(eps => {
                                anime[0].episodes = eps
                                res.status(200).json({ ...anime[0] });
                                /* mariadb.query(`INSERT INTO view_count (id, count) VALUES ('${anime[0].slug + '-' + req.params.animeid}',1) ON DUPLICATE KEY UPDATE count = count + 1`) */
                            })
                            .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }));
                    }
                })
                .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }));
        }
        else {
            res.status(403).json({ 'err': 'Yetkisiz kullanım!' })
        }
    }).catch(_ => res.status(403).json({ 'err': 'Yetkisiz kullanım!' }))
})

// @route   GET api/anime/:id/:animeid
// @desc    View anime
// @access  Private
router.get('/:slug', (req, res) => {
    //Kullanıcı giriş yapmadığı zaman konuyu gösterme, hata yolla.
    /* if (!req.params.id) {
        res.status(403).json({ "err": "Giriş yapmanız gerekiyor" })
    } */
    //Gelen istekteki ID'yi kullanarak animeyi çek.
    mariadb.query(`SELECT name, slug, id, version, synopsis, translators, encoders, studios, genres, cover_art, mal_link, episode_count, release_date, premiered, (SELECT name FROM user WHERE id=anime.created_by) as created_by FROM anime WHERE slug="${req.params.slug}"`)
        .then(anime => {
            //Eğer anime yoksa hata yolla.
            if (!anime[0]) {
                return res.status(404).json({ 'err': 'Görüntülemek istediğiniz animeyi bulamadık.' });
            } else {
                //Anime bulunduysa bölümlerini çek.
                mariadb.query(`SELECT * FROM episode WHERE anime_id="${anime[0].id}" AND seen_download_page="1" ORDER BY special_type, ABS(episode_number)`)
                    .then(eps => {
                        anime[0].episodes = eps
                        res.status(200).json({ ...anime[0] });
                        /* mariadb.query(`INSERT INTO view_count (id, count) VALUES ('${anime[0].slug + '-' + req.params.animeid}',1) ON DUPLICATE KEY UPDATE count = count + 1`) */
                    })
                    .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }));
            }
        })
        .catch(_ => res.status(400).json({ 'err': 'Bir şeyler yanlış gitti.' }));
})


module.exports = router;
