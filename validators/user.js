const Joi = require("joi");

const registerUserSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8).max(100),
    repeat_password: Joi.ref("password"),
    recaptcha_response: Joi.string(),
});

const loginUserSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required().min(8).max(100),
    recaptcha_response: Joi.string(),
});

module.exports = { registerUserSchema, loginUserSchema };
