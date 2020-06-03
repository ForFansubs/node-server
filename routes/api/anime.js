const express = require('express')
const router = express.Router()
const check_permission = require('../../validation/check_permission')
const validateAnimeInput = require('../../validation/anime')
const sendDiscordEmbed = require('../../methods/discord_embed')
const downloadImage = require('../../methods/download_image')
const renameImage = require('../../methods/rename_image')
const deleteImage = require('../../methods/delete_image')
const mariadb = require('../../config/maria')
const slugify = require('../../methods/slugify').generalSlugify
const genre_map = require("../../config/maps/genremap")
const season_map = require("../../config/maps/seasonmap")
const status_map = require("../../config/maps/statusmap")
const error_messages = require("../../config/error_messages")

const { LogAddAnime, LogUpdateAnime, LogDeleteAnime, LogFeaturedAnime } = require("../../methods/database_logs")

String.prototype.mapReplace = function (map) {
    var regex = [];
    for (var key in map)
        regex.push(key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
    return this.replace(new RegExp(regex.join('|'), "g"), function (word) {
        return map[word];
    });
};

//Anime ekleme ekranında bölümlerin toplu açılması istenmişse, bu fonksiyon çalışır.
const internalBulkEpisodeAdd = (user_id, anime_id, translators, encoders, origin, episode_count) => {
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
        anime = await mariadb(`SELECT name FROM anime WHERE name="${req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}" AND version="${req.body.version}"`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    //Eğer varsa öne hata yolla.
    if (anime[0]) return res.status(400).json({ 'err': 'Bu anime zaten ekli.' })

    //Gelen datayı kontrol et
    const {
        errors,
        isValid
    } = validateAnimeInput(req.body);

    // Kontrole bak. Eğer hata varsa öne yolla.
    if (!isValid) {
        return res.status(400).json(errors);
    }

    //Yoksa değerleri variable'lara eşitle.
    const { header, cover_art, logo, translators, encoders, studios, version, trans_status, pv } = req.body
    const name = req.body.name.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
    const synopsis = req.body.synopsis.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")

    //Slug'ı yukardaki fonksiyonla oluştur.
    const slug = version === 'bd' ? slugify(name) + "-bd" : slugify(name)

    //Release date için default bir değer oluştur, eğer MAL'dan data alındıysa onunla değiştir
    let release_date = new Date(1)
    if (req.body.release_date) release_date = req.body.release_date

    //Mal linkinin id'sini al, tekrardan buildle
    let mal_link_id = req.body.mal_link.split("/")[4]
    mal_link = `https://myanimelist.net/anime/${mal_link_id}`

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

    //Yeni animenin objectini oluştur
    const newAnime = {
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
    }
    //Sütunları ve değerleri belirle.
    const keys = Object.keys(newAnime)
    const values = Object.values(newAnime)
    //Database'e yolla.
    try {
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
        const result = await mariadb(`INSERT INTO anime (${keys.join(', ')}) VALUES (${values.map(value => `"${value}"`).join(',')})`)
        //Eğer ön taraftan bölümlerin eklenmesi de istenmişse ekle.
        if (req.body.getEpisodes && req.body.episode_count !== 0) {
            internalBulkEpisodeAdd(user_id, result.insertId, req.body.translators, req.body.encoders, req.headers.host, req.body.episode_count)
        }

        LogAddAnime({
            process_type: 'add-anime',
            username: username,
            anime_id: result.insertId
        })

        //Discord Webhook isteği yolla.
        sendDiscordEmbed({
            type: "anime",
            anime_id: result.insertId
        })

        return res.status(200).json({ 'success': 'success' })
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
        anime = await mariadb(`SELECT * FROM anime WHERE id="${id}"`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    //Önden gelen dataları variablelara kaydet.
    const { name, header, cover_art, logo, release_date, mal_link, premiered, translators, encoders, genres, studios, episode_count, series_status, version, trans_status, pv } = req.body
    let { slug } = req.body

    //Konudaki özel karakterleri Javascripte uygun dönüştür.
    const synopsis = req.body.synopsis.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")

    //Eğer içeriğin türü değiştiyse, slug'ı ona göre değiştir.
    if (slug === anime[0].slug && version !== anime[0].version) {
        slug = version === "bd" ? `${slug}-bd` : `${slug.replace('-bd', '')}`
        try {
            await renameImage(anime[0].slug, slug, "anime")
        } catch (err) {
            console.log(err)
        }
    }

    //Cover_art'ı diske indir
    try {
        await downloadImage(cover_art, "cover", slug, "anime")
    } catch (err) {
        return res.status(500).json({ "err": "Coverart güncellenirken bir sorun oluştu." })
    }

    //Eğer logo inputuna "-" konulmuşsa, diskteki logoyu sil
    if (logo === "-") {
        try {
            await deleteImage(slug, "anime", "logo")
        } catch (err) {
            return res.status(500).json({ "err": "Logo silinirken bir sorun oluştu." })
        }
    }

    //Eğer logo linki verilmişse al ve diske kaydet
    if (logo && logo !== "-") {
        try {
            await downloadImage(logo, "logo", slug, "anime")
        } catch (err) {
            return res.status(500).json({ "err": "Coverart güncellenirken bir sorun oluştu." })
        }
    }

    //Eğer header inputuna "-" konulmuşsa, diskteki resmi sil
    if (header === "-") {
        deleteImage(slug, "anime", "header")
    }

    //Eğer bir header linki gelmişse, bu resmi indirip diskteki resmi değiştir
    if (header && header !== "-") {
        downloadImage(header, "header", slug, "anime")
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
        version,
        series_status,
        trans_status,
        pv
    }
    const keys = Object.keys(updatedAnime)
    const values = Object.values(updatedAnime)
    //Database'teki satırı güncelle.
    try {
        await mariadb(`UPDATE anime SET ${keys.map((key, index) => `${key} = "${values[index]}"`)} WHERE id="${id}"`)
        LogUpdateAnime({
            process_type: 'update-anime',
            username: username,
            anime_id: id
        })
        res.status(200).json({ 'success': 'success' })
    } catch (err) {
        res.status(500).json({ 'err': 'Güncellemede bir sorun oluştu.' })
    }
})

// @route   GET api/anime/anime-sil
// @desc    Delete anime (perm: "delete-anime")
// @access  Private
router.post('/anime-sil/', async (req, res) => {
    let anime
    const { id } = req.body

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "delete-anime")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }
    try {
        anime = await mariadb(`SELECT name, slug FROM anime WHERE id=${id}`)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    try {
        await Promise.all([mariadb(`DELETE FROM anime WHERE id=${id}`), mariadb(`DELETE FROM episode WHERE anime_id=${id}`), mariadb(`DELETE FROM download_link WHERE anime_id=${id}`), mariadb(`DELETE FROM watch_link WHERE anime_id=${id}`)])
        //Animeyle bağlantılı resimleri diskte varsa sil.
        try {
            await deleteImage(anime[0].slug, "anime", "header")
        } catch (err) {
            console.log(err)
        }
        try {
            await deleteImage(anime[0].slug, "anime", "logo")
        } catch (err) {
            console.log(err)
        }
        try {
            await deleteImage(anime[0].slug, "anime", "cover")
        } catch (err) {
            console.log(err)
        }
        LogDeleteAnime({
            process_type: 'delete-anime',
            username: username,
            anime_name: anime[0].name
        })
        res.status(200).json({ 'success': 'success' })
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

    let username, user_id
    try {
        const check_res = await check_permission(req.headers.authorization, "featured-anime")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        mariadb(`UPDATE anime SET is_featured = "0" WHERE is_featured="1"`)
    } catch (err) {
        return res.status(500).json({ 'err': error_messages.database_error })
    }

    try {
        await mariadb(`UPDATE anime SET is_featured = 1 WHERE (name, version) IN(${data.map(({ name, version }) => `("${name}", "${version}")`)})`)
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
    let username, user_id, anime
    try {
        const check_res = await check_permission(req.headers.authorization, "see-admin-page")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }
    try {
        const anime = await mariadb("SELECT * FROM anime WHERE is_featured=1")
        res.status(200).json(anime)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: error_messages.database_error })
    }
})

// @route   GET api/anime/liste
// @desc    Get all animes
// @access  Public
router.get('/liste', async (req, res) => {
    let animes
    try {
        animes = await mariadb("SELECT slug, name, version, synopsis, genres, premiered, cover_art FROM anime ORDER BY name")
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
    let username, user_id, animes
    try {
        const check_res = await check_permission(req.headers.authorization, "see-admin-page")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        animes = await mariadb("SELECT * FROM anime ORDER BY name")
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
    let username, user_id, anime, episodes
    try {
        const check_res = await check_permission(req.headers.authorization, "update-anime")
        username = check_res.username
        user_id = check_res.user_id
    } catch (err) {
        return res.status(403).json({ 'err': err })
    }

    try {
        anime = await mariadb(`
        SELECT *
        FROM anime WHERE slug="${req.params.slug}"`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: error_messages.database_error })
    }

    if (!anime[0]) {
        return res.status(404).json({ 'err': 'Görüntülemek istediğiniz animeyi bulamadık.' });
    } else {
        //Anime bulunduysa bölümlerini çek.
        try {
            episodes = await mariadb(`SELECT * FROM episode WHERE anime_id="${anime[0].id}" ORDER BY special_type, ABS(episode_number)`)
            anime[0].episodes = episodes
            res.status(200).json({ ...anime[0] })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ err: error_messages.database_error })
        }
    }

})

// @route   GET api/anime/:slug
// @desc    View anime
// @access  Public
router.get('/:slug', async (req, res) => {
    let anime, episodes
    try {
        anime = await mariadb(`SELECT name, slug, id, version, synopsis, translators, encoders, studios, genres, cover_art, mal_link, episode_count, release_date, premiered, trans_status, series_status, (SELECT name FROM user WHERE id=anime.created_by) as created_by FROM anime WHERE slug="${req.params.slug}"`)
    } catch (err) {
        console.log(err)
        return res.status(500).json({ err: error_messages.database_error })
    }
    //Eğer anime yoksa hata yolla.
    if (!anime[0]) {
        return res.status(404).json({ 'err': 'Görüntülemek istediğiniz animeyi bulamadık.' });
    } else {
        //Anime bulunduysa bölümlerini çek.
        try {
            episodes = await mariadb(`SELECT * FROM episode WHERE anime_id="${anime[0].id}" AND seen_download_page="1" ORDER BY special_type, ABS(episode_number)`)
            anime[0].episodes = episodes
            res.status(200).json({ ...anime[0] })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ err: error_messages.database_error })
        }
    }
})

module.exports = router;
