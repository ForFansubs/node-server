'use strict';
module.exports = (sequelize, DataTypes) => {
    const Anime = sequelize.define('anime', {
        slug: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        is_featured: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        version: {
            type: DataTypes.CHAR,
            allowNull: false,
            defaultValue: "tv"
        },
        pv: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        series_status: {
            type: DataTypes.CHAR,
            allowNull: false,
            defaultValue: "Tamamlandı"
        },
        trans_status: {
            type: DataTypes.CHAR,
            allowNull: false,
            defaultValue: "Tamamlandı"
        },
        name: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        synopsis: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        translators: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        encoders: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        studios: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        cover_art: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        mal_link: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        episode_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        genres: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        release_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        premiered: {
            type: DataTypes.CHAR,
            allowNull: true,
            defaultValue: ""
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
        modelName: "anime"
    })
    Anime.associate = function (models) {
        // associations can be defined here
    };
    return Anime;
};