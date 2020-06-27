const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: process.env.DB_CONNECTION_LIMIT
})

async function getPool(query) {
    let conn;
    let rows
    try {
        conn = await pool.getConnection()
        rows = await conn.query(query)
        return rows
    } catch (err) {
        throw err
    } finally {
        if (conn) conn.release()
    }
}

module.exports = getPool