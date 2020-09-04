const Sequelize = require("sequelize");
const Model = Sequelize.Model;
const sequelize = require('../../config/sequelize')

class MangaEpisode extends Model { }

MangaEpisode.init({
    manga_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    episode_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "0"
    },
    episode_name: {
        type: Sequelize.STRING(255),
        allowNull: true
    },
    credits: {
        type: Sequelize.CHAR,
        allowNull: true
    },
    pages: {
        type: Sequelize.JSON,
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
    modelName: "manga_episode"
})

module.exports = MangaEpisode