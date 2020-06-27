// Discord Embed dosyası
// Mesajlar içerisinde kullanılan cover_art linkleri,
// database içerisinde kayıtlı linklerden çekiliyor.

const mariadb = require('../config/maria')
const axios = require('axios')

const episodeWebhook = process.env.DISCORD_EPISODE_WH
const animeWebhook = process.env.DISCORD_ANIME_WH
const mangaWebhook = process.env.DISCORD_MANGA_WH
const mangaEpisodeWebhook = process.env.DISCORD_MANGA_EPISODE_WH
const hostURL = process.env.HOST_URL
const logoLink = `${hostURL}/logo.png`

const episodeLinkParser = (episodenumber, specialtype) => {
    if (specialtype && specialtype !== "toplu") {
        return {
            slug: `/izle/${specialtype}${episodenumber}`
        }
    }
    else if (specialtype && specialtype === "toplu") {
        return {
            slug: ""
        }
    }
    else return {
        slug: `/izle/bolum${episodenumber}`
    }
}

const sendDiscordEmbed = async (props) => {
    const { type } = props

    switch (type) {
        case 'manga-episode': {
            if (!mangaEpisodeWebhook) return

            const { manga_id, credits, episode_name, episode_number } = props

            try {
                const manga = await mariadb(`SELECT name, cover_art, slug,id FROM manga WHERE id=${manga_id}`)
                const { name, cover_art, slug } = manga[0]
                const timestamp = new Date()
                const title = `${name} | ${episode_number}. Bölüm`
                const newEpisodeEmbed = {
                    username: "Yeni Manga Bölümü Habercisi",
                    content: process.env.DISCORD_MENTION_ID ? `<@&${process.env.DISCORD_MENTION_ID}>` : "",
                    embeds: [{
                        title,
                        description: episode_name,
                        fields: [{
                            name: `Emektarlar`,
                            value: `${credits ? credits : "Belirtilmemiş."}`
                        }],
                        url: `${hostURL}/ceviriler/manga/${slug}/oku/${episode_number}`,
                        color: 1161213,
                        timestamp,
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
                axios.post(mangaEpisodeWebhook, newEpisodeEmbed)
                    .then(_ => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
            } catch (err) {
                console.log(err)
            }
            break;
        }

        case 'episode': {
            if (!episodeWebhook) return

            const { anime_id, credits, episode_number, special_type } = props

            try {
                const anime = await mariadb(`SELECT name, cover_art, slug,id FROM anime WHERE id=${anime_id}`)
                const { name, cover_art, slug } = anime[0]
                const timestamp = new Date()
                const title = `${name} | ${special_type ? episode_number !== null ? special_type.toUpperCase() + " " + episode_number : special_type.toUpperCase() : episode_number + ". Bölüm"}`
                const newEpisodeEmbed = {
                    username: "Yeni Bölüm Habercisi",
                    content: process.env.DISCORD_MENTION_ID ? `<@&${process.env.DISCORD_MENTION_ID}>` : "",
                    embeds: [{
                        title,
                        fields: [{
                            name: `Emektarlar`,
                            value: `${credits ? credits : "Belirtilmemiş."}`
                        }],
                        url: `${hostURL}/ceviriler/anime/${slug}${episodeLinkParser(episode_number, special_type).slug}`,
                        color: 1161213,
                        timestamp,
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
                axios.post(episodeWebhook, newEpisodeEmbed)
                    .then(_ => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
            } catch (err) {
                console.log(err)
            }
            break;
        }

        case 'anime': {
            if (!animeWebhook) return

            const { anime_id } = props

            try {
                const anime = await mariadb(`SELECT * FROM anime WHERE id=${anime_id}`)
                let { name, cover_art, slug, synopsis, translators, encoders, mal_link } = anime[0]
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
                                value: `[${process.env.SITE_NAME}](${hostURL}/ceviriler/anime/${slug})`,
                                "inline": true
                            }
                        ],
                        url: `${hostURL}/ceviriler/anime/${slug}`,
                        color: 1161213,
                        timestamp,
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
                axios.post(animeWebhook, newAnimeEmbed)
                    .then(_ => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
            } catch (err) {
                console.log(err)
            }
            break;
        }

        case 'manga': {
            if (!mangaWebhook) return

            const { manga_id } = props

            try {
                const manga = await mariadb(`SELECT * FROM manga WHERE id=${manga_id}`)
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
                                value: `[${process.env.SITE_NAME}](${hostURL}/ceviriler/manga/${slug})`,
                                "inline": true
                            }
                        ],
                        url: `${hostURL}/ceviriler/manga/${slug}`,
                        color: 1161213,
                        timestamp,
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
                axios.post(mangaWebhook, newMangaEmbed)
                    .then(_ => {
                        return true
                    })
                    .catch(err => {
                        console.log(err)
                        return false
                    })
            } catch (err) {
                console.log(err)
            }
            break;
        }
        default:
            return false
    }
}

module.exports = sendDiscordEmbed