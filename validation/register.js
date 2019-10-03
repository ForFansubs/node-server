const Validator = require('validator')
const isEmpty = require('./is-empty')

module.exports = function validateRegisterInput(data) {
    let errors = {}

    data.username = !isEmpty(data.name) ? data.name : ''
    data.email = !isEmpty(data.email) ? data.email : ''
    data.password = !isEmpty(data.password) ? data.password : ''
    data.password2 = !isEmpty(data.password2) ? data.password2 : ''

    if (!Validator.isLength(data.name, { min: 2, max: 30 })) {
        errors.username = 'Kullanıcı isminiz en az 2 karakter, en fazla 30 karakter olabilir'
    }

    if (Validator.isEmpty(data.name)) {
        errors.username = 'Kullanıcı isminizi girmeniz gerekiyor'
    }

    if (Validator.isEmpty(data.email)) {
        errors.email = 'Emailinizi girmeniz gerekiyor'
    }

    if (!Validator.isEmail(data.email)) {
        errors.email = 'Bu geçerli bir email değil'
    }


    if (Validator.isEmpty(data.password)) {
        errors.password = 'Şifrenizi girmeniz gerekiyor'
    }

    if (Validator.isEmpty(data.password2)) {
        errors.password2 = 'Şifrenizi doğrulamanız gerekiyor'
    }

    if (!Validator.equals(data.password, data.password2)) {
        errors.password2 = 'Şifreleriniz uyuşmuyor'
    }

    if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
        errors.password = 'Şifreniz en az 6 karakterden oluşmalıdır'
    }

    isEmpty(errors) ? null : errors.err = 'Bir sorun var'

    return {
        errors,
        isValid: isEmpty(errors)
    }
}