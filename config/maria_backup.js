const mysqldump = require('mysqldump')

async function mysql() {
    const result = await mysqldump({
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        },
    })
    return result
}

module.exports = mysql