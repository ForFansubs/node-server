'use strict';
module.exports = (sequelize, DataTypes) => {
    const Motd = sequelize.define('motd', {
        is_active: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        can_user_dismiss: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        subtitle: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        content_type: {
            type: DataTypes.CHAR,
            allowNull: true
        },
        content_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        created_time: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        freezeTableName: true,
        timestamps: false,
        sequelize,
        modelName: "motd"
    });
    Motd.associate = function (models) {
        // associations can be defined here
    };
    return Motd;
};