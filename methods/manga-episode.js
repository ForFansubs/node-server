const fs = require("fs");
const Path = require("path");
const sanitize = require("sanitize-filename");

const getPath = (manga_slug, episode_number, filename) =>
    Path.resolve(
        __dirname,
        `../images/manga_episodes/${manga_slug}${
            episode_number ? `/${episode_number}` : ""
        }${episode_number && filename ? `/${filename}` : ""}`
    );

async function deleteMangaFolder(manga_slug, episode_number, pages) {
    if (!manga_slug || !episode_number || !pages) throw "Parametreler eksik.";

    const folderPath = getPath(manga_slug, episode_number);

    if (!fs.existsSync(folderPath)) throw "Dosya bulunamadı.";

    for (const page of pages) {
        const filepath = getPath(manga_slug, episode_number, page.filename);
        fs.unlinkSync(filepath, (err) => {
            if (err) {
                return unlinkFileError(path, err);
            }
        });
    }

    fs.rmdirSync(folderPath);
}

async function deleteMangaFolders(manga_slug) {
    if (!manga_slug) throw "Parametreler eksik.";

    const folderPath = getPath(manga_slug);
    console.log(folderPath);

    if (!fs.existsSync(folderPath)) throw "Dosya bulunamadı.";

    // Varolan bölüm dosyalarını bul
    const existingEpisodes = fs.readdirSync(getPath(manga_slug));
    // Döndür
    for (const episode_number of existingEpisodes) {
        // Varolan bölüm dosyaları içerisindeki sayfaları bul
        const existingPages = fs.readdirSync(
            getPath(manga_slug, episode_number)
        );
        // Döndür
        for (const page of existingPages) {
            // Sayfaların hepsini sil, dosyayı boşalt
            const pagePath = getPath(manga_slug, episode_number, page);
            fs.unlinkSync(pagePath, (err) => {
                if (err) {
                    return unlinkFileError(path, err);
                }
            });
        }
        // Bölüm dosyasını sil
        fs.rmdirSync(getPath(manga_slug, episode_number));
    }
    // Manga dosyasını sil
    fs.rmdirSync(folderPath);
}

async function clearMangaFolder(manga_slug, episode_number, pages) {
    manga_slug = sanitize(manga_slug);
    episode_number = sanitize(episode_number);
    const existingPages = fs.readdirSync(getPath(manga_slug, episode_number));
    for (const page of existingPages) {
        if (!pages.find((p) => p.filename === page)) {
            const pagePath = getPath(manga_slug, episode_number, page);
            fs.unlinkSync(pagePath, (err) => {
                if (err) {
                    return unlinkFileError(path, err);
                }
            });
        }
    }
}

module.exports = {
    clearMangaFolder,
    deleteMangaFolder,
    deleteMangaFolders,
    getPath,
};
