// Her türlü geliştirmeye açıktır.
const jwt = require('jsonwebtoken');

const { User, Permission } = require('../config/sequelize')

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
        user = await User.findOne({ raw: true, where: { id: user_id } })
    } catch (err) {
        console.log(err)
        throw err
    }
    const permission_level = user.permission_level
    try {
        permission_result = await Permission.findOne({ raw: true, where: { slug: permission_level } })
    } catch (err) {
        console.log(err)
        throw err
    }
    const perm_list = permission_result.permission_set
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
            username: decoded.name,
            user_id: decoded.id
        }
    }
}

module.exports = check_permission