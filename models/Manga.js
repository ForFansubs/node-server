const Sequelize = require("sequelize");
const Model = Sequelize.Model;
const sequelize = require('../config/sequelize')

class Manga extends Model { }

Manga.init({
    slug: {
        type: Sequelize.CHAR,
        allowNull: false
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
    editors: {
        type: Sequelize.CHAR,
        allowNull: true
    },
    authors: {
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
    reader_link: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    download_link: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    genres: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    release_date: {
        type: Sequelize.DATE,
        allowNull: false
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
    modelName: "manga"
})

module.exports = Manga