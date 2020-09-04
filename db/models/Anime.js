const Sequelize = require("sequelize");
const Model = Sequelize.Model;
const sequelize = require('../../config/sequelize')

class Anime extends Model { }

Anime.init({
    slug: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    is_featured: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0
    },
    version: {
        type: Sequelize.CHAR,
        allowNull: false,
        defaultValue: "tv"
    },
    pv: {
        type: Sequelize.CHAR,
        allowNull: true
    },
    series_status: {
        type: Sequelize.CHAR,
        allowNull: false,
        defaultValue: "Tamamlandı"
    },
    trans_status: {
        type: Sequelize.CHAR,
        allowNull: false,
        defaultValue: "Tamamlandı"
    },
    name: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    synopsis: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    translators: {
        type: Sequelize.CHAR,
        allowNull: true
    },
    encoders: {
        type: Sequelize.CHAR,
        allowNull: true
    },
    studios: {
        type: Sequelize.CHAR,
        allowNull: true
    },
    cover_art: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    mal_link: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    episode_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    genres: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    release_date: {
        type: Sequelize.DATE,
        allowNull: false
    },
    premiered: {
        type: Sequelize.CHAR,
        allowNull: true,
        defaultValue: ""
    },
    created_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    created_by: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize,
    modelName: "anime"
})

module.exports = Anime