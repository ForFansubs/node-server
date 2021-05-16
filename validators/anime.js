const Joi = require("joi");

const addAnimeSchema = Joi.object({
    name: Joi.string().max(100).required(),
    synopsis: Joi.string().max(65535).required(),
    translators: Joi.string().max(255).required(),
    encoders: Joi.string().max(255).required(),
    series_status: Joi.string()
        .valid(
            "currently_airing",
            "finished_airing",
            "not_aired_yet",
            "postponed",
            "canceled"
        )
        .required(),
    trans_status: Joi.string()
        .valid(
            "currently_airing",
            "finished_airing",
            "not_aired_yet",
            "postponed",
            "canceled"
        )
        .required(),
    release_date: Joi.date().required(),
    episode_count: Joi.number().required(),
    studios: Joi.string().max(255).required(),
    cover_art: Joi.string().uri().max(255).required(),
    logo: Joi.string().uri().optional().allow(""),
    header: Joi.string().uri().optional().allow(""),
    mal_link: Joi.string().uri().max(100).required(),
    genres: Joi.string().max(255).required(),
    premiered: Joi.string().max(50).optional().allow(""),
    version: Joi.string().valid("bd", "tv").required(),
    pv: Joi.string().uri().max(255).required(),
    slug: Joi.string().allow(""),
});

const updateAnimeSchema = Joi.object({
    id: Joi.number().required(),
    name: Joi.string().max(100).required(),
    synopsis: Joi.string().max(65535).required(),
    translators: Joi.string().max(255).required(),
    encoders: Joi.string().max(255).required(),
    series_status: Joi.string()
        .valid(
            "currently_airing",
            "finished_airing",
            "not_aired_yet",
            "postponed",
            "canceled"
        )
        .required(),
    trans_status: Joi.string()
        .valid(
            "currently_airing",
            "finished_airing",
            "not_aired_yet",
            "postponed",
            "canceled"
        )
        .required(),
    release_date: Joi.date().required(),
    episode_count: Joi.number().required(),
    studios: Joi.string().max(255).required(),
    cover_art: Joi.string().uri().max(255).required(),
    logo: Joi.string().uri().max(255).optional().allow(""),
    header: Joi.string().uri().max(255).optional().allow(""),
    mal_link: Joi.string().uri().max(100).required(),
    genres: Joi.string().max(255).required(),
    premiered: Joi.string().max(50).optional().allow(""),
    version: Joi.string().valid("bd", "tv").required(),
    pv: Joi.string().uri().max(255).required(),
    slug: Joi.string().allow(""),
});

const deleteAnimeSchema = Joi.object({
    id: Joi.number().required(),
});

const updateFeaturedAnimeSchema = Joi.object({
    data: Joi.array().items({
        name: Joi.string().required(),
        version: Joi.string().required(),
    }),
});

module.exports = {
    addAnimeSchema,
    updateAnimeSchema,
    deleteAnimeSchema,
    updateFeaturedAnimeSchema,
};
