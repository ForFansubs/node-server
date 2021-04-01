const express = require("express");
const router = express.Router();
const check_permission = require("../../middlewares/check_permission");
const sendDiscordEmbed = require("../../methods/discord_embed");
const downloadImage = require("../../methods/download_image");
const renameImage = require("../../methods/rename_image");
const deleteImage = require("../../methods/delete_image");
const standartSlugify = require("standard-slugify");
const genre_map = require("../../config/maps/genremap");
const season_map = require("../../config/maps/seasonmap");
const status_map = require("../../config/maps/statusmap");
const error_messages = require("../../config/error_messages");
const CreateMetacontentCanvas = require("../../methods/create_metadata_canvas");

const {
    LogAddAnime,
    LogUpdateAnime,
    LogDeleteAnime,
    LogFeaturedAnime,
} = require("../../methods/database_logs");
const { GeneralAPIRequestsLimiter } = require("../../middlewares/rate-limiter");

// Models
const { Sequelize, Anime, Episode, User } = require("../../config/sequelize");
const {
    addAnimeSchema,
    updateAnimeSchema,
    deleteAnimeSchema,
    updateFeaturedAnimeSchema,
} = require("../../validators/anime");
const authCheck = require("../../middlewares/authCheck");
const JoiValidator = require("../../middlewares/validate");

String.prototype.mapReplace = function (map) {
    var regex = [];
    for (var key in map)
        regex.push(key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
    return this.replace(new RegExp(regex.join("|"), "g"), function (word) {
        return map[word];
    });
};

// @route   POST api/anime/anime-ekle
// @desc    Add anime (perm: "add-anime")
// @access  Private
router.post("/anime-ekle", authCheck("add-anime"), async (req, res) => {
    //Eğer varsa anime daha önceden eklenmiş mi diye isimle kontrol et.
    let anime = await Anime.findOne({
        where: { name: req.body.name, version: req.body.version },
    });
    //Eğer varsa öne hata yolla.
    if (anime)
        return res
            .status(400)
            .json({ err: req.t("errors:anime.already_exists") });

    //Slug'ı yukardaki fonksiyonla oluştur.
    const slug =
        standartSlugify(req.body.name) +
        (req.body.version === "bd" ? "-bd" : "");

    //Release date için default bir değer oluştur, eğer MAL'dan data alındıysa onunla değiştir
    let release_date = req.body.release_date || new Date();

    //Mal linkinin id'sini al, tekrardan buildle
    const mal_link = `https://myanimelist.net/anime/${
        req.body.mal_link.split("/")[4]
    }`;

    //Türleri string olarak al ve mapten Türkçeye çevir
    let genres = req.body.genres.mapReplace(genre_map);

    //Yayınlanma sezonunu string olarak al, mapten Türkçeye çevir
    let premiered = req.body.premiered.mapReplace(season_map) || "";

    //Seri durumunu string olarak al, mapten Türkçeye çevir
    const series_status = req.body.series_status.mapReplace(status_map);

    //Database'e yolla.
    try {
        const result = await Anime.create({
            ...req.body,
            series_status,
            premiered,
            genres,
            mal_link,
            release_date,
            slug,
            created_by: req.authUser.id,
        });

        // Log
        LogAddAnime({
            process_type: "add-anime",
            username: req.authUser.name,
            anime_id: result.id,
        });

        //Discord Webhook isteği yolla.
        sendDiscordEmbed({
            type: "anime",
            anime_id: result.id,
            t: req.t,
        });

        //Eğer logo linki verilmişse al ve diske kaydet
        if (req.body.logo) {
            try {
                await downloadImage(req.body.logo, "logo", slug, "anime");
            } catch (err) {
                console.log(err);
            }
        }

        //Cover_art'ı diske indir
        try {
            await downloadImage(req.body.cover_art, "cover", slug, "anime");
        } catch (err) {
            console.log(err);
        }

        //Header linki yollanmışsa alıp diske kaydet
        if (req.body.header) {
            try {
                await downloadImage(req.body.header, "header", slug, "anime");
            } catch (err) {
                console.log(err);
            }
        }

        //Metadata resmini oluştur
        try {
            await CreateMetacontentCanvas({
                type: "anime",
                slug,
                backgroundImage: req.body.header,
                coverArt: req.body.cover_art,
                t: req.t,
            });
        } catch (err) {
            console.log(err);
        }

        res.status(200).json({ success: "success" });
    } catch (err) {
        console.log(err);
        Anime.destroy({ where: { name: req.body.name } });
        return res
            .status(400)
            .json({ err: req.t("errors:database.cant_connect") });
    }
});

// @route   POST api/anime/anime-guncelle
// @desc    Update anime (perm: "update-anime")
// @access  Private
router.post("/anime-guncelle", authCheck("update-anime"), async (req, res) => {
    // Validate body
    // await updateAnimeSchema.validateAsync(req.body);

    //Güncellenecek animeyi database'te bul
    let anime = await Anime.findByPk(req.body.id);

    let { slug } = anime;

    //Türleri string olarak al ve mapten Türkçeye çevir
    let genres = req.body.genres;
    genres = genres.mapReplace(genre_map);
    console.log(anime.version);

    //Eğer içeriğin türü değiştiyse, slug'ı ona göre değiştir.
    if (req.body.version !== anime.version) {
        const oldSlug = slug;
        slug =
            req.body.version === "bd"
                ? `${slug}-bd`
                : `${slug.replace("-bd", "")}`;
        try {
            await renameImage(oldSlug, slug, "logo", "anime");
            await renameImage(oldSlug, slug, "header", "anime");
            await renameImage(oldSlug, slug, "cover", "anime");
        } catch (err) {
            console.log(err);
        }
    }

    //Database'teki satırı güncelle.
    try {
        await Anime.update(
            {
                ...req.body,
                slug,
                genres,
            },
            {
                where: {
                    id: req.body.id,
                },
            }
        );

        LogUpdateAnime({
            process_type: "update-anime",
            username: req.authUser.name,
            anime_id: req.body.id,
        });

        //Cover_art'ı diske indir
        try {
            await downloadImage(req.body.cover_art, "cover", slug, "anime");
        } catch (err) {
            console.log(err);
        }

        //Eğer logo inputuna "-" konulmuşsa, diskteki logoyu sil
        if (req.body.logo === "-") {
            await deleteImage(slug, "anime", "logo");
        }

        //Eğer logo linki verilmişse al ve diske kaydet
        if (req.body.logo && req.body.logo !== "-") {
            await downloadImage(req.body.logo, "logo", slug, "anime");
        }

        //Eğer header inputuna "-" konulmuşsa, diskteki resmi sil
        if (req.body.header === "-") {
            await deleteImage(slug, "anime", "header");
        }

        //Eğer bir header linki gelmişse, bu resmi indirip diskteki resmi değiştir
        if (req.body.header && req.body.header !== "-") {
            await downloadImage(req.body.header, "header", slug, "anime");
        }

        if (req.body.cover_art) {
            await CreateMetacontentCanvas({
                type: "anime",
                slug,
                backgroundImage: req.body.header || undefined,
                coverArt: req.body.cover_art,
                t: req.t,
            });
        }

        return res.status(200).json({ success: "success" });
    } catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({ err: req.t("errors:database.cant_connect") });
    }
});

// @route   GET api/anime/anime-sil
// @desc    Delete anime (perm: "delete-anime")
// @access  Private
router.post("/anime-sil/", authCheck("delete-anime"), async (req, res) => {
    // await deleteAnimeSchema.validateAsync(req.body);
    const { id } = req.body;

    let anime = await Anime.findOne({ raw: true, where: { id: id } });

    if (!anime)
        return res
            .status(500)
            .json({ err: req.t("errors:database.cant_connect") });

    try {
        await Anime.destroy({ where: { id: id } });
        //Animeyle bağlantılı resimleri diskte varsa sil.
        try {
            await deleteImage(anime.slug, "anime", "header");
        } catch (err) {
            console.log(err);
        }
        try {
            await deleteImage(anime.slug, "anime", "logo");
        } catch (err) {
            console.log(err);
        }
        try {
            await deleteImage(anime.slug, "anime", "cover");
        } catch (err) {
            console.log(err);
        }

        LogDeleteAnime({
            process_type: "delete-anime",
            username: req.authUser.name,
            anime_name: anime.name,
        });

        return res.status(200).json({ success: "success" });
    } catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({ err: req.t("errors:database.cant_connect") });
    }
});

// @route   POST api/anime/update-featured-anime
// @desc    Featured anime (perm: "featured-anime")
// @access  Private
router.post(
    "/update-featured-anime",
    authCheck("featured-anime"),
    async (req, res) => {
        // await updateFeaturedAnimeSchema.validateAsync(req.body);
        const { data } = req.body;

        try {
            await Anime.update(
                { is_featured: 0 },
                { where: { is_featured: 1 } }
            );
        } catch (err) {
            return res
                .status(500)
                .json({ err: req.t("errors:database.cant_connect") });
        }

        try {
            await Anime.update(
                { is_featured: 1 },
                {
                    where: {
                        name: {
                            [Sequelize.Op.in]: data.map(({ name }) => name),
                        },
                        version: {
                            [Sequelize.Op.in]: data.map(
                                ({ version }) => version
                            ),
                        },
                    },
                }
            );
            res.status(200).json({ success: "success" });
            LogFeaturedAnime({
                process_type: "featured-anime",
                username: req.authUser.name,
            });
        } catch (err) {
            console.log(err);
            return res
                .status(500)
                .json({ err: req.t("errors:database.cant_connect") });
        }
    }
);

// @route   GET api/anime/admin-featured-anime
// @desc    Get featured-anime
// @access  Public
router.get(
    "/admin-featured-anime",
    authCheck("see-admin-page"),
    async (req, res) => {
        try {
            const anime = await Anime.findAll({ where: { is_featured: 1 } });
            res.status(200).json(anime);
        } catch (err) {
            console.log(err);
            return res
                .status(500)
                .json({ err: req.t("errors:database.cant_connect") });
        }
    }
);

// @route   GET api/anime/liste
// @desc    Get all animes
// @access  Public
router.get("/liste", GeneralAPIRequestsLimiter, async (req, res) => {
    let animes;

    try {
        animes = await Anime.findAll({
            raw: true,
            attributes: [
                "slug",
                "name",
                "synopsis",
                "version",
                "genres",
                "premiered",
                "cover_art",
            ],
            order: ["name"],
        });
        const animeList = animes.map((anime) => {
            anime.genres = anime.genres.split(",");
            return anime;
        });
        res.status(200).json(animeList);
    } catch (err) {
        console.log(err);
        res.status(500).json({ err: req.t("errors:database.cant_connect") });
    }
});

// @route   GET api/anime/admin-liste
// @desc    Get all animes with all data
// @access  Public
router.get("/admin-liste", authCheck("see-admin-page"), async (req, res) => {
    try {
        const animes = await Anime.findAll({ order: ["name"] });
        res.status(200).json(animes);
    } catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({ err: req.t("errors:database.cant_connect") });
    }
});

// @route   GET api/anime/:slug/admin-view
// @desc    View anime (perm: "see-anime")
// @access  Private
router.get("/:slug/admin-view", authCheck("see-anime"), async (req, res) => {
    let anime;

    try {
        anime = await Anime.findOne({
            where: {
                slug: req.params.slug,
            },
            include: [
                {
                    model: Episode,
                    as: "episodes",
                    order: [
                        ["special_type"],
                        [Sequelize.fn("ABS", Sequelize.col("episode_number"))],
                    ],
                },
            ],
        });
    } catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({ err: req.t("errors:database.cant_connect") });
    }

    if (!anime) {
        return res.status(404).json({ err: req.t("errors:anime.no_anime") });
    } else {
        //Anime bulunduysa bölümlerini çek.
        try {
            res.status(200).json(anime);
        } catch (err) {
            console.log(err);
            return res
                .status(500)
                .json({ err: req.t("errors:database.cant_connect") });
        }
    }
});

// @route   GET api/anime/:slug
// @desc    View anime
// @access  Public
router.get("/:slug", GeneralAPIRequestsLimiter, async (req, res) => {
    let anime;
    try {
        anime = await Anime.findOne({
            where: { slug: req.params.slug },
            attributes: [
                "name",
                "slug",
                "id",
                "version",
                "synopsis",
                "translators",
                "encoders",
                "studios",
                "genres",
                "cover_art",
                "mal_link",
                "episode_count",
                "release_date",
                "premiered",
                "trans_status",
                "series_status",
                "pv",
            ],
            include: [
                {
                    model: Episode,
                    as: "episodes",
                    where: { can_user_download: 1 },
                    order: [
                        ["special_type"],
                        [Sequelize.fn("ABS", Sequelize.col("episode_number"))],
                    ],
                    required: false,
                },
                {
                    model: User,
                    as: "createdBy",
                    attributes: ["name"],
                    required: false,
                },
            ],
        });
    } catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({ err: req.t("errors:database.cant_connect") });
    }
    //Eğer anime yoksa hata yolla.
    if (!anime) {
        return res.status(404).json({ err: req.t("errors:anime.no_anime") });
    } else {
        //Anime bulunduysa bölümlerini çek.
        try {
            res.status(200).json(anime);
        } catch (err) {
            console.log(err);
            return res
                .status(500)
                .json({ err: req.t("errors:database.cant_connect") });
        }
    }
});

module.exports = router;
