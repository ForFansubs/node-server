const Sequelize = require("sequelize");
const Model = Sequelize.Model;
const sequelize = require('../config/sequelize')

class Permission extends Model { }

Permission.init({
    slug: {
        type: Sequelize.CHAR(50),
        allowNull: false
    },
    name: {
        type: Sequelize.CHAR(50),
        allowNull: false
    },
    permission_set: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: "[]"
    },
    color: {
        type: Sequelize.CHAR,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize,
    modelName: "permission"
})

module.exports = Permission