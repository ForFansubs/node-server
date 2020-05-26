const fs = require('fs')
const axios = require('axios')
const Path = require('path')
const sharp = require('sharp')
const LogConsole = require('./console_logs')

async function getImageFromLink(link) {
    let res
    //Linki stream olarak al
    try {
        res = await axios.get(link, { responseType: "stream" })
    } catch (err) {
        throw err
    }
    //Resmi döndür
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
        LogConsole.downloadImageWriterError(path)
        throw "Dosya kayıt yeri açılamadı."
    }
    //Resmi dönüştürmek için functionu hazırla
    //Eğer logoysa png olarak al, eğer headersa ve 1920'den büyükse 1920 olarak 
    //dönüştür, kaliteyi biraz düşür, eğer cover_art'sa ve boyutu 600'dan büyükse 
    //600'e düşür, jpeg olarak sakla.
    const converter = () => {
        if (!imageType) throw "Resim türü belirtilmemiş."
        switch (imageType) {
            case "logo":
                return sharp().png()
            case "header":
                return sharp().resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 90 })
            case "cover":
                return sharp().resize({ width: 600, withoutEnlargement: true }).jpeg()
            default:
                return false
        }
    }
    //Resmi dönüştürmeye çalış
    //Dönüştüremezse hatayı yakala.
    try {
        image.pipe(converter()).pipe(writer)
    } catch (err) {
        LogConsole.downloadImageConvertError(slug, imageType, err)
        throw new Error("Resim işlenirken bir sorun oluştu.")
    }
    //Fonksiyon sonunda promise yolla, kullandığın yerde await'le.
    return new Promise((resolve, reject) => {
        //Dosya işlemleri bittikten sonra console'a yaz ve yazma işlemini kapat.
        writer.on('finish', async () => {
            LogConsole.downloadImageDone(slug, imageType)
            writer.end()
        })
        //Eğer herhangi bir hata oluşursa console'a yaz, sonra yazma için açılmış
        //dosyayı sil.
        writer.on('error', err => {
            console.log(err)
            LogConsole.downloadImageError(slug, imageType)
            fs.unlink(path, (err) => {
                if (err) {
                    return LogConsole.unlinkFileError(path, err)
                }
                LogConsole.unlinkFileDone(path)
                return true
            })
        })
    })
}

module.exports = async function downloadImage(link, imageType, slug, contentType) {
    //contentType [anime, manga]
    //imageType [logo, header, cover_art]
    let image
    //Resme ulaşmaya çalış, eğer ulaşamazsan console'a yaz ve hata ver
    //bu hatayı fonksiyonu kullandığın yerlerde yakala
    try {
        image = await getImageFromLink(link)
    } catch (err) {
        LogConsole.downloadImageDownloadError(link, err)
        throw err
    }
    //Eğer resmi indirebildiysen diske kaydet.
    saveImageToDisk(image, slug, contentType, imageType)
}
