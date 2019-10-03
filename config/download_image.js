const fs = require('fs')
const axios = require('axios')
const Path = require('path')
const sharp = require('sharp')

module.exports = async function downloadImage(link, type, slug, type2) {
    //type header veya cover_art
    //type2 anime veya manga
    let path
    let writer
    switch (type2) {
        case "anime":
            if (type === "header") path = Path.resolve(__dirname, '../images/anime', `${slug}-header.jpeg`)
            else path = Path.resolve(__dirname, '../images/anime', `${slug}-cover_art.jpeg`)
            writer = fs.createWriteStream(path, { flags: 'w' })
            axios.get(link, { responseType: 'stream' }).then(res => {
                res.data.pipe(writer)
            }).catch(_ => _)
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    const file = fs.readFileSync(path)
                    fs.unlink(path, (err) => {
                        if (err) return console.log(err)
                        sharp(file).resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(path)
                    })

                })
                writer.on('error', reject => {
                    console.log(reject)
                    console.log(slug + " yolunun headerında sorun var.")
                    fs.unlinkSync(path)
                })
            })
            break;
        case "manga":
            if (type === "header") path = Path.resolve(__dirname, '../images/manga', `${slug}-header.jpeg`)
            else path = Path.resolve(__dirname, '../images/manga', `${slug}-cover_art.jpeg`)
            writer = fs.createWriteStream(path, { flags: 'w' })
            axios.get(link, { responseType: 'stream' }).then(res => {
                res.data.pipe(writer)
            }).catch(_ => _)
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    const file = fs.readFileSync(path)
                    fs.unlink(path, (err) => {
                        if (err) return console.log(err)
                        sharp(file).resize({ width: 1920, withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(path)
                    })
                })
                writer.on('error', () => {
                    console.log(reject)
                    console.log(slug + " yolunun headerında sorun var.")
                    fs.unlink(path, (err) => {
                        if (err) return console.log(err)
                    })
                })
            })
            break;
        default:
            return false
            break;
    }
}
