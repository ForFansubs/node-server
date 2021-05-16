// Discord Embed dosyası
// Mesajlar içerisinde kullanılan cover_art linkleri,
// database içerisinde kayıtlı linklerden çekiliyor.
const axios = require("axios");

const { Anime, Manga } = require("../config/sequelize");
const episodeInfoParser = require("./episode-info-parser");

const episodeWebhook = process.env.DISCORD_EPISODE_WH;
const animeWebhook = process.env.DISCORD_ANIME_WH;
const mangaWebhook = process.env.DISCORD_MANGA_WH;
const mangaEpisodeWebhook = process.env.DISCORD_MANGA_EPISODE_WH;
const hostURL = process.env.HOST_URL;
const logoLink = `${hostURL}/logo.png`;

const episodeLinkParser = (episodenumber, specialtype) => {
    if (specialtype && specialtype !== "toplu") {
        return {
            slug: `/izle/${specialtype}${episodenumber}`,
        };
    } else if (specialtype && specialtype === "toplu") {
        return {
            slug: "",
        };
    } else
        return {
            slug: `/izle/bolum${episodenumber}`,
        };
};

const sendDiscordEmbed = async (props) => {
    const { type, t } = props;

    switch (type) {
        case "manga-episode": {
            if (!mangaEpisodeWebhook) return;

            const { manga_id, credits, episode_name, episode_number } = props;

            try {
                const { name, cover_art, slug } = await Manga.findOne({
                    raw: true,
                    where: { id: manga_id },
                });
                const timestamp = new Date();
                const title = `${name} | ${t("common:episode.episode_title", {
                    episode_number: episode_number,
                })}`;
                const newEpisodeEmbed = {
                    username: t("discordEmbed:manga_episode.name"),
                    content: process.env.DISCORD_MENTION_ID
                        ? `<@&${process.env.DISCORD_MENTION_ID}>`
                        : "",
                    embeds: [
                        {
                            title,
                            description: episode_name,
                            fields: [
                                {
                                    name: t("discordEmbed:general.credits"),
                                    value: `${credits ? credits : "-"}`,
                                },
                            ],
                            url: `${hostURL}/ceviriler/manga/${slug}/oku/${episode_number}`,
                            color: 1161213,
                            timestamp,
                            thumbnail: {
                                url: `${cover_art}`,
                            },
                            author: {
                                name: process.env.SITE_NAME,
                                url: process.env.HOST_URL,
                                icon_url: logoLink,
                            },
                        },
                    ],
                };
                axios
                    .post(mangaEpisodeWebhook, newEpisodeEmbed)
                    .then((_) => {
                        return true;
                    })
                    .catch((err) => {
                        console.log(err);
                        return false;
                    });
            } catch (err) {
                console.log(err);
            }
            break;
        }

        case "episode": {
            if (!episodeWebhook) return;

            const { anime_id, credits, episode_number, special_type } = props;

            try {
                const { name, cover_art, slug } = await Anime.findOne({
                    raw: true,
                    where: { id: anime_id },
                });
                const timestamp = new Date();
                const title = `${name} | ${
                    episodeInfoParser(name, episode_number, special_type, t)
                        .title
                }`;
                const newEpisodeEmbed = {
                    username: t("discordEmbed:episode.name"),
                    content: process.env.DISCORD_MENTION_ID
                        ? `<@&${process.env.DISCORD_MENTION_ID}>`
                        : "",
                    embeds: [
                        {
                            title,
                            fields: [
                                {
                                    name: t("discordEmbed:general.credits"),
                                    value: `${credits ? credits : "-"}`,
                                },
                            ],
                            url: `${hostURL}/ceviriler/anime/${slug}${
                                episodeLinkParser(episode_number, special_type)
                                    .slug
                            }`,
                            color: 1161213,
                            timestamp,
                            thumbnail: {
                                url: `${cover_art}`,
                            },
                            author: {
                                name: process.env.SITE_NAME,
                                url: process.env.HOST_URL,
                                icon_url: logoLink,
                            },
                        },
                    ],
                };
                axios
                    .post(episodeWebhook, newEpisodeEmbed)
                    .then((_) => {
                        return true;
                    })
                    .catch((err) => {
                        console.log(err);
                        return false;
                    });
            } catch (err) {
                console.log(err);
            }
            break;
        }

        case "anime": {
            if (!animeWebhook) return;

            const { anime_id } = props;

            try {
                let {
                    name,
                    cover_art,
                    slug,
                    synopsis,
                    translators,
                    encoders,
                    mal_link,
                } = await Anime.findOne({ raw: true, where: { id: anime_id } });
                synopsis = `${synopsis.replace(/(["])/g, "'")}`;
                translators = translators
                    .split(",")
                    .map((translator) => `${translator}\n`)
                    .join("");
                encoders = encoders
                    .split(",")
                    .map((encoder) => `${encoder}\n`)
                    .join("");
                const timestamp = new Date();
                const newAnimeEmbed = {
                    username: t("discordEmbed:anime.name"),
                    content: process.env.DISCORD_MENTION_ID
                        ? `<@&${process.env.DISCORD_MENTION_ID}>`
                        : "",
                    embeds: [
                        {
                            title: name,
                            description: "",
                            fields: [
                                {
                                    name: t("discordEmbed:general.synopsis"),
                                    value: `${synopsis}`,
                                },
                                {
                                    name: t("discordEmbed:general.translators"),
                                    value: `${translators ? translators : "-"}`,
                                    inline: true,
                                },
                                {
                                    name: t("discordEmbed:anime.encoders"),
                                    value: `${encoders ? encoders : "-"}`,
                                    inline: true,
                                },
                                {
                                    name: `MyAnimeList`,
                                    value: `\n\n[Link](${mal_link})`,
                                    inline: true,
                                },
                                {
                                    name: `Link`,
                                    value: `[${process.env.SITE_NAME}](${hostURL}/ceviriler/anime/${slug})`,
                                    inline: true,
                                },
                            ],
                            url: `${hostURL}/ceviriler/anime/${slug}`,
                            color: 1161213,
                            timestamp,
                            thumbnail: {
                                url: `${cover_art}`,
                            },
                            author: {
                                name: process.env.SITE_NAME,
                                url: process.env.HOST_URL,
                                icon_url: logoLink,
                            },
                        },
                    ],
                };
                axios
                    .post(animeWebhook, newAnimeEmbed)
                    .then((_) => {
                        return true;
                    })
                    .catch((err) => {
                        console.log(err);
                        return false;
                    });
            } catch (err) {
                console.log(err);
            }
            break;
        }

        case "manga": {
            if (!mangaWebhook) return;

            const { manga_id } = props;

            try {
                let {
                    name,
                    cover_art,
                    slug,
                    synopsis,
                    translators,
                    editors,
                    mal_link,
                } = await Manga.findOne({ raw: true, where: { id: manga_id } });
                synopsis = `${synopsis.replace(/(["])/g, "'")}`;
                translators = translators
                    .split(",")
                    .map((translator) => `${translator}\n`)
                    .join("");
                editors = editors
                    .split(",")
                    .map((editor) => `${editor}\n`)
                    .join("");
                const timestamp = new Date();
                const newMangaEmbed = {
                    username: t("discordEmbed:manga.name"),
                    content: process.env.DISCORD_MENTION_ID
                        ? `<@&${process.env.DISCORD_MENTION_ID}>`
                        : "",
                    embeds: [
                        {
                            title: name,
                            description: "",
                            fields: [
                                {
                                    name: t("discordEmbed:general.synopsis"),
                                    value: `${synopsis}`,
                                },
                                {
                                    name: t("discordEmbed:general.translators"),
                                    value: `${translators ? translators : "-"}`,
                                    inline: true,
                                },
                                {
                                    name: t("discordEmbed:manga.editors"),
                                    value: `${editors ? editors : "-"}`,
                                    inline: true,
                                },
                                {
                                    name: `MyAnimeList`,
                                    value: `\n\n[Link](${mal_link})`,
                                    inline: true,
                                },
                                {
                                    name: `Link`,
                                    value: `[${process.env.SITE_NAME}](${hostURL}/ceviriler/manga/${slug})`,
                                    inline: true,
                                },
                            ],
                            url: `${hostURL}/ceviriler/manga/${slug}`,
                            color: 1161213,
                            timestamp,
                            thumbnail: {
                                url: `${cover_art}`,
                            },
                            author: {
                                name: process.env.SITE_NAME,
                                url: process.env.HOST_URL,
                                icon_url: logoLink,
                            },
                        },
                    ],
                };
                axios
                    .post(mangaWebhook, newMangaEmbed)
                    .then((_) => {
                        return true;
                    })
                    .catch((err) => {
                        console.log(err);
                        return false;
                    });
            } catch (err) {
                console.log(err);
            }
            break;
        }
        default:
            return false;
    }
};

module.exports = sendDiscordEmbed;
