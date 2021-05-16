const fs = require("fs");
const Path = require("path");
const { createCanvas, registerFont, loadImage } = require("canvas");
const { Anime, Manga } = require("../config/sequelize");

const width = 1200;
const height = 628;

registerFont(
    Path.resolve(
        __dirname,
        "..",
        "assets",
        "fonts",
        "Poppins",
        "Poppins-Bold.ttf"
    ),
    { family: "Poppins" }
);
registerFont(
    Path.resolve(
        __dirname,
        "..",
        "assets",
        "fonts",
        "SourceSansPro",
        "SourceSansPro-Bold.ttf"
    ),
    { family: "Source Sans Pro" }
);

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const initialY = y;
    var words = text.split(" ");
    var line = "";
    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + " ";
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth) {
            if ((y - initialY) / lineHeight === 2) line += "...";
            if ((y - initialY) / lineHeight + 1 > 3) break;
            context.fillText(line, x, y);
            line = words[n] + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    if ((y - initialY) / lineHeight + 1 <= 3) {
        context.fillText(line, x, y);
        return (y - initialY) / lineHeight;
    }
    return (y - initialY) / lineHeight - 1;
}

function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }

    // default offset is center
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    // keep bounds [0.0, 1.0]
    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    var iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r, // new prop. width
        nh = ih * r, // new prop. height
        cx,
        cy,
        cw,
        ch,
        ar = 1;

    // decide which gap to fill
    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh; // updated
    nw *= ar;
    nh *= ar;

    // calc source rectangle
    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    // make sure source rectangle is valid
    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    // fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === "undefined") {
        stroke = true;
    }
    if (typeof radius === "undefined") {
        radius = 5;
    }
    if (typeof radius === "number") {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius.br,
        y + height
    );
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

module.exports = async function CreateMetacontentCanvas({
    type,
    slug,
    backgroundImage,
    coverArt,
    t,
}) {
    let content = null;

    switch (type) {
        case "anime":
            content = await Anime.findOne({ where: { slug: slug } });
            break;
        case "manga":
            content = await Manga.findOne({ where: { slug: slug } });
            break;
        default:
            break;
    }

    if (!content) return false;

    const headerPath = Path.resolve(
        __dirname,
        `../images/${type}/${slug}-header.jpeg`
    );
    const coverPath = Path.resolve(
        __dirname,
        `../images/${type}/${slug}-cover.jpeg`
    );
    const logoPath = Path.resolve(__dirname, "../images/static/logo.png");

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    let background = null;
    try {
        background = await loadImage(backgroundImage || headerPath);
    } catch (err) {
        try {
            background = await loadImage(coverArt || coverPath);
        } catch (err) {
            background = await loadImage(content.cover_art);
            console.log(err);
        }
        console.log(err);
    }
    // Draw background image
    ctx.filter = "blur(5px)";
    if (background) drawImageProp(ctx, background, 0, 0, width, height);
    // Clear filter
    ctx.filter = "none";
    // Draw transparent black box on top of image
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, width, height);
    // Draw premiered if exists
    ctx.fillStyle = "#DAD9D9";
    ctx.font = "24px Source Sans Pro";
    // Define shadow
    ctx.shadowBlur = 6;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    let premieredText = { width: 0, height: 0 };
    if (content.premiered) {
        const splitPremiered = content.premiered.split(" ");
        const premieredTrans = `${t(`seasons:${splitPremiered[0]}`)} ${
            splitPremiered[1]
        }`;
        ctx.fillText(premieredTrans, 100, 150);
        premieredText = ctx.measureText(premieredTrans);
    }
    // Draw bullet if premiered and episode count exists
    if (content.premiered && content.episode_count) {
        ctx.fillText("•", 100 + premieredText.width + 10, 150);
    }
    // Draw episode count if exists
    if (content.episode_count) {
        ctx.fillText(
            t("common:episode.total_episode_count", {
                count: content.episode_count,
            }),
            100 + premieredText.width + (content.premiered ? 30 : 0),
            150
        );
    }
    // Draw anime name
    ctx.fillStyle = "white";
    ctx.font = "56px Poppins";
    const studioPosition = wrapText(ctx, content.name, 100, 210, 650, 60);
    // Draw studio
    ctx.fillStyle = "#FF00C1";
    ctx.font = "36px Source Sans Pro";
    if (type === "anime") {
        if (content.studios) {
            ctx.fillText(content.studios, 100, 260 + studioPosition * 60);
        }
    } else {
        if (content.authors) {
            ctx.fillText(content.authors, 100, 260 + studioPosition * 60);
        }
    }
    // Draw credits
    // Credits styles
    ctx.fillStyle = "#FFF";
    ctx.font = "22px Source Sans Pro";
    wrapText(
        ctx,
        t("metadata:translators", {
            translators: content.translators,
        }),
        100,
        height - 162,
        650,
        24
    );
    if (type === "anime") {
        if (content.encoders) {
            wrapText(
                ctx,
                t("metadata:encoders", { encoders: content.encoders }),
                100,
                height - 132,
                650,
                24
            );
        }
    } else {
        if (content.editors) {
            wrapText(
                ctx,
                t("metadata:editors", { editors: content.editors }),
                100,
                height - 132,
                650,
                24
            );
        }
    }
    // Draw genres
    // Genre styles
    ctx.fillStyle = "#ccc";
    ctx.font = "16px Source Sans Pro";
    // Define index and genreWidth for later use of genre placement
    let index = 0;
    let genreWidth = 0;
    // Process every genre
    for (const genre of content.genres.split(",")) {
        // If it's at 7th genre, stop drawing
        if (index > 6) return;
        // Genre width for background size and other genres
        const tempGenre = ctx.measureText(t(`genres:${genre}`));
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        // Draw background rectangles
        roundRect(
            ctx,
            110 + genreWidth - 10 + index * 30,
            height - 90,
            tempGenre.width + 20,
            44,
            8,
            true,
            false
        );
        // Change color for text
        ctx.fillStyle = "#ccc";
        // Print genre on top of background
        ctx.fillText(
            t(`genres:${genre}`),
            10 + genreWidth + 100 + index * 30,
            height - 62
        );
        // Increment index by 1 for margin
        index += 1;
        // Add width of current genre for later placement use
        genreWidth += tempGenre.width;
    }
    // Draw cover art
    let cover_art = null;
    try {
        cover_art = await loadImage(coverArt || coverPath);
    } catch (err) {
        cover_art = await loadImage(content.cover_art);
        console.log(err);
    }
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(0,0,0,.5)";
    if (cover_art) drawImageProp(ctx, cover_art, width - 350, 130, 250, 350);
    // Draw logo
    let logo_image = null;
    try {
        logo_image = await loadImage(logoPath);
    } catch (err) {
        console.log(err);
    }
    if (logo_image) drawImageProp(ctx, logo_image, 100, 25, 100, 100);
    // Draw FFs Copyright
    const textWidth = ctx.measureText("Powered by ForFansubs").width;
    ctx.fillText("Powered by ForFansubs", width - textWidth - 20, height - 20);
    const typeFolderPath = Path.resolve(
        __dirname,
        "../",
        "images",
        "metadata",
        type
    );
    if (!fs.existsSync(typeFolderPath)) fs.mkdirSync(typeFolderPath);

    const streamToFile = (path, stream) => {
        return new Promise((resolve, reject) => {
            const out = fs.createWriteStream(path);
            stream.pipe(out).on("finish", resolve).on("error", reject);
        });
    };

    try {
        await streamToFile(
            Path.resolve(typeFolderPath, `${slug}.png`),
            canvas.createPNGStream()
        );
    } catch (err) {
        console.log(err);
    }
};
