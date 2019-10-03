const mariadb = require('../config/maria')
const jwt = require('jsonwebtoken');

const keys = require('../config/keys');

async function is_perm(token, perm) {
    if (!token) throw "Token yok!"
    let decoded = jwt.verify(token, keys.secretOrKey)
    const user_id = decoded.id
    let sayac = 0
    let user = await mariadb.query(`SELECT permission_level FROM user WHERE id="${user_id}"`).catch(err => {
        console.log(err)
        return false
    })
    if (!user) return false
    const permission_level = user[0].permission_level
    let permList = await mariadb.query(`SELECT permission_set FROM permission WHERE slug="${permission_level}"`)
        .then(permission => {
            const permList = JSON.parse(permission[0].permission_set)
            return permList
        })
        .catch(err => {
            console.log(err)
            return false
        })
    if (!permList || permList.length === 0) {
        return false
    }
    else {
        let result = await permList.every(permName => {
            if (perm === permName) {
                return true
            }
            sayac++
            if (sayac >= Object.keys(permList).length) {
                return false
            }
            return true
        })
        return {
            is_perm: result,
            username: decoded.username,
            user_id: decoded.id
        }
    }
}

module.exports = is_perm