const fs = require('fs')
const axios = require('axios')
const Path = require('path')
const sharp = require('sharp')

async function getImageFromLink(link) {
    let res

    try {
        res = await axios.get(link, { responseType: "stream" })
    } catch (err) {
        console.log(err.message)
        throw { message: "Şu anda bu resim indirilemiyor." }
    }
    return res.data
}

async function saveImageToDisk(image, slug, contentType, imageType) {
    //contentType [anime, manga]
    //imageType [logo, header, cover_art]

    //Path ve dosyayı oluştur, eğer logoysa dosya uzantısını png olarak al
    const path = Path.resolve(__dirname, `../images/${contentType}`, `${slug}-${imageType === "logo" ? `${imageType}.png` : `${imageType}.jpeg`}`)
    const writer = fs.createWriteStream(path, { flags: 'w' })
    //Writer açılamazsa hata ver
    if (!writer) {
        console.log("Dosya kayıt yeri açılamadı.")
        return false
    }

    const converter = () => {
        if (imageType === "logo") {
            return sharp().png()
        }
        else {
            return sharp().resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 90 })
        }
    }

    image.pipe(converter()).pipe(writer)
    console.log(path)
    return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
            console.log("İndirme tamamlandı.")
            writer.end()
        })
        writer.on('error', err => {
            console.log(err)
            console.log(slug + " yolunun headerında sorun var.")
            fs.unlink(path, (err) => {
                if (err) return console.log(err)
                return true
            })
        })
    })
}

module.exports = async function downloadImage(link, imageType, slug, contentType) {
    //contentType [anime, manga]
    //imageType [logo, header, cover_art]
    let image
    try {
        image = await getImageFromLink(link)
    } catch (err) {
        console.log(err)
        throw err
    }
    saveImageToDisk(image, slug, contentType, imageType)
}
