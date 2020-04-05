const mariadb = require('../config/maria')
const jwt = require('jsonwebtoken');

const keys = require('../config/keys');

async function check_permission(token, perm) {
    if (!token) throw "Token yok!"
    let user, permission_result, decoded

    try {
        decoded = await jwt.verify(token, keys.secretOrKey)
    } catch (err) {
        throw "Token doğrulanamadı."
    }

    const user_id = decoded.id
    let sayac = 0
    try {
        user = await mariadb(`SELECT permission_level FROM user WHERE id="${user_id}"`)
    } catch (err) {
        console.log(err)
        throw err
    }
    const permission_level = user[0].permission_level
    try {
        permission_result = await mariadb(`SELECT permission_set FROM permission WHERE slug="${permission_level}"`)
    } catch (err) {
        console.log(err)
        throw err
    }
    const perm_list = JSON.parse(permission_result[0].permission_set)
    if (!perm_list || perm_list.length === 0) {
        throw "Yetkisiz kullanım!"
    }
    else {
        let result = await perm_list.every(permName => {
            if (perm === permName) {
                return true
            }
            sayac++
            if (sayac >= Object.keys(perm_list).length) {
                throw "Yetkisiz kullanım!"
            }
            return true
        })
        return {
            is_permitted: result,
            username: decoded.username,
            user_id: decoded.id
        }
    }
}

module.exports = check_permission