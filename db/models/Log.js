const Sequelize = require("sequelize");
const Model = Sequelize.Model;
const sequelize = require('../../config/sequelize')

class Log extends Model { }

Log.init({
    user: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    process_type: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    process: {
        type: Sequelize.CHAR,
        allowNull: false
    },
    text: {
        type: Sequelize.CHAR,
        allowNull: false
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
    modelName: "log"
})

module.exports = Log