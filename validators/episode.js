const Joi = require('joi')

const watchLinkAdminViewSchema = Joi.object({
    episode_id: Joi.number().required()
})

const downloadLinkAdminViewSchema = Joi.object({
    episode_id: Joi.number().required()
})

const createEpisodeSchema = Joi.object({
    episode_number: Joi.string().alphanum().required(),
    anime_id: Joi.number().required(),
    special_type: Joi.string().optional().allow(''),
    credits: Joi.string().optional().allow(''),
    can_user_download: Joi.boolean().required(),
    send_discord_embed: Joi.boolean().required()
})

const updateEpisodeSchema = Joi.object({
    request: Joi.string().valid("update-visibility", "update-data"),
    id: Joi.number().required(),
    anime_id: Joi.number(),
    episode_number: Joi.string(),
    special_type: Joi.string(),
    can_user_download: Joi.number(),
    created_time: Joi.date(),
    created_by: Joi.number(),
    credits: Joi.string().when('request', { is: "update-data", then: Joi.string().required() }),
    value: Joi.number().when('request', { is: "update-visibility", then: Joi.number().required() })
})

const deleteEpisodeSchema = Joi.object({
    episode_id: Joi.number().required()
})

const addDownloadLinkSchema = Joi.object({
    link: Joi.string().required(),
    episode_id: Joi.number().required(),
    anime_id: Joi.number().required()
})

const deleteDownloadLinkSchema = Joi.object({
    episode_id: Joi.number().required(),
    downloadlink_id: Joi.number().required()
})

const addWatchLinkSchema = Joi.object({
    link: Joi.string().required(),
    episode_id: Joi.number().required(),
    anime_id: Joi.number().required()
})

const deleteWatchLinkSchema = Joi.object({
    episode_id: Joi.number().required(),
    watchlink_id: Joi.number().required()
})

module.exports = {
    watchLinkAdminViewSchema,
    downloadLinkAdminViewSchema,
    createEpisodeSchema,
    updateEpisodeSchema,
    deleteEpisodeSchema,
    addDownloadLinkSchema,
    deleteDownloadLinkSchema,
    addWatchLinkSchema,
    deleteWatchLinkSchema
}