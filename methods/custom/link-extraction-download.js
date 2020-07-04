// Bu dosyayı, sistem varsayılanlarında bulunmayan indirme sitelerini 
// kontrolden geçirmek için kullanabilirsiniz. Ekleyeceğiniz linkleri
// aşağıdaki veya varsayılan link-extraction-download.js'deki şablona
// uygun ekleyebilirsiniz.

const checkCustoms = link => {
    let extract = { link }


    // Burayı düzenlemeniz gerekiyor. Sadece bir link ekleyecekseniz if bloğu
    // kullanabilirsiniz. Birden fazla ekleyecekseniz aşağıdaki düzene
    // else if blokları ekleyerek devam edebilirsiniz.
    if (link.match(/custom1\.com/)) {
        extract.type = "custom1"
    }
    else if (link.match(/custom2\.com/)) {
        extract.type = "custom2"
    }


    // Lütfen aşağıdaki else bloğunu değiştirmeyin.
    else {
        return false
    }
    return extract
}

module.exports = checkCustoms