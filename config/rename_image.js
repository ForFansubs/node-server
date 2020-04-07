const fs = require('fs')
const axios = require('axios')
const Path = require('path')
const sharp = require('sharp')
const standartSlugify = require('standard-slugify')

module.exports = async function renameImage(slugOld, slugNew, type) {
    slugOld = standartSlugify(slugOld)
    slugNew = standartSlugify(slugNew)
    //type anime veya manga
    let path
    let writer
    switch (type) {
        case "anime-cover":
            fs.renameSync(Path.resolve(__dirname, '../images/anime', `${slugOld}-cover.jpeg`), Path.resolve(__dirname, '../images/anime', `${slugNew}-cover.jpeg`))
            break;
        case "anime-header":
            fs.renameSync(Path.resolve(__dirname, '../images/anime', `${slugOld}-header.jpeg`), Path.resolve(__dirname, '../images/anime', `${slugNew}-header.jpeg`))
            break;
        case "manga-cover":
            fs.renameSync(Path.resolve(__dirname, '../images/manga', `${slugOld}-cover.jpeg`), Path.resolve(__dirname, '../images/manga', `${slugNew}-cover.jpeg`))
            break;
        case "manga-header":
            fs.renameSync(Path.resolve(__dirname, '../images/manga', `${slugOld}-header.jpeg`), Path.resolve(__dirname, '../images/manga', `${slugNew}-header.jpeg`))
            break;
        default:
            return false
            break;
    }
}
