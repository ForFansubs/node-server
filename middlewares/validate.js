const Joi = require('joi');
const JoiValidator = (schema, property) => {
    return async (req, res, next) => {
        try {
            await schema.validateAsync(req.body)
            next();
        } catch (err) {
            const { details } = err;
            const message = details.map(i => i.message).join(',');

            console.log("error", message);
            res.status(422).json({ err: message })
        }
    }
}
module.exports = JoiValidator;