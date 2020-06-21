const Sequelize = require("sequelize");
const Model = Sequelize.Model;
const sequelize = require('../config/sequelize')

class User extends Model { }

User.init({
    slug: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    name: {
        type: Sequelize.CHAR(75),
        allowNull: false
    },
    password: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    permission_level: {
        type: Sequelize.CHAR(50),
        allowNull: false
    },
    avatar: {
        type: Sequelize.CHAR(100),
        allowNull: false
    },
    email: {
        type: Sequelize.CHAR(100),
        allowNull: false
    },
    created_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    activated: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize,
    modelName: "user"
})

module.exports = User