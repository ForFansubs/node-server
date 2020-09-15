'use strict';
module.exports = (sequelize, DataTypes) => {
    const Log = sequelize.define('log', {
        user: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        process_type: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        process: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        text: {
            type: DataTypes.CHAR,
            allowNull: false
        },
        created_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        freezeTableName: true,
        timestamps: false,
        sequelize,
        modelName: "log"
    });
    Log.associate = function (models) {
        // associations can be defined here
    };
    return Log;
};