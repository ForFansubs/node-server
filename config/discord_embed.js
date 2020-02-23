const mariadb = require('./maria')
const axios = require('axios')

const episodeId = process.env.DISCORD_EPISODE_WH
const animeId = process.env.DISCORD_ANIME_WH
const mangaId = process.env.DISCORD_MANGA_WH
const logoLink = `${process.env.HOST_URL}/logo.png`

const sendDiscordEmbed = (type, prop1, prop2, prop3, prop4, prop5, prop6) => {
    // if (process.env.NODE_ENV !== 'production') return
    switch (type) {
        case 'episode':
            if (!episodeId) return
            mariadb.query(`SELECT name, cover_art, slug,id FROM anime WHERE id=${prop1}`).then(anime => {
                const { name, cover_art, slug, id } = anime[0]
                const timestamp = new Date()
                const title = `${name} | ${prop3 ? prop4 !== null ? prop3.toUpperCase() + " " + prop4 : prop3.toUpperCase() : prop4 + ". Bölüm"}`
                const newEpisodeEmbed = {
                    username: "Yeni Bölüm Habercisi",
                    content: process.env.DISCORD_MENTION_ID ? `<@&${process.env.DISCORD_MENTION_ID}>` : "",
                    embeds: [{
                        title,
                        fields: [{
                            name: `Emektarlar`,
                            value: `${prop2 ? prop2 : "Belirtilmemiş."}`
                        }],
                        url: prop3 === 'toplu' ? `${prop6}/ceviriler/anime/${slug}` : `${prop6}/ceviriler/anime/${slug}/izle/bolum${prop4}`,
                        color: 1161213,
                        footer: {
                            text: `Eklenme tarihi: ${timestamp.getDate() < 10 ? "0" + timestamp.getDate() : timestamp.getDate()}.${timestamp.getMonth() + 1 < 10 ? `0${timestamp.getMonth() + 1}` : `${timestamp.getMonth() + 1}`}.${timestamp.getFullYear()} - ${timestamp.getHours() < 10 ? "0" + timestamp.getHours() : timestamp.getHours()}:${timestamp.getMinutes() < 10 ? "0" + timestamp.getMinutes() : timestamp.getMinutes()}`
                        },
                        thumbnail: {
                            url: `${cover_art}`
                        },
                        author: {
                            name: process.env.SITE_NAME,
                            url: process.env.HOST_URL,
                            icon_url: logoLink
                        }
                    }]
                }
                axios.post(episodeId, newEpisodeEmbed)
                    .then(_ => {
                        return true
                    })
                    .catch(err => {
                        return false
                    })
            })
            break;
        case 'anime':
            if (!animeId) return
            mariadb.query(`SELECT * FROM anime WHERE id=${prop1}`).then(anime => {
                let { name, cover_art, slug, id, synopsis, translators, encoders, mal_link } = anime[0]
                synopsis = `${synopsis.replace(/(["])/g, "'")}`
                translators = translators.split(',').map(translator => `${translator}\n`).join('')
                encoders = encoders.split(',').map(encoder => `${encoder}\n`).join('')
                const timestamp = new Date()
                const newAnimeEmbed = {
                    username: "Yeni Anime Habercisi",
                    content: process.env.DISCORD_MENTION_ID ? `<@&${process.env.DISCORD_MENTION_ID}>` : "",
                    embeds: [{
                        title: name,
                        description: "",
                        fields: [
                            {
                                name: `Özet`,
                                value: `${synopsis}`
                            },
                            {
                                name: `Çevirmen(ler)`,
                                value: `${translators ? translators : "Belirtilmemiş."}`,
                                "inline": true
                            },
                            {
                                name: `Encoder(lar)`,
                                value: `${encoders ? encoders : "Belirtilmemiş."}`,
                                "inline": true
                            },
                            {
                                name: `MyAnimeList`,
                                value: `\n\n[Link](${mal_link})`,
                                "inline": true
                            },
                            {
                                name: `Konu Link`,
                                value: `[${process.env.SITE_NAME}](${prop2}/ceviriler/anime/${slug})`,
                                "inline": true
                            }
                        ],
                        url: `${prop2}/ceviriler/anime/${slug}`,
                        color: 1161213,
                        footer: {
                            text: `Eklenme tarihi: ${timestamp.getDate() < 10 ? "0" + timestamp.getDate() : timestamp.getDate()}.${timestamp.getMonth() + 1 < 10 ? `0${timestamp.getMonth() + 1}` : `${timestamp.getMonth() + 1}`}.${timestamp.getFullYear()} - ${timestamp.getHours() < 10 ? "0" + timestamp.getHours() : timestamp.getHours()}:${timestamp.getMinutes() < 10 ? "0" + timestamp.getMinutes() : timestamp.getMinutes()}`
                        },
                        thumbnail: {
                            url: `${cover_art}`
                        },
                        author: {
                            name: process.env.SITE_NAME,
                            url: process.env.HOST_URL,
                            icon_url: logoLink
                        }
                    }]
                }
                axios.post(animeId, newAnimeEmbed)
                    .then(_ => {
                        return true
                    })
                    .catch(err => {
                        return false
                    })
            })
            break;
        case 'manga':
            if (!mangaId) return
            mariadb.query(`SELECT * FROM manga WHERE id=${prop1}`).then(manga => {
                let { name, cover_art, slug, id, synopsis, translators, editors, mal_link } = manga[0]
                synopsis = `${synopsis.replace(/(["])/g, "'")}`
                translators = translators.split(',').map(translator => `${translator}\n`).join('')
                editors = editors.split(',').map(editor => `${editor}\n`).join('')
                const timestamp = new Date()
                const newMangaEmbed = {
                    username: "Yeni Manga Habercisi",
                    content: process.env.DISCORD_MENTION_ID ? `<@&${process.env.DISCORD_MENTION_ID}>` : "",
                    embeds: [{
                        title: name,
                        description: '',
                        fields: [
                            {
                                name: `Özet`,
                                value: `${synopsis}`
                            },
                            {
                                name: `Çevirmen(ler)`,
                                value: `${translators ? translators : "Belirtilmemiş."}`,
                                "inline": true
                            },
                            {
                                name: `Editör(ler)`,
                                value: `${editors ? editors : "Belirtilmemiş."}`,
                                "inline": true
                            },
                            {
                                name: `MyAnimeList`,
                                value: `\n\n[Link](${mal_link})`,
                                "inline": true
                            },
                            {
                                name: `Konu Link`,
                                value: `[${process.env.SITE_NAME}](${prop2}/ceviriler/manga/${slug})`,
                                "inline": true
                            }
                        ],
                        url: `${prop2}/ceviriler/manga/${slug}`,
                        color: 1161213,
                        footer: {
                            text: `Eklenme tarihi: ${timestamp.getDate() < 10 ? "0" + timestamp.getDate() : timestamp.getDate()}.${timestamp.getMonth() + 1 < 10 ? `0${timestamp.getMonth() + 1}` : `${timestamp.getMonth() + 1}`}.${timestamp.getFullYear()} - ${timestamp.getHours() < 10 ? "0" + timestamp.getHours() : timestamp.getHours()}:${timestamp.getMinutes() < 10 ? "0" + timestamp.getMinutes() : timestamp.getMinutes()}`
                        },
                        thumbnail: {
                            url: `${cover_art}`
                        },
                        author: {
                            name: process.env.SITE_NAME,
                            url: process.env.HOST_URL,
                            icon_url: logoLink
                        }
                    }]
                }
                axios.post(mangaId, newMangaEmbed)
                    .then(_ => {
                        return true
                    })
                    .catch(err => {
                        return false
                    })
            })
            break;
        default:
            return false
    }
}

module.exports = sendDiscordEmbed