const rateLimit = require("express-rate-limit");

const UserLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // start blocking after 5 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 15 dakika sonra tekrar deneyin."
});

const UserRegisterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 1, // start blocking after 1 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 saat sonra tekrar deneyin."
});

const MangaEpisodeImageLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 1000, // start blocking after 1000 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 5 dakika sonra tekrar deneyin."
});

const VariousImageLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 500, // start blocking after 500 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 5 dakika sonra tekrar deneyin."
});

const CrawlerFileLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 5, // start blocking after 5 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 dakika sonra tekrar deneyin."
});

const IndexRequestsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 60, // start blocking after 60 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 dakika sonra tekrar deneyin."
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

module.exports = { UserLoginLimiter, UserRegisterLimiter, MangaEpisodeImageLimiter, VariousImageLimiter, CrawlerFileLimiter, IndexRequestsLimiter, GeneralAPIRequestsLimiter, IndexAPIRequestsLimiter }