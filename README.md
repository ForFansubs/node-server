# ForFansubs NodeApp - Back-end Repo
<p align="center">
<a href="https://github.com/ayberktandogan/ForFansubs-NodeApp---Back-End/blob/master/LICENSE"><img alt="GitHub license" src="https://img.shields.io/github/license/ayberktandogan/ForFansubs-NodeApp---Back-End?style=for-the-badge"> </a> <img alt="GitHub release" src="https://img.shields.io/github/release/ayberktandogan/ForFansubs-NodeApp---Back-End?style=for-the-badge"> </a>
<br/>
<img alt="GitHub package.json dependency version (prod)" src="https://img.shields.io/node/v/sharp?style=for-the-badge">
<img alt="GitHub package.json dependency version (prod)" src="https://img.shields.io/github/package-json/dependency-version/ayberktandogan/ForFansubs-NodeApp---Back-End/express?style=for-the-badge">
<img alt="GitHub package.json dependency version (prod)" src="https://img.shields.io/github/package-json/dependency-version/ayberktandogan/ForFansubs-NodeApp---Back-End/mariadb?style=for-the-badge"> 
<br/>
<img src="https://repository-images.githubusercontent.com/212566993/16902280-e5ef-11e9-9ed4-77af26c3f71a" alt="cover-image" width="1000px"/>
</p>

## Yükleme Talimatları
```
npm i
```

sonrasında da 

```
npm run server
npm run production
```

yazarak çalıştırabilirsiniz. Ancak startlamadan ya da buildlemeden önce aşağıda gereken dosyaları oluşturun.

### Gerekenler

#### 1. ./.env
```env
PORT=                       // Servisin çalışacağı port.
NODE_ENV=                   // Servisin çalışacağı enviroment.
SECRET_OR_KEY=              // Passportjs'in kullanacağı secret key.
DISCORD_ANIME_WH=           // Discord Anime kanalı Webhook
DISCORD_EPISODE_WH=         // Discord Bölüm kanalı Webhook
DISCORD_MANGA_WH=           // Discord Manga kanalı Webhook
DB_HOST=                    // MariaDB Host
DB_USER=                    // MariaDB Kullanıcı ismi
DB_NAME=                    // MariaDB Database ismi
DB_PASSWORD=                // MariaDB Kullanıcı şifre
DB_CONNECTION_LIMIT=100     // MariaDB bağlantı limit sayısı
CF_ZONEID=                  // CloudFlare cache temizleme API yolu, ZONEID
CF_EMAIL=                   // CloudFlare cache temizleme API yolu, EMAIL    
CF_APIKEY=                  // CloudFlare cache temizleme API yolu, APIKEY
```