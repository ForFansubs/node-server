const Validator = require('validator')
const isEmpty = require('./is-empty')

module.exports = function validateAnimeInput(data) {
    let errors = {}

    if (Validator.isEmpty(data.name)) {
        errors.name = 'İsim boş bırakılamaz'
    }

    if (Validator.isEmpty(data.synopsis)) {
        errors.synopsis = 'Konu boş bırakılamaz'
    }

    if (Validator.isEmpty(data.translators)) {
        errors.name = 'Çevirmenler boş bırakılamaz'
    }

    if (Validator.isEmpty(data.encoders)) {
        errors.name = 'Encoderlar boş bırakılamaz'
    }

    if (Validator.isEmpty(data.release_date)) {
        errors.release_date = 'Çıkış tarihi boş bırakılamaz'
    }

    if (Validator.isEmpty(data.studios)) {
        errors.studios = 'Stüdyo boş bırakılamaz'
    }

    if (Validator.isEmpty(data.cover_art)) {
        errors.cover_art = 'Cover art boş bırakılamaz'
    }

    if (Validator.isEmpty(data.mal_link)) {
        errors.mal_link = 'MAL linki boş bırakılamaz'
    }

    if (Validator.isEmpty(data.genres)) {
        errors.genres = 'Türler boş bırakılamaz'
    }

    return {
        errors,
        isValid: isEmpty(errors)
    }
}