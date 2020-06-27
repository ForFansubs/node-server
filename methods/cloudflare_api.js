const axios = require('axios')

const ZONE_ID = process.env.CF_ZONEID

const header = {
    headers: {
        "X-Auth-Email": process.env.CF_EMAIL,
        "X-Auth-Key": process.env.CF_APIKEY,
        "Content-Type": "application/json"
    }
}

const deleteCache = (res) => {
    const data = {
        "purge_everything": true
    }

    axios.post(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, data, header)
        .then(_ => {
            res.status(200).json({ "ok": "ok" })
            console.log("CLOUDFLARE CACHE BAŞARIYLA TEMİZLENDİ.")
        }
        )
        .catch(err => console.log(err))
}

module.exports = { deleteCache }