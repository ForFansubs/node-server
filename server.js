require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const path = require('path')

const app = express()

// Define Routes
const index = require('./routes/api/index')
const anime = require('./routes/api/anime')
const manga = require('./routes/api/manga')
const episode = require('./routes/api/episode')
const user = require('./routes/api/user')
const images = require('./routes/api/images')
const administrative = require('./routes/api/administrative')
const permission = require('./routes/api/permission')
const opgAnime = require('./routes/opg/anime')
const opgManga = require('./routes/opg/manga')
const activateUser = require('./routes/kayit-tamamla/index')

// Pre-render middleware
if (process.env.USE_NEW_SEO_METHOD === "true") {
    const redis = require("redis")
    const prerender = require('prerender-node')
    const redisClient = redis.createClient({ port: process.env.REDIS_PORT || 6379 })
    const cacheableStatusCodes = { 200: true, 302: true, 404: true };

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

// Use Routes
///ADSENSE STUFF
app.get('/ads.txt', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'config', 'ads.txt'))
})
///Robots.txt
app.get('/robots.txt', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'config', 'robots.txt'))
})
///ACTUAL API
app.use('/api/', index)
app.use('/api/anime', anime)
app.use('/api/manga', manga)
app.use('/api/bolum', episode)
app.use('/api/kullanici', user)
app.use('/api/yetki', permission)
app.use('/api/resimler', images)
app.use('/api/sistem', administrative)
app.use('/opg/anime', opgAnime)
app.use('/opg/manga', opgManga)
app.use('/kayit-tamamla', activateUser)

app.use('/admin', express.static(__dirname + '/admin/'));
app.use(express.static(__dirname + '/client/'));
app.get('/admin/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'admin', 'index.html'))
})
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'))
})

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Port ${port} üzerinden istekler bekleniyor...`));