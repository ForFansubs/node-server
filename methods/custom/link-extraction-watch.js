// Bu dosyayı, sistem varsayılanlarında bulunmayan izleme sitelerini 
// kontrolden geçirmek için kullanabilirsiniz. Ekleyeceğiniz linkleri
// aşağıdaki veya varsayılan link-extraction-watch.js'deki şablona
// uygun ekleyebilirsiniz. 

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const checkCustoms = link => {
    let extract = { link }

    // Aşağıdaki if bloku, sisteme iframe olarak vermeniz gereken siteler içindir. (VK vb.)
    // Varsayılan dosyada, VK vb. siteler dışında her sitenin hem aşağıdaki if bloğunda
    // hem de kendine özel if bloğunda tanımlı extraction fonksiyonu vardır. Yani kullanıcı hem iframe
    // koduyla, hem de normal linkle siteye ekleme yapabilir.
    if (link.match(/iframe/)) {
        // Lütfen aşağıdaki 2 satırı değiştirmeyin.
        const dom = new JSDOM(link)
        if (dom.window.document.getElementsByTagName('iframe')[0]) extract.src = dom.window.document.getElementsByTagName('iframe')[0].src
        // Lütfen aşağıdaki else bloğunu değiştirmeyin.
        else {
            return false
        }


        // Burayı düzenlemeniz gerekiyor. Sadece bir link ekleyecekseniz if bloğu
        // kullanabilirsiniz. Birden fazla ekleyecekseniz aşağıdaki düzene
        // else if blokları ekleyerek devam edebilirsiniz.
        // Döndürmeniz gereken objenin src'si zaten yukarda alınıyor. Sizin sadece
        // extract.type değerini vermeniz gerekiyor.
        if (extract.src.match(/custom1\.com/)) extract.type = 'custom1'
        else if (extract.src.match(/custom2\.com/)) extract.type = 'custom2'


        // Lütfen aşağıdaki else bloğunu değiştirmeyin.
        else {
            return false
        }
        return extract
    }


    // Linklere özel kontroller için aşağıdakine benzer bir şablon izleyebilirsiniz. Döndürmeniz
    // gereken objenin
    //  {
    //      src: ""     // String: Embed linki  
    //      type: ""    // String: Site ismi, hepsi küçük harfle
    //  }
    // düzeninde olması gerekiyor. Ekleyeceğiniz yeni blokları else if kullanarak ekleyebilirsiniz.
    else if (link.match(/custom1\.com/)) { // Sisteme girdiğimiz linkin https://custom1.com/video/vHqsyeQexK olduğunu varsayalım.
        const videoId = link.split('/')[4] // Yukardaki linki / işareti gördüğümüz yerde bölüyoruz, ve Array içerisindeki son elemente, yani video ID'sine ulaşıyoruz.
        extract.src = `//custom1.com/embed/${videoId}` // Yukarda eriştiğimiz video id'sinden embed linkini oluşturuyoruz. -- Not: Bu embed linki, her site için farklıdır.
        extract.type = 'custom1' // Sitenin ismini küçük harflerle yazıyoruz ve çıkaracağımız objenin "type" keyine eşitliyoruz.
        return extract // Objemizi döndürüyoruz
    }


    // Lütfen aşağıdaki else bloğunu değiştirmeyin.
    else {
        return false
    }
}

module.exports = checkCustoms