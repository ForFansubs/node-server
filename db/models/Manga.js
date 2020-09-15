'use strict';
module.exports = (sequelize, DataTypes) => {
    const Manga = sequelize.define('manga', {
        slug: {
            type: DataTypes.CHAR,
            allowNull: false
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
        editors: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        authors: {
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
        reader_link: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        download_link: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        genres: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        release_date: {
            type: DataTypes.DATE,
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
        modelName: "manga"
    });
    Manga.associate = function (models) {
        // associations can be defined here
    };
    return Manga;
};