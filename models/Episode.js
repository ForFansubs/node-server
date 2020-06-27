const Sequelize = require("sequelize");
const Model = Sequelize.Model;
const sequelize = require('../config/sequelize')

class Episode extends Model { }

Episode.init({
    anime_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    episode_number: {
        type: Sequelize.CHAR,
        allowNull: true,
        defaultValue: "0"
    },
    special_type: {
        type: Sequelize.CHAR,
        allowNull: true
    },
    credits: {
        type: Sequelize.CHAR,
        allowNull: true
    },
    can_user_download: {
        type: Sequelize.TINYINT,
        allowNull: true,
        defaultValue: 1
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
    modelName: "episode"
})

module.exports = Episode