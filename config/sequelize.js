const Sequelize = require('sequelize');

// Option 1: Passing parameters separately
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mariadb',
    dialectOptions: {
        timezone: 'Etc/GMT+3',
    },
    logging: process.env.NODE_ENV === "production" ? false : (msg) => {
        console.log(" ")
        console.info("\x1b[36m############\x1b[33mSEQUELIZE QUERY\x1b[36m############")
        console.info(msg)
        console.info("\x1b[36m#########\x1b[33mEND OFSEQUELIZE QUERY\x1b[36m#########")
        console.log(" ")
    },
    pool: {
        max: 50,
        min: 20,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize