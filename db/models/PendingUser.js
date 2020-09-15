'use strict';
module.exports = (sequelize, DataTypes) => {
    const PendingUser = sequelize.define('pending_user', {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        hash_key: {
            type: DataTypes.TEXT,
            allowNull: false,
            primaryKey: true
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
        modelName: "pending_user"
    })
    PendingUser.associate = function (models) {
        // associations can be defined here
    };
    return PendingUser;
};