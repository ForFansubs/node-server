const checkCustoms = require('./custom/link-extraction-download')

const downloadLinkExtract = link => {
    let extract = { link }
    if (link.match(/mega\.nz/)) {
        extract.type = "mega"
    }
    else if (link.match(/yadi\.sk/)) {
        extract.type = "yandex"
    }
    else if (link.match(/mail\.ru/)) {
        extract.type = "mail"
    }
    else if (link.match(/userscloud/)) {
        extract.type = "users"
    }
    else if (link.match(/pcloud/)) {
        extract.type = "pcloud"
    }
    else if (link.match(/1drv\.ms/) || link.match(/onedrive\.live/)) {
        extract.type = "onedrive"
    }
    else if (link.match(/drive\.google\.com/)) {
        extract.type = "gdrive"
    }
    else if (link.match(/mediafire\.com/)) {
        extract.type = "mediafire"
    }
    else if (link.match(/ddl\.to/)) {
        extract.type = "ddl.to"
    }
    else if (link.match(/https:\/\/oload\.life/)) {
        extract.type = "openload"
    }
    else if (link.match(/https:\/\/download\.ru/)) {
        extract.type = "download.ru"
    }
    else {
        return checkCustoms(link)
    }
    return extract
}

module.exports = downloadLinkExtract