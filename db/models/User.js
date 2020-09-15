'use strict';
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('user', {
        slug: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        name: {
            type: DataTypes.CHAR(75),
            allowNull: false
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        permission_level: {
            type: DataTypes.CHAR(50),
            allowNull: true,
            defaultValue: "kullanici"
        },
        avatar: {
            type: DataTypes.CHAR(100),
            allowNull: false
        },
        email: {
            type: DataTypes.CHAR(100),
            allowNull: false
        },
        created_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        activated: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        freezeTableName: true,
        timestamps: false,
        sequelize,
        modelName: "user",
    })
    User.associate = function (models) {
        // associations can be defined here
    };
    return User;
};