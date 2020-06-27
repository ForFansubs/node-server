const RateLimit = require("express-rate-limit");

var UserLoginLimiter = new RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // start blocking after 5 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 15 dakika sonra tekrar deneyin."
});

var UserRegisterLimiter = new RateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 1, // start blocking after 1 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 saat sonra tekrar deneyin."
});

var MangaEpisodeImageLimiter = new RateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 1000, // start blocking after 1000 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 5 dakika sonra tekrar deneyin."
});

var VariousImageLimiter = new RateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 500, // start blocking after 1000 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 5 dakika sonra tekrar deneyin."
});

var CrawlerFileLimiter = new RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 5, // start blocking after 1000 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 dakika sonra tekrar deneyin."
});

var IndexRequestsLimiter = new RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 60, // start blocking after 1000 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 dakika sonra tekrar deneyin."
});

module.exports = { UserLoginLimiter, UserRegisterLimiter, MangaEpisodeImageLimiter, VariousImageLimiter, CrawlerFileLimiter, IndexRequestsLimiter }