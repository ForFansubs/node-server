'use strict';
module.exports = (sequelize, DataTypes) => {
    const MangaEpisode = sequelize.define('manga_episode', {
        manga_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        episode_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: "0"
        },
        episode_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        credits: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        pages: {
            type: DataTypes.JSON,
            allowNull: false
        },
        created_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        freezeTableName: true,
        timestamps: false,
        sequelize,
        modelName: "manga_episode"
    });
    MangaEpisode.associate = function (models) {
        // associations can be defined here
    };
    return MangaEpisode;
};