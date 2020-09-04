const Sequelize = require("sequelize");
const Model = Sequelize.Model;
const sequelize = require('../../config/sequelize')

class PendingUser extends Model { }

PendingUser.init({
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    hash_key: {
        type: Sequelize.TEXT,
        allowNull: false,
        primaryKey: true
    },
    created_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize,
    modelName: "pending_user"
})

module.exports = PendingUser