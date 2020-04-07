const fs = require('fs')
const axios = require('axios')
const Path = require('path')
const sharp = require('sharp')
const standartSlugify = require('standard-slugify')

module.exports = async function downloadImage(link, slug, type) {
    slug = standartSlugify(slug)
    //type anime, manga
    let path
    let writer
    switch (type) {
        case "anime-cover":
            path = Path.resolve(__dirname, '../images/anime', `${slug}-cover.jpeg`)
            writer = fs.createWriteStream(path, { flags: 'w' })
            axios.get(link, { responseType: 'stream' }).then(res => {
                res.data.pipe(writer)
            }).catch(_ => _)
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    const file = fs.readFileSync(path)
                    fs.unlink(path, (err) => {
                        if (err) return console.log(err)
                        sharp(file).jpeg({ quality: 90 }).toFile(path)
                    })
                })
                writer.on('error', reject => {
                    console.log(reject)
                    console.log(slug + " yolunun coverında sorun var.")
                    fs.unlink(path, (err) => {
                        if (err) return console.log(err)
                    })
                })
            })
            break;
        case "anime-header":
            path = Path.resolve(__dirname, '../images/anime', `${slug}-header.jpeg`)
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
                    fs.unlink(path, (err) => {
                        if (err) return console.log(err)
                    })
                })
            })
            break;
        case "manga-cover":
            path = Path.resolve(__dirname, '../images/manga', `${slug}-cover.jpeg`)
            writer = fs.createWriteStream(path, { flags: 'w' })
            axios.get(link, { responseType: 'stream' }).then(res => {
                res.data.pipe(writer)
            }).catch(_ => _)
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    const file = fs.readFileSync(path)
                    fs.unlink(path, (err) => {
                        if (err) return console.log(err)
                        sharp(file).jpeg({ quality: 90 }).toFile(path)
                    })
                })
                writer.on('error', () => {
                    console.log(reject)
                    console.log(slug + " yolunun coverında sorun var.")
                    fs.unlink(path, (err) => {
                        if (err) return console.log(err)
                    })
                })
            })
            break;
        case "manga-header":
            path = Path.resolve(__dirname, '../images/manga', `${slug}-header.jpeg`)
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
