'use strict';
module.exports = (sequelize, DataTypes) => {
    const WatchLink = sequelize.define('watch_link', {
        anime_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        episode_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        link: {
            type: DataTypes.CHAR,
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
        modelName: "watch_link"
    })
    WatchLink.associate = function (models) {
        // associations can be defined here
    };
    return WatchLink;
};