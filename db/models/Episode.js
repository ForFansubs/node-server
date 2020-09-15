'use strict';
module.exports = (sequelize, DataTypes) => {
    const Episode = sequelize.define('episode', {
        anime_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        episode_number: {
            type: DataTypes.CHAR,
            allowNull: true,
            defaultValue: "0"
        },
        special_type: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        credits: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        can_user_download: {
            type: DataTypes.TINYINT,
            allowNull: true,
            defaultValue: 1
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
        modelName: "episode"
    });
    Episode.associate = function (models) {
        // associations can be defined here
    };
    return Episode;
};