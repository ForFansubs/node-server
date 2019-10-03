const Validator = require('validator')
const isEmpty = require('../validation/is-empty')

module.exports = function validateLoginInput(data) {
    let errors = {}

    data.username = !isEmpty(data.username) ? data.username : ''
    data.password = !isEmpty(data.password) ? data.password : ''

    if (Validator.isEmpty(data.name)) {
        errors.username = 'Kullanıcı adınızı girmeniz gerekiyor'
    }

    if (Validator.isEmpty(data.password)) {
        errors.password = 'Şifrenizi girmeniz gerekiyor'
    }

    isEmpty(errors) ? null : errors.err = 'Bir sorun var'

    return {
        errors,
        isValid: isEmpty(errors)
    }
}