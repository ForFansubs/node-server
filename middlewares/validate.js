const { body, validationResult } = require('express-validator')

function ValidateUserRegistration() {
    return [
        // email check
        body('email').isEmail().withMessage("Bu doğru bir email değil."),
        // name check, 2 chars min
        body('name').isLength({ min: 2 }).escape().withMessage("Kullanıcı adınızı girmeniz gerekiyor"),
        // password check, 6 chars min
        body('password').isLength({ min: 6, max: 100 }).withMessage("Şifreniz en az 6 karakter olmalıdır")
    ]
}

function ValidateUserLogin() {
    return [
        // name check, 2 chars min
        body('username').isLength({ min: 2 }).escape().withMessage("Kullanıcı adınızı girmeniz gerekiyor"),
        // password check, 6 chars min
        body('password').isLength({ min: 6, max: 100 }).withMessage("Şifreniz en az 6 karakter olmalıdır")
    ]
}

const Validation = (req, res, next) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        return next()
    }
    const extractedErrors = {}
    errors.array().map(err => extractedErrors[err.param] = err.msg)

    return res.status(400).json(extractedErrors)
}

module.exports = {
    ValidateUserRegistration,
    ValidateUserLogin,
    Validation,
}