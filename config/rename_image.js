const fs = require('fs')
const axios = require('axios')
const Path = require('path')
const sharp = require('sharp')

module.exports = async function renameImage(slugOld, slugNew, type) {
    //type anime veya manga
    let path
    let writer
    switch (type) {
        case "anime":
            fs.renameSync(Path.resolve(__dirname, '../images/anime', `${slugOld}-header.jpeg`), Path.resolve(__dirname, '../images/anime', `${slugNew}-header.jpeg`))
            break;
        case "manga":
            fs.renameSync(Path.resolve(__dirname, '../images/manga', `${slugOld}-header.jpeg`), Path.resolve(__dirname, '../images/manga', `${slugNew}-header.jpeg`))
            break;
        default:
            return false
            break;
    }
}
