module.exports = (animename, episodenumber, specialtype) => {
    if (specialtype && specialtype != "toplu") {
        return {
            text: `${animename} ${specialtype} ${episodenumber}`,
            slug: `${specialtype}${episodenumber}`
        }
    }
    else return {
        text: `${animename} ${episodenumber}. Bölüm`,
        slug: `bolum${episodenumber}`
    }
}