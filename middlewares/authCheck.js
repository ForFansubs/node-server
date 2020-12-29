const Joi = require('joi')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const keys = require('../config/keys')

const authCheckSchema = Joi.object({
    token: Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/).required()
})

const { Permission, User } = require('../config/sequelize')

module.exports = function (permission) {
    return async function (req, res, next) {
        try {
            // Token'i headerdan al
            let token = req.headers['x-access-token'] || req.headers['authorization']
            // Token yoksa hata ver
            if (!token) return res.status(403).json({ message: "Lütfen sisteme giriş yapın." })
            // Tokenden "Bearer " bölümünü sil, tokeni al
            // token = token.slice(7, token.length).trimLeft()
            // Gelen body'i kontrol et
            await authCheckSchema.validateAsync({ token })
            // Token'i kontrol et
            const validatedUser = await jwt.verify(token, keys.secretOrKey)
            // Token içerisindeki id'ye göre kullanıcının rollerini bul
            const UserAccount = await User.findByPk(validatedUser.id)
            if (!UserAccount) throw new Error("")
            const UserAuthPerms = await Permission.findOne({ where: { slug: UserAccount.permission_level } })
            if (!UserAuthPerms) throw new Error("")
            // Bütün yetkileri bir yere topla
            let roles = UserAuthPerms.permission_set
            // İstenen yetkiyi listeden bul
            const isPermitted = _.find(roles, function (r) { return r === permission })
            if (!isPermitted) throw new Error("123")
            // Bulunan kullanıcıyı yolla
            req.authUser = UserAccount
            next()
        } catch (err) {
            return res.status(403).json({ message: "Bu işlemi gerçekleştirmek için yetkiniz yok!" })
        }
    }
}

module.exports.inline = async function (permission, req) {
    try {
        // Token'i headerdan al
        let token = req.headers['x-access-token'] || req.headers['authorization']
        // Token yoksa hata ver
        if (!token) return res.status(403).json({ message: "Lütfen sisteme giriş yapın." })
        // Tokenden "Bearer " bölümünü sil, tokeni al
        // token = token.slice(7, token.length).trimLeft()
        // Gelen body'i kontrol et
        await authCheckSchema.validateAsync({ token })
        // Token'i kontrol et
        const validatedUser = await jwt.verify(token, keys.secretOrKey)
        // Token içerisindeki id'ye göre kullanıcının rollerini bul
        const UserAccount = await User.findByPk(validatedUser.id)
        if (!UserAccount) throw new Error("")
        const UserAuthPerms = await Permission.findOne({ where: { slug: UserAccount.permission_level } })
        if (!UserAuthPerms) throw new Error("")
        // Bütün yetkileri bir yere topla
        let roles = UserAuthPerms.permission_set
        // İstenen yetkiyi listeden bul
        const isPermitted = _.find(roles, function (r) { return r === permission })
        if (!isPermitted) throw new Error("123")
        // Doğrulamayı yolla
        return true
    } catch (err) {
        throw new Error("")
    }
}