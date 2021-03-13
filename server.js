require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const Path = require("path");
const fs = require("fs");
const package = require("./package.json");
const { generateSitemap } = require("./config/sitemap-generator");
const rateLimit = require("express-rate-limit");
const { sequelize } = require("./config/sequelize");
const i18next = require("i18next");
const FilesystemBackend = require("i18next-fs-backend");
const i18nextMiddleware = require("i18next-http-middleware");

const app = express();

// Define Routes
const index = require("./routes/api/index");
const anime = require("./routes/api/anime");
const manga = require("./routes/api/manga");
const mangaEpisode = require("./routes/api/manga_episode");
const episode = require("./routes/api/episode");
const user = require("./routes/api/user");
const images = require("./routes/api/images");
const permission = require("./routes/api/permission");
const motd = require("./routes/api/motd");
const calendar = require("./routes/api/calendar");

// Pre-render middleware
if (process.env.USE_NEW_SEO_METHOD === "true") {
    const redis = require("redis");
    const prerender = require("prerender-node");
    const redisClient = redis.createClient({
        ...JSON.parse(process.env.REDIS_OPTIONS),
    });

    prerender
        .set("beforeRender", function (req, done) {
            redisClient.get(req.url, done);
        })
        .set("afterRender", function (err, req, prerender_res) {
            redisClient.set(
                req.url,
                prerender_res.body,
                "EX",
                process.env.REDIS_CACHE_TIMEOUT
            );
        });
    if (process.env.NODE_ENV === "development") {
        app.use(
            prerender
                .blacklisted("^/api")
                .set("prerenderServiceUrl", process.env.PRERENDER_SERVICE_URL)
                .set(
                    "host",
                    process.env.HOST_URL.replace(/(https:\/\/)|(http:\/\/)/, "")
                )
        );
    } else {
        app.use(
            prerender
                .blacklisted("^/api")
                .set("prerenderServiceUrl", process.env.PRERENDER_SERVICE_URL)
                .set(
                    "host",
                    process.env.HOST_URL.replace(/(https:\/\/)|(http:\/\/)/, "")
                )
                .set("protocol", "https")
        );
    }
}

// Express middleware
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin, Accept, Authorization, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    );
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, PUT, OPTIONS"
    );
    next();
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Helmet JS middleware
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

// Set behind proxy
if (process.env.REVERSE_PROXY) {
    app.set("trust proxy", 1);
}

// Rate-limiter middleware
const CrawlerFileLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 5, // start blocking after 5 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 dakika sonra tekrar deneyin.",
});

const IndexRequestsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 60, // start blocking after 60 requests
    message:
        "Bu IP üzerinden çok fazla istek geldi. Lütfen 1 dakika sonra tekrar deneyin.",
});

// i18next middleware
function getLoadPath(ns) {
    switch (ns) {
        case "common": {
            return __dirname + "/locales/common/{{lng}}/common.json";
        }
        case "days": {
            return __dirname + "/locales/common/{{lng}}/{{ns}}.json";
        }
        case "genres": {
            return __dirname + "/locales/common/{{lng}}/{{ns}}.json";
        }
        case "seasons": {
            return __dirname + "/locales/common/{{lng}}/{{ns}}.json";
        }
        case "general": {
            return __dirname + "/locales/common/{{lng}}/common.json";
        }
        default: {
            return __dirname + "/locales/back-end/{{lng}}/{{ns}}.json";
        }
    }
}

app.use("/locales", express.static(__dirname + "/locales/"));

i18next
    .use(i18nextMiddleware.LanguageDetector)
    .use(FilesystemBackend)
    .init(
        {
            preload: ["tr", "en"],
            fallbackLng: ["tr"],
            ns: [
                "common",
                "days",
                "seasons",
                "genres",
                "errors",
                "mail",
                "metadata",
            ],
            backend: {
                loadPath: (_, ns) => getLoadPath(ns),
                jsonIndent: 4,
            },
        },
        () => {
            app.get("/ads.txt", async (req, res) => {
                res.sendFile(Path.resolve(__dirname, "config", "ads.txt"));
            });
            ///ads txt
            ///robots.txt
            app.get("/robots.txt", CrawlerFileLimiter, async (req, res) => {
                res.sendFile(Path.resolve(__dirname, "config", "robots.txt"));
            });
            ///sitemap.xml
            app.get("/sitemap.xml", CrawlerFileLimiter, async (req, res) => {
                res.sendFile(Path.resolve(__dirname, "config", "sitemap.xml"));
            });

            app.use("/api/", index);
            app.use("/api/anime", anime);
            app.use("/api/manga", manga);
            app.use("/api/bolum", episode);
            app.use("/api/kullanici", user);
            app.use("/api/yetki", permission);
            app.use("/api/resimler", images);
            app.use("/api/manga-bolum", mangaEpisode);
            app.use("/api/motd", motd);
            app.use("/api/takvim", calendar);
            app.get("/api/*", (req, res) => {
                res.status(400).json({ message: "Invalid request." });
            });

            app.use("/admin", express.static(__dirname + "/admin/"));
            app.use(express.static(__dirname + "/client/"));
            app.get("/admin/*", IndexRequestsLimiter, (req, res) => {
                res.sendFile(Path.resolve(__dirname, "admin", "index.html"));
            });
            app.get("*", IndexRequestsLimiter, (req, res) => {
                res.sendFile(Path.resolve(__dirname, "client", "index.html"));
            });
        }
    );
app.use(i18nextMiddleware.handle(i18next));

async function initializeServer() {
    if (process.env.NODE_ENV === "production") {
        process.stdout.write("\033c");
    }

    const animeFolder = Path.resolve(__dirname, "./images/anime");
    const mangaFolder = Path.resolve(__dirname, "./images/manga");
    const mangaEpisodeFolder = Path.resolve(
        __dirname,
        "./images/manga_episodes"
    );
    const metadataFolder = Path.resolve(__dirname, "./images/metadata");
    const clientFolder = Path.resolve(__dirname, "./client");
    const adminFolder = Path.resolve(__dirname, "./admin");
    const logoFile = Path.resolve(__dirname, "./images/static/logo.png");

    console.log("ℹ️ Dosyalar kontrol ediliyor...");

    if (fs.existsSync(animeFolder))
        console.info("✔️ Anime resim dosyası mevcut.");
    else {
        return console.error(
            `❌ Anime resim dosyalarını saklamak için gereken dosya bulunamadı. Lütfen ${animeFolder} yolunu oluşturun.`
        );
    }

    if (fs.existsSync(mangaFolder))
        console.info("✔️ Manga resim dosyası mevcut.");
    else {
        return console.error(
            `❌ Manga resim dosyalarını saklamak için gereken dosya bulunamadı. Lütfen ${mangaFolder} yolunu oluşturun.`
        );
    }

    if (fs.existsSync(mangaEpisodeFolder))
        console.info("✔️ Manga bölümleri için dosya mevcut.");
    else {
        return console.error(
            `❌ Manga bölümlerini saklamak için gereken dosya bulunamadı. Lütfen ${mangaEpisodeFolder} yolunu oluşturun.`
        );
    }

    if (fs.existsSync(metadataFolder))
        console.info("✔️ Metadatada kullanılacak görseller için dosya mevcut.");
    else {
        return console.error(
            `❌ Metadatada kullanılacak görselleri saklamak için gereken dosya bulunamadı. Lütfen ${metadataFolder} yolunu oluşturun.`
        );
    }

    if (fs.existsSync(clientFolder)) console.info("✔️ Client dosyası mevcut.");
    else {
        return console.error(
            `❌ Kullanıcılara gönderilecek client dosyası bulunamadı. Lütfen ${clientFolder} yolunu oluşturun ve https://forfansubs.github.io/docs/yukleme-talimatlari/ adresindeki talimatları yerine getirdiğinizden emin olun.`
        );
    }

    if (fs.existsSync(adminFolder)) console.info("✔️ Admin dosyası mevcut.");
    else {
        return console.error(
            `❌ Kullanıcılara gönderilecek admin dosyası bulunamadı. Lütfen ${adminFolder} yolunu oluşturun ve https://forfansubs.github.io/docs/yukleme-talimatlari/ adresindeki talimatları yerine getirdiğinizden emin olun.`
        );
    }

    if (fs.existsSync(logoFile)) console.info("✔️ Logo mevcut.");
    else {
        return console.error(
            `❌ Bazı fonksiyonlarda kullanılacak olan logo dosyası bulunamadı. Lütfen ${logoFile} dosyasının varlığından emin olun ve https://forfansubs.github.io/docs/yukleme-talimatlari/ adresindeki talimatları yerine getirdiğinizden emin olun.`
        );
    }

    try {
        await sequelize.authenticate();
        console.info("✔️ Database bağlantısı başarılı.");
    } catch (err) {
        return console.error("❌ Database bağlantısı başarısız oldu:", err);
    }

    try {
        if (
            process.env.NODE_APP_INSTANCE == 0 ||
            process.env.NODE_APP_INSTANCE === undefined
        ) {
            await generateSitemap();
            setInterval(async () => {
                await generateSitemap();
            }, 86400000);
        }
    } catch (err) {
        console.log(err);
    }

    const port = process.env.PORT || 5000;
    await app.listen(port);
    console.info("\x1b[32m%s\x1b[0m", "----------------INFO----------------");
    console.info(
        `ℹ️ NODE_ENV:`,
        "\x1b[33m",
        `            ${process.env.NODE_ENV}`
    );
    console.info(
        `ℹ️ Service Name:`,
        "\x1b[33m",
        `        ${process.env.SITE_NAME}`
    );
    console.info(
        `ℹ️ URL:`,
        "\x1b[33m",
        `                 ${process.env.HOST_URL}`
    );
    console.info(`ℹ️ Port:`, "\x1b[33m", `                ${process.env.PORT}`);
    console.info(
        `ℹ️ Database:`,
        "\x1b[33m",
        `            ${process.env.DB_NAME}`
    );
    if (process.env.NODE_APP_INSTANCE !== undefined) {
        console.info(
            `ℹ️ PM2 Cluster ID:`,
            "\x1b[33m",
            `      ${
                process.env.NODE_APP_INSTANCE == 0
                    ? `${process.env.NODE_APP_INSTANCE} (master)`
                    : process.env.NODE_APP_INSTANCE
            }`
        );
    }
    console.info("\x1b[32m%s\x1b[0m", "---------------AUTHOR---------------");
    console.info(`ℹ️ Service Author:`, "\x1b[35m", `      ${package.author}`);
    console.info(`ℹ️ Service Version:`, "\x1b[35m", `     ${package.version}`);
    console.info(
        `ℹ️ Service Release Name:`,
        "\x1b[35m",
        `${package["release-name"]}`
    );
    console.info("\x1b[32m%s\x1b[0m", "------------------------------------");
}

initializeServer();
