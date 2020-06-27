const fs = require('fs')
const Path = require('path')

module.exports = async function renameImage(oldSlug, newSlug, imageType, contentType) {
    //contentType [anime, manga]
    //imageType [logo, header, cover_art]
    const oldPath = Path.resolve(__dirname, `../images/${contentType}`, `${oldSlug}-${imageType === "logo" ? `${imageType}.png` : `${imageType}.jpeg`}`)
    const newPath = Path.resolve(__dirname, `../images/${contentType}`, `${newSlug}-${imageType === "logo" ? `${imageType}.png` : `${imageType}.jpeg`}`)
    try {
        if (fs.existsSync(oldPath))
            fs.renameSync(oldPath, newPath)
    } catch (err) {
        console.log(err)
        throw err
    }
}
