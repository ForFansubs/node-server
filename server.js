require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const helmet = require('helmet')
const Path = require('path')
const fs = require('fs')
const package = require('./package.json')
const { generateSitemap } = require('./config/sitemap-generator')
const rateLimit = require("express-rate-limit");

const app = express()

// Define Routes
// v3
const index_v3 = require('./routes/api/v3/index')
const anime_v3 = require('./routes/api/v3/anime')
const manga_v3 = require('./routes/api/v3/manga')
const mangaEpisode_v3 = require('./routes/api/v3/manga_episode')
const episode_v3 = require('./routes/api/v3/episode')
const user_v3 = require('./routes/api/v3/user')
const images_v3 = require('./routes/api/v3/images')
const permission_v3 = require('./routes/api/v3/permission')
const motd_v3 = require('./routes/api/v3/motd')
// v4
const index_v4 = require('./routes/api/v4/index')
const anime_v4 = require('./routes/api/v4/anime')
const manga_v4 = require('./routes/api/v4/manga')
const mangaEpisode_v4 = require('./routes/api/v4/manga_episode')
const episode_v4 = require('./routes/api/v4/episode')
const user_v4 = require('./routes/api/v4/user')
const images_v4 = require('./routes/api/v4/images')
const permission_v4 = require('./routes/api/v4/permission')
const motd_v4 = require('./routes/api/v4/motd')

const sequelize = require('./config/sequelize')

// Pre-render middleware
if (process.env.USE_NEW_SEO_METHOD === "true") {
    const redis = require("redis")
    const prerender = require('prerender-node')
    const redisClient = redis.createClient({ ...JSON.parse(process.env.REDIS_OPTIONS) })

    prerender.set('beforeRender', function (req, done) {
        redisClient.get(req.url, done);
    }).set('afterRender', function (err, req, prerender_res) {
        redisClient.set(req.url, prerender_res.body, 'EX', process.env.REDIS_CACHE_TIMEOUT)
    });
    if (process.env.NODE_ENV === "development") {
        app.use(prerender.blacklisted('^/api').set('prerenderServiceUrl', process.env.PRERENDER_SERVICE_URL).set('host', process.env.HOST_URL.replace(/(https:\/\/)|(http:\/\/)/, '')));
    }
    else {
        app.use(prerender.blacklisted('^/api').set('prerenderServiceUrl', process.env.PRERENDER_SERVICE_URL).set('host', process.env.HOST_URL.replace(/(https:\/\/)|(http:\/\/)/, '')).set('protocol', 'https'));
    }
}

// Passport middleware
app.use(passport.initialize())
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, Authorization, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, OPTIONS")
    next()
})

// Passport Config
require('./config/passport')(passport)

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Helmet JS middleware
app.use(helmet())

// Set behind proxy
if (process.env.REVERSE_PROXY) {
    app.set('trust proxy', 1)
}

// Rate-limiter middleware
const CrawlerFileLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 5, // start blocking after 5 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 dakika sonra tekrar deneyin."
});

const IndexRequestsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 60, // start blocking after 60 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 dakika sonra tekrar deneyin."
});

// Use Routes
///ads txt
app.get('/ads.txt', CrawlerFileLimiter, (req, res) => {
    res.sendFile(Path.resolve(__dirname, 'config', 'ads.txt'))
})
///robots.txt
app.get('/robots.txt', CrawlerFileLimiter, (req, res) => {
    res.sendFile(Path.resolve(__dirname, 'config', 'robots.txt'))
})
///sitemap.xml
app.get('/sitemap.xml', CrawlerFileLimiter, (req, res) => {
    res.sendFile(Path.resolve(__dirname, 'config', 'sitemap.xml'))
})
///ACTUAL API
//Fallback old v3
app.use('/api/', index_v3)
app.use('/api/anime', anime_v3)
app.use('/api/manga', manga_v3)
app.use('/api/bolum', episode_v3)
app.use('/api/kullanici', user_v3)
app.use('/api/yetki', permission_v3)
app.use('/api/resimler', images_v3)
app.use('/api/manga-bolum', mangaEpisode_v3)
app.use('/api/motd', motd_v3)
//v4
app.use('/api/v4/', index_v4)
app.use('/api/v4/anime', anime_v4)
app.use('/api/v4/manga', manga_v4)
app.use('/api/v4/bolum', episode_v4)
app.use('/api/v4/kullanici', user_v4)
app.use('/api/v4/yetki', permission_v4)
app.use('/api/v4/resimler', images_v4)
app.use('/api/v4/manga-bolum', mangaEpisode_v4)
app.use('/api/v4/motd', motd_v4)

app.use('/admin', express.static(__dirname + '/admin/'));
app.use(express.static(__dirname + '/client/'));
app.get('/admin/*', IndexRequestsLimiter, (req, res) => {
    res.sendFile(Path.resolve(__dirname, 'admin', 'index.html'))
})
app.get('*', IndexRequestsLimiter, (req, res) => {
    res.sendFile(Path.resolve(__dirname, 'client', 'index.html'))
})

async function initializeServer() {
    if (process.env.NODE_ENV === "production") {
        process.stdout.write('\033c');
    }

    const animeFolder = Path.resolve(__dirname, './images/anime')
    const mangaFolder = Path.resolve(__dirname, './images/manga')
    const mangaEpisodeFolder = Path.resolve(__dirname, './images/manga_episodes')
    const clientFolder = Path.resolve(__dirname, './client')
    const adminFolder = Path.resolve(__dirname, './admin')

    console.log("ℹ️ Dosyalar kontrol ediliyor...")

    if (fs.existsSync(animeFolder))
        console.info('✔️ Anime resim dosyası mevcut.')
    else {
        return console.error(`❌ Anime resim dosyalarını saklamak için gereken dosya bulunamadı. Lütfen ${animeFolder} yolunu oluşturun.`)
    }


    if (fs.existsSync(mangaFolder))
        console.info('✔️ Manga resim dosyası mevcut.')
    else {
        return console.error(`❌ Manga resim dosyalarını saklamak için gereken dosya bulunamadı. Lütfen ${mangaFolder} yolunu oluşturun.`)
    }

    if (fs.existsSync(mangaEpisodeFolder))
        console.info('✔️ Manga bölümleri için dosya mevcut.')
    else {
        return console.error(`❌ Manga bölümlerini saklamak için gereken dosya bulunamadı. Lütfen ${mangaEpisodeFolder} yolunu oluşturun.`)
    }

    if (fs.existsSync(clientFolder))
        console.info('✔️ Client dosyası mevcut.')
    else {
        return console.error(`❌ Kullanıcılara gönderilecek client dosyası bulunamadı. Lütfen ${clientFolder} yolunu oluşturun ve https://forfansubs.github.io/docs/yukleme-talimatlari/ adresindeki talimatları yerine getirdiğinizden emin olun.`)
    }

    if (fs.existsSync(adminFolder))
        console.info('✔️ Admin dosyası mevcut.')
    else {
        return console.error(`❌ Kullanıcılara gönderilecek admin dosyası bulunamadı. Lütfen ${adminFolder} yolunu oluşturun ve https://forfansubs.github.io/docs/yukleme-talimatlari/ adresindeki talimatları yerine getirdiğinizden emin olun.`)
    }

    try {
        await sequelize.authenticate()
        console.info('✔️ Database bağlantısı başarılı.')
    } catch (err) {
        return console.error('❌ Database bağlantısı başarısız oldu:', err)
    }

    try {
        if (process.env.NODE_APP_INSTANCE == 0 || process.env.NODE_APP_INSTANCE === undefined) {
            await generateSitemap()
            setInterval(async () => {
                await generateSitemap()
            }, 86400000)
        }
    } catch (err) {
        console.log(err)
    }

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.info('\x1b[32m%s\x1b[0m', "----------------INFO----------------")
        console.info(`ℹ️ NODE_ENV:`, "\x1b[33m", `            ${process.env.NODE_ENV}`)
        console.info(`ℹ️ Service Name:`, "\x1b[33m", `        ${process.env.SITE_NAME}`)
        console.info(`ℹ️ URL:`, "\x1b[33m", `                 ${process.env.HOST_URL}`)
        console.info(`ℹ️ Port:`, "\x1b[33m", `                ${process.env.PORT}`)
        console.info(`ℹ️ Database:`, "\x1b[33m", `            ${process.env.DB_NAME}`)
        if (process.env.NODE_APP_INSTANCE !== undefined) {
            console.info(`ℹ️ PM2 Cluster ID:`, "\x1b[33m", `      ${process.env.NODE_APP_INSTANCE == 0 ? `${process.env.NODE_APP_INSTANCE} (master)` : process.env.NODE_APP_INSTANCE}`)
        }
        console.info('\x1b[32m%s\x1b[0m', "---------------AUTHOR---------------")
        console.info(`ℹ️ Service Author:`, "\x1b[35m", `      ${package.author}`)
        console.info(`ℹ️ Service Version:`, "\x1b[35m", `     ${package.version}`)
        console.info(`ℹ️ Service Release Name:`, "\x1b[35m", `${package["release-name"]}`)
        console.info('\x1b[32m%s\x1b[0m', "------------------------------------")
    });
}

initializeServer()