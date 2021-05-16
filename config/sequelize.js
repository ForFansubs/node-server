const Sequelize = require('sequelize');

// Option 1: Passing parameters separately
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mariadb',
    dialectOptions: {
        timezone: 'Etc/GMT+3',
    },
    logging: process.env.NODE_ENV === "production" ? false : (msg) => {
        console.log(" ")
        console.info("\x1b[36m############\x1b[33mSEQUELIZE QUERY\x1b[36m############")
        console.info(msg)
        console.info("\x1b[36m#########\x1b[33mEND OFSEQUELIZE QUERY\x1b[36m#########")
        console.log(" ")
    },
    pool: {
        max: Number(process.env.DB_CONNECTION_MAX),
        min: Number(process.env.DB_CONNECTION_MIN),
        acquire: 30000,
        idle: 10000
    }
})

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize


// Define models
db.User = require('../db/models/User')(sequelize, Sequelize)
db.Anime = require('../db/models/Anime')(sequelize, Sequelize)
db.Manga = require('../db/models/Manga')(sequelize, Sequelize)
db.Episode = require('../db/models/Episode')(sequelize, Sequelize)
db.MangaEpisode = require('../db/models/MangaEpisode')(sequelize, Sequelize)
db.Motd = require('../db/models/Motd')(sequelize, Sequelize)
db.PendingUser = require('../db/models/PendingUser')(sequelize, Sequelize)
db.Permission = require('../db/models/Permission')(sequelize, Sequelize)
db.DownloadLink = require('../db/models/DownloadLink')(sequelize, Sequelize)
db.WatchLink = require('../db/models/WatchLink')(sequelize, Sequelize)
db.Log = require('../db/models/Log')(sequelize, Sequelize)

// Define relations
db.Anime.hasMany(db.Episode, { as: "episodes", foreignKey: "anime_id" })
db.Episode.belongsTo(db.Anime, { foreignKey: "anime_id" })

db.Anime.hasMany(db.DownloadLink, { as: "download_links_anime", foreignKey: "anime_id" })
db.DownloadLink.belongsTo(db.Anime, { foreignKey: "anime_id" })

db.Anime.hasMany(db.WatchLink, { as: "watch_links", foreignKey: "anime_id" })
db.WatchLink.belongsTo(db.Anime, { foreignKey: "anime_id" })

db.Manga.hasMany(db.MangaEpisode, { as: "manga_episodes", foreignKey: "manga_id" })
db.MangaEpisode.belongsTo(db.Manga, { foreignKey: "manga_id" })

db.Episode.hasMany(db.DownloadLink, { as: "download_links_episode", foreignKey: "episode_id" })
db.DownloadLink.belongsTo(db.Episode, { foreignKey: "episode_id" })

db.Episode.hasMany(db.WatchLink, { as: "watch_links", foreignKey: "episode_id" })
db.WatchLink.belongsTo(db.Episode, { foreignKey: "episode_id" })

db.User.hasMany(db.Anime, { as: "user_anime", foreignKey: "created_by" })
db.User.hasMany(db.Manga, { as: "user_manga", foreignKey: "created_by" })
db.User.hasMany(db.Episode, { as: "user_episodes", foreignKey: "created_by" })
db.User.hasMany(db.MangaEpisode, { as: "user_manga_episodes", foreignKey: "created_by" })
db.User.hasMany(db.Motd, { as: "user_motds", foreignKey: "created_by" })
db.User.hasOne(db.PendingUser, { as: "user_pending_users", foreignKey: "user_id" })
db.User.hasMany(db.DownloadLink, { as: "user_download_links", foreignKey: "created_by" })
db.User.hasMany(db.WatchLink, { as: "user_watch_links", foreignKey: "created_by" })

db.Anime.belongsTo(db.User, { as: "createdBy", foreignKey: "created_by" })
db.Manga.belongsTo(db.User, { foreignKey: "created_by" })
db.Episode.belongsTo(db.User, { foreignKey: "created_by" })
db.MangaEpisode.belongsTo(db.User, { foreignKey: "created_by" })
db.Motd.belongsTo(db.User, { foreignKey: "created_by" })
db.PendingUser.belongsTo(db.User, { foreignKey: "user_id" })
db.DownloadLink.belongsTo(db.User, { foreignKey: "created_by" })
db.WatchLink.belongsTo(db.User, { foreignKey: "created_by" })

module.exports = db