const fs = require('fs')
const Path = require('path')
const standartSlugify = require('standard-slugify')

module.exports = async function deleteImage(slug, type) {
    slug = standartSlugify(slug)
    //type anime veya manga
    let path
    switch (type) {
        case "anime-cover":
            path = Path.resolve(__dirname, '../images/anime', `${slug}-cover.jpeg`)
            fs.unlink(path, (err) => {
                if (err) return
            })
            return true
            break;
        case "anime-header":
            path = Path.resolve(__dirname, '../images/anime', `${slug}-header.jpeg`)
            fs.unlink(path, (err) => {
                if (err) return
            })
            return true
            break;
        case "manga-cover":
            path = Path.resolve(__dirname, '../images/manga', `${slug}-cover.jpeg`)
            fs.unlink(path, (err) => {
                if (err) return
            })
            return true
            break;
        case "manga-header":
            path = Path.resolve(__dirname, '../images/manga', `${slug}-header.jpeg`)
            fs.unlink(path, (err) => {
                if (err) return
            })
            return true
            break;
        default:
            return false
            break;
    }
}
