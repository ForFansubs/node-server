'use strict';
module.exports = (sequelize, DataTypes) => {
    const Permission = sequelize.define('permission', {
        slug: {
            type: DataTypes.CHAR(50),
            allowNull: false
        },
        name: {
            type: DataTypes.CHAR(50),
            allowNull: false
        },
        permission_set: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: "[]"
        },
        color: {
            type: DataTypes.CHAR,
            allowNull: true
        }
    }, {
        freezeTableName: true,
        timestamps: false,
        sequelize,
        modelName: "permission"
    })
    Permission.associate = function (models) {
        // associations can be defined here
    };
    return Permission;
};