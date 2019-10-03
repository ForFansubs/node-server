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
//const ceviriler = require('./config/ceviriler')

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
//TODO: Bot special page too experimental
//app.use('/ceviriler/', ceviriler)

app.use('/admin', express.static(__dirname + '/admin/'));
app.use(express.static(__dirname + '/client/'));
app.get('/admin/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'admin', 'index.html'))
})
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'))
})

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));