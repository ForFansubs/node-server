const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

function ResizeImagesHeader(file_path, slug) {
    const image_path = path.resolve(__dirname + file_path + slug + "-header.jpeg")
    const hdFile = fs.createWriteStream()

    writer = fs.readFile(path, { flags: 'w' }, (err, file) => {
        sharp(file).resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(path)
    })
}

module.exports = { ResizeImagesHeader }