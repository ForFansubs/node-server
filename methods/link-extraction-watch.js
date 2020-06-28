const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const watchLinkExtract = link => {
    let extract = {}
    if (link.match(/iframe/)) {
        const dom = new JSDOM(link)
        if (dom.window.document.getElementsByTagName('iframe')[0]) extract.src = dom.window.document.getElementsByTagName('iframe')[0].src
        else return false
        if (extract.src.match(/vk\.com/)) extract.type = 'vk'
        else if (extract.src.match(/tune\.pk/)) extract.type = 'tune'
        else if (extract.src.match(/sendvid\.com/)) extract.type = 'sendvid'
        else if (link.match(/oload\.life/)) extract.type = 'openload'
        else if (extract.src.match(/video\.sibnet\.ru/)) extract.type = 'sibnet'
        else if (extract.src.match(/drive\.google\.com/)) extract.type = 'gdrive'
        else if (extract.src.match(/ok\.ru/)) extract.type = 'ok\.ru'
        else if (link.match(/dailymotion\.com/) || link.match(/dai\.ly/)) extract.type = 'dailymotion'
        else if (extract.src.match(/my.mail\.ru/)) extract.type = 'mail\.ru'
        else if (extract.src.match(/youtube/) || extract.src.match(/youtu.be/)) extract.type = 'youtube'
        else if (extract.src.match(/mega\.nz/)) extract.type = 'mega'
        else if (extract.src.match(/myvi\.ru/)) extract.type = 'myvi'
        else if (link.match(/mp4upload\.com/)) extract.type = 'mp4upload'
        else if (link.match(/cloudvideo\.tv/)) extract.type = 'cloudvideo'
        else if (link.match(/hdvid\.tv/)) extract.type = 'hdvid'
        else if (link.match(/rapidvideo\.com/) || link.match(/rapidvid\.to/)) extract.type = 'rapidvideo'
        else if (link.match(/streamango\.com/)) extract.type = 'streamango'
        else if (link.match(/userscloud\.com/)) extract.type = 'userscloud'
        else if (link.match(/yourupload\.com/)) extract.type = 'yourupload'
        else if (link.match(/www\.fembed\.com/)) extract.type = 'fembed'
        else if (link.match(/www\.rutube\.ru/)) extract.type = 'rutube'
        else if (link.match(/vidfast\.co/)) extract.type = 'vidfast'
        else if (link.match(/vidia\.tv/)) extract.type = 'vidia'
        else if (link.match(/vidsat\.net/)) extract.type = 'vidsat'
        else if (link.match(/supervideo\.tv/)) extract.type = 'supervideo'
        else if (link.match(/clipwatching\.com/)) extract.type = 'clipwatching'
        else if (link.match(/jetload\.net/)) extract.type = 'jetload'
        else if (link.match(/fastplay\.to/)) extract.type = 'fastplay'
        else if (link.match(/streamwire\.net/)) extract.type = 'streamwire'
        else return false
        return extract
    }
    else if (link.match(/oload\.life/)) {
        const videoId = link.split('/')[4]
        extract.src = `//openload.co/embed/${videoId}`
        extract.type = 'openload'
        return extract
    }
    else if (link.match(/video\.sibnet\.ru/)) {
        const videoId = link.replace('https://video.sibnet.ru/video', '')
        extract.src = `//video.sibnet.ru/shell.php?videoid=${videoId}&share=1`
        extract.type = 'sibnet'
        return extract
    }
    else if (link.match(/drive\.google\.com/)) {
        extract.src = link.replace('view', 'preview')
        extract.type = 'gdrive'
        return extract
    }
    else if (link.match(/ok\.ru/)) {
        const videoId = link.replace('https://ok.ru/video/', '')
        extract.src = `//ok.ru/videoembed/${videoId}`
        extract.type = 'ok.ru'
        return extract
    }
    else if (link.match(/my.mail\.ru/)) {
        extract.src = link.replace('/video/', '/video/embed/').replace('https:', '').replace('.html', '')
        extract.type = 'mail.ru'
        return extract
    }
    else if (link.match(/dailymotion\.com/) || link.match(/dai\.ly/)) {
        let videoId
        if (link.match(/dailymotion\.com/)) videoId = link.split('/')[4]
        else videoId = link.split('/')[3]
        extract.src = `//www.dailymotion.com/embed/video/${videoId}`
        extract.type = 'dailymotion'
        return extract
    }
    else if (link.match(/tune\.pk/)) {
        const videoId = link.split('/')[4]
        extract.src = `//tune.pk/player/embed_player.php?vid=${videoId}`
        extract.type = 'tune'
        return extract
    }
    else if (link.match(/sendvid\.com/)) {
        if (link.match("/embed/")) {
            const videoId = link.split('/')[4]
            extract.src = `//sendvid.com/embed/${videoId}`
            extract.type = 'sendvid'
        }
        else {
            const videoId = link.split('/')[3]
            extract.src = `//sendvid.com/embed/${videoId}`
            extract.type = 'sendvid'
        }
        return extract
    }
    else if (link.match(/youtube/)) {
        extract.src = link.replace('https://www.youtube.com/watch?v=', '//www.youtube.com/embed/')
        extract.type = 'youtube'
        return extract
    }
    else if (link.match(/youtu.be/)) {
        extract.src = link.replace('https://youtu.be/', '//www.youtube.com/embed/')
        extract.type = 'youtube'
        return extract
    }
    else if (link.match(/mega\.nz/)) {
        extract.src = link.replace('https://mega.nz/#', '//mega.nz/embed#')
        extract.type = 'mega'
        return extract
    }
    else if (link.match(/mp4upload\.com/)) {
        const videoId = link.split('/')[3]
        extract.src = `//www.mp4upload.com/embed-${videoId}.html`
        extract.type = 'mp4upload'
        return extract
    }
    else if (link.match(/rutube\.ru/)) {
        const videoId = link.split('/')[4]
        extract.src = `//rutube.ru/play/embed/${videoId}?autoStart=false&wmode=transparent`
        extract.type = 'rutube'
        return extract
    }
    else if (link.match(/cloudvideo\.tv/)) {
        const videoId = link.split('/')[3]
        extract.src = `//cloudvideo.tv/embed-${videoId}.html`
        extract.type = 'cloudvideo'
        return extract
    }
    else if (link.match(/hdvid\.tv/)) {
        const videoId = link.split('/')[3]
        extract.src = `//www.hdvid.tv/embed-${videoId}`
        extract.type = 'hdvid'
        return extract
    }
    else if (link.match(/rapidvideo\.com/) || link.match(/rapidvid\.to/)) {
        extract.src = link.replace('/v/', '/embed/')
        extract.type = 'rapidvideo'
        return extract
    }
    else if (link.match(/streamango\.com/)) {
        const videoId = link.split('/')[4]
        extract.src = `//streamango.com/embed/${videoId}`
        extract.type = 'streamango'
        return extract
    }
    else if (link.match(/userscloud\.com/)) {
        const videoId = link.split('/')[3]
        extract.src = `//www.userscloud.com/embed-${videoId}.html`
        extract.type = 'userscloud'
        return extract
    }
    else if (link.match(/yourupload\.com/)) {
        extract.src = link.replace('/watch/', '/embed/')
        extract.type = 'yourupload'
        return extract
    }
    else if (link.match(/www\.fembed\.com/)) {
        const videoId = link.split('/')[4]
        extract.src = `//www.fembed.com/v/${videoId}`
        extract.type = 'fembed'
        return extract
    }
    else if (link.match(/vidfast\.co/)) {
        const videoId = link.split('/')[3].replace('.html', '').replace("embed-", '')
        extract.src = `https://vidfast.co/embed-${videoId}.html`
        extract.type = 'vidfast'
        return extract
    }
    else if (link.match(/vidia\.tv/)) {
        const videoId = link.split('/')[3].replace('.html', '').replace("embed-", '')
        extract.src = `https://vidia.tv/embed-${videoId}.html`
        extract.type = 'vidia'
        return extract
    }
    else if (link.match(/vidsat\.net/)) {
        const videoId = link.split('/')[3].replace('.html', '').replace("embed-", '')
        extract.src = `https://vidsat.net/embed-${videoId}.html`
        extract.type = 'vidsat'
        return extract
    }
    else if (link.match(/supervideo\.tv/)) {
        let videoId
        if (link.split('/')[3] === "e") {
            extract.src = link
            extract.type = 'supervideo'
            return extract
        }
        else videoId = link.split('/')[3]
        extract.src = `https://supervideo.tv/e/${videoId}`
        extract.type = 'supervideo'
        return extract
    }
    else if (link.match(/clipwatching\.com/)) {
        const videoId = link.split('/')[3].replace('.html', '').replace("embed-", '')
        extract.src = `https://clipwatching.com/embed-${videoId}.html`
        extract.type = 'clipwatching'
        return extract
    }
    else if (link.match(/jetload\.net/)) {
        const videoId = link.split('/')[4]
        extract.src = `https://jetload.net/e/${videoId}`
        extract.type = 'jetload'
        return extract
    }
    else if (link.match(/fastplay\.to/)) {
        extract.src = link
        extract.type = 'fastplay'
        return extract
    }
    else if (link.match(/mystream\.to/)) {
        const videoId = link.split('/')[4]
        extract.src = `https://embed.mystream.to/${videoId}`
        extract.type = 'mystream'
        return extract
    }
    else if (link.match(/streamwire\.net/)) {
        const videoId = link.split('/')[3]
        extract.src = `https://streamwire.net/e/${videoId}`
        extract.type = 'streamwire'
        return extract
    }
    else {
        return false
    }
}

module.exports = watchLinkExtract