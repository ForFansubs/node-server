const express = require('express')
const router = express.Router()
const mariadb = require('../config/maria')
const isBot = require('isbot')
const querylist = require('../config/query-list')
const episodeinfoparser = require('../config/episode-info-parser')

router.get('/anime/:animeid/:animeslug', (req, res) => {
    if (isBot(req.headers['user-agent'])) {
        mariadb.query(querylist.animeinfoget(req.params.animeid)).then(anime => {
            res.status(200).send(`
                    <html lang="tr">
                        <head>
                            <title>${anime[0].name} - PuzzleSubs Anime</title>
                                <meta name="description" content="${anime[0].name} PuzzleSubs Türkçe Anime İzle İndir" />
                                <meta name="twitter:site" content="https://puzzlesubs.com/ceviriler/anime/${anime[0].id}/${anime[0].slug}" />
                                <meta name="twitter:creator" content="${anime[0].created_by}" />
                                <meta name="twitter:card" content="${anime[0].synopsis} PuzzleSubs Türkçe Anime İzle İndir" />
                                <meta name="twitter:title" content="${anime[0].name}" />
                                <meta name="twitter:description" content="${anime[0].synopsis}" />
                                <meta name="twitter:image" content="${anime[0].cover_art}" />
                                <meta property="og:type" content="website" />
                                <meta property="og:site_name" content="PuzzleSubs" />
                                <meta name="og:url" content="https://puzzlesubs.com/ceviriler/anime/${anime[0].id}/${anime[0].slug}" />
                                <meta property="og:title" content="${anime[0].name}" />
                                <meta property="og:description" content="${anime[0].synopsis} PuzzleSubs Türkçe Anime İzle İndir" />
                                <meta property="og:image" content="${anime[0].cover_art}" />
                        </head>
                        <body>
                        </body>
                    </html>`)
        }).catch(_ => res.status(404).json({ err: "err" }))
    }
    else res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'))
})

router.get('/manga/:mangaid/:mangaslug', (req, res) => {
    if (isBot(req.headers['user-agent']))
        mariadb.query(querylist.mangainfoget(mangaid)).then(manga => {
            res.status(200).send(`
            <html lang="tr">
                <head>
                    <title>${manga[0].manga_name} - PuzzleSubs Manga</title>
                    <meta name="description" content="${manga[0].name} PuzzleSubs Türkçe Manga Oku İndir" />
                    <meta name="twitter:site" content="https://puzzlesubs.com/ceviriler/manga/${manga[0].id}/${manga[0].slug}" />
                        <meta name="twitter:creator" content="${manga[0].created_by}" />
                        <meta name="twitter:card" content="${manga[0].name} PuzzleSubs Türkçe Manga Oku İndir" />
                        <meta name="twitter:title" content="${manga[0].name}" />
                        <meta name="twitter:description" content="${manga[0].name} PuzzleSubs Türkçe Manga Oku İndir" />
                        <meta name="twitter:image" content="${manga[0].cover_art}" />
                        <meta property="og:type" content="website" />
                        <meta property="og:site_name" content="PuzzleSubs" />
                        <meta name="twitter:site" content="https://puzzlesubs.com/ceviriler/manga/${manga[0].id}/${manga[0].slug}" />
                        <meta property="og:title" content="${manga[0].name}" />
                        <meta property="og:description" content="${manga[0].manga_name} PuzzleSubs Türkçe Manga Oku İndir" />
                        <meta property="og:image" content="${manga[0].cover_art}" />
                </head>
                <body>
                </body>
            </html>`);
        })
            .catch(_ => res.status(404))
    else res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'))
})

router.get('/anime/:animeid/:animeslug/izle', (req, res) => {
    if (isBot(req.headers['user-agent']))
        mariadb.query(querylist.animeinfoget(animeid)).then(anime => {
            res.status(200).send(`
        <html lang="tr">
            <head>
                <title>${anime[0].anime_name} - PuzzleSubs Anime İzle</title>
                <meta name="twitter:site" content="https://puzzlesubs.com/ceviriler/anime/${anime[0].id}/${anime[0].slug}/izle/" />
                <meta name="twitter:creator" content="${anime[0].created_by}" />
                <meta name="twitter:card" content="${anime[0].anime_name} PuzzleSubs Türkçe Anime İzle" />
                <meta name="twitter:title" content="${anime[0].anime_name}" />
                <meta name="twitter:description" content="${anime[0].anime_name} PuzzleSubs Türkçe Anime İzle" />
                <meta name="twitter:image" content="${anime[0].cover_art}" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="PuzzleSubs" />
                <meta name="twitter:site" content="https://puzzlesubs.com/ceviriler/anime/${anime[0].id}/${anime[0].slug}/izle/" />
                <meta property="og:title" content="${anime[0].anime_name}" />
                <meta property="og:description" content="${anime[0].anime_name} PuzzleSubs Türkçe Anime İzle" />
                <meta property="og:image" content="${anime[0].cover_art}" />
            </head>
            <body>
            </body>
        </html>`);
        })
            .catch(_ => res.status(404))
    else res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'))
})

router.get('/anime/:animeid/:animeslug/izle/:epInfo', (req, res) => {
    if (isBot(req.headers['user-agent'])) {
        const episodeid = parseInt(epinfo.split('-')[1])
        mariadb.query(querylist.episodeinfoget(animeid, episodeid)).then(anime => {
            const info = episodeinfoparser(anime[0].anime_name, anime[0].episode_number, anime[0].special_type)
            res.status(200).send(`
            <html lang="tr">
                <head>
                    <title>${info.text} - PuzzleSubs Anime İzle</title>
                    <meta name="twitter:site" content="https://puzzlesubs.com/ceviriler/anime/${anime[0].id}/${anime[0].slug}/izle/${info.slug}" />
                    <meta name="twitter:creator" content="${anime[0].created_by}" />
                    <meta name="twitter:card" content="${info.text} PuzzleSubs Türkçe Anime İzle" />
                    <meta name="twitter:title" content="${info.text}" />
                    <meta name="twitter:description" content="${info.text} PuzzleSubs Türkçe Anime İzle" />
                    <meta name="twitter:image" content="${anime[0].cover_art}" />
                    <meta property="og:type" content="website" />
                    <meta property="og:site_name" content="PuzzleSubs" />
                    <meta name="twitter:site" content="https://puzzlesubs.com/ceviriler/anime/${anime[0].id}/${anime[0].slug}/izle/${info.slug}" />
                    <meta property="og:title" content="${info.text}" />
                    <meta property="og:description" content="${info.text} PuzzleSubs Türkçe Anime İzle" />
                    <meta property="og:image" content="${anime[0].cover_art}" />
                </head>
                <body>
                </body>
            </html>`);
        })
            .catch(_ => res.status(404))
    }
    else res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'))
})

module.exports = router