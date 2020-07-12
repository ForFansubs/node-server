const rateLimit = require("express-rate-limit");

const UserLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // start blocking after 5 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 15 dakika sonra tekrar deneyin."
});

const UserRegisterLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // start blocking after 3 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 15 dakika sonra tekrar deneyin."
});

const GeneralAPIRequestsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 400, // start blocking after 1000 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 dakika sonra tekrar deneyin."
});

const IndexAPIRequestsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 200, // start blocking after 1000 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 dakika sonra tekrar deneyin."
});

module.exports = { UserLoginLimiter, UserRegisterLimiter, GeneralAPIRequestsLimiter, IndexAPIRequestsLimiter }