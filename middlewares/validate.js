const Joi = require("joi");
const JoiValidator = (schema, property) => {
    return async (req, res, next) => {
        try {
            await schema.validateAsync(req.body);
            next();
        } catch (err) {
            const { details } = err;
            let message = {};
            for (const detail of details) {
                message[detail.context.label] = detail.message;
            }

            console.log(message);
            res.status(422).json({ err: message });
        }
    };
};
module.exports = JoiValidator;
