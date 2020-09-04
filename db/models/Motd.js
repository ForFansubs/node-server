const Sequelize = require("sequelize");
const Model = Sequelize.Model;
const sequelize = require('../../config/sequelize')

class Motd extends Model { }

Motd.init({
    is_active: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    can_user_dismiss: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    title: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    subtitle: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    content_type: {
        type: Sequelize.CHAR,
        allowNull: true
    },
    content_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    created_by: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    created_time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize,
    modelName: "motd"
})

module.exports = Motd