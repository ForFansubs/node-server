function downloadImageWriterError(path, err) {
    return console.log(`${path} yolunu write için açarken bir sorun oluştu.`)
}

function downloadImageDownloadError(link, err) {
    console.log(`${link} yolundaki resmi indirirken bir sorun oluştu.`)
    return console.log(err)
}

function downloadImageDone(slug, imageType) {
    return console.log(`${slug} için ${imageType} indirmesi tamamlandı.`)
}

function downloadImageConvertError(slug, imageType, err) {
    console.log(`${slug} için ${imageType} indirdikten sonra, resmi işlerken bir sorun oluştu.`)
    return console.log(err)
}

function downloadImageError(slug, imageType) {
    return console.log(`${slug} için ${imageType} indirirken bir sorun oluştu.`)
}

function unlinkFileDone(path) {
    return console.log(`${path} yolu başarıyla silindi.`)
}

function unlinkFileError(path, err) {
    console.log(`${path} yolunu silerken bir sorun oluştu.`)
    return console.log(err)
}

function logFailError(process, documentId, err) {
    console.log(err)
    return console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`)
}

module.exports = {
    downloadImageWriterError,
    downloadImageDownloadError,
    downloadImageDone,
    downloadImageError,
    downloadImageConvertError,
    unlinkFileDone,
    unlinkFileError,
    logFailError
}