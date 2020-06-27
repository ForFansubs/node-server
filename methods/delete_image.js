const fs = require('fs')
const Path = require('path')
const LogConsole = require('./console_logs')

module.exports = async function deleteImage(slug, contentType, imageType) {
    //contentType [anime, manga]
    //imageType [logo, header, cover_art]
    const path = Path.resolve(__dirname, `../images/${contentType}`, `${slug}-${imageType === "logo" ? `${imageType}.png` : `${imageType}.jpeg`}`)

    if (fs.existsSync(path)) {
        fs.unlink(path, (err) => {
            if (err) {
                return LogConsole.unlinkFileError(path, err)
            }
            LogConsole.unlinkFileDone(path)
        })
    }
    else return LogConsole.pathNotFound(path)
}
