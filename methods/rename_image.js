const fs = require('fs')
const axios = require('axios')
const Path = require('path')
const sharp = require('sharp')

async function renameHeader(slugOld, slugNew, contentType) {
    const oldPath = Path.resolve(__dirname, `../images/${contentType}`, `${slugOld}-header.jpeg`)
    const newPath = Path.resolve(__dirname, `../images/${contentType}`, `${slugNew}-header.jpeg`)
    try {
        if (fs.existsSync(oldPath))
            fs.renameSync(oldPath, newPath)
    } catch (err) {
        console.log(err)
        throw err
    }
}

async function renameCoverArt(slugOld, slugNew, contentType) {
    const oldPath = Path.resolve(__dirname, `../images/${contentType}`, `${slugOld}-cover.jpeg`)
    const newPath = Path.resolve(__dirname, `../images/${contentType}`, `${slugNew}-cover.jpeg`)
    try {
        if (fs.existsSync(oldPath))
            fs.renameSync(oldPath, newPath)
    } catch (err) {
        console.log(err)
        throw err
    }
}

async function renameLogo(slugOld, slugNew, contentType) {
    const oldPath = Path.resolve(__dirname, `../images/${contentType}`, `${slugOld}-logo.png`)
    const newPath = Path.resolve(__dirname, `../images/${contentType}`, `${slugNew}-logo.png`)
    try {
        if (fs.existsSync(oldPath))
            fs.renameSync(oldPath, newPath)
    } catch (err) {
        console.log(err)
        throw err
    }
}

module.exports = async function renameImage(slugOld, slugNew, contentType, imageType) {
    //type anime veya manga
    try {
        renameHeader(slugOld, slugNew, contentType, imageType)
        renameCoverArt(slugOld, slugNew, contentType, imageType)
        renameLogo(slugOld, slugNew, contentType, imageType)
    } catch (err) {
        console.log(err)
        throw err
    }
}
