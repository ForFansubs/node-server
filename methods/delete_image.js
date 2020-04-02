const fs = require('fs')
const Path = require('path')

module.exports = async function deleteImage(slug, type) {
    //type anime veya manga
    let path
    switch (type) {
        case "anime":
            path = Path.resolve(__dirname, '../images/anime', `${slug}-header.jpeg`)
            fs.unlink(path, (err) => {
                if (err) return
                /* path = Path.resolve(__dirname, '../images/anime', `${slug}-cover_art.jpeg`)
                fs.unlink(path, (err) => {
                    if (err) console.log(err)
                }) */
            })
            return true
            break;
        case "manga":
            path = Path.resolve(__dirname, '../images/manga', `${slug}-header.jpeg`)
            fs.unlink(path, (err) => {
                if (err) return
                /* path = Path.resolve(__dirname, '../images/manga', `${slug}-cover_art.jpeg`)
                fs.unlink(path, (err) => {
                    if (err) console.log(err)
                }) */
            })
            return true
            break;
        default:
            return false
            break;
    }
}
