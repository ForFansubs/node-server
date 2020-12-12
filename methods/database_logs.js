const { logFailError } = require('./console_logs')

const Sequelize = require('sequelize')

const { Anime, Manga, Log, Episode, MangaEpisode, DownloadLink, WatchLink, Permission, User } = require('../config/sequelize')

async function HandleDatabaseQuery(username, text, process_type) {
	return await Log.create({
		user: username,
		text: text,
		process_type: process_type,
		process: "success"
	})
}

async function LogAddAnime(props) {
	const process_type = "add-anime"

	const { username, anime_id } = props

	try {
		const { anime_id } = props
		const { name } = await Anime.findOne({ raw: true, where: { id: anime_id } })
		const text = `${username} isimli kullanıcı ${name} isimli animeyi ekledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, anime_id, err)
	}
}

async function LogUpdateAnime(props) {
	const process_type = "update-anime"

	const { username, anime_id } = props

	try {
		const { name } = await Anime.findOne({ raw: true, where: { id: anime_id } })
		const text = `${username} isimli kullanıcı ${name} isimli animeyi düzenledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, anime_id, err)
	}
}

async function LogDeleteAnime(props) {
	const process_type = "delete-anime"

	const { username, anime_name } = props

	try {
		const text = `${username} isimli kullanıcı ${anime_name} isimli animeyi sildi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, anime_name, err)
	}
}

async function LogFeaturedAnime(props) {
	const { process_type, username } = props

	try {
		const text = `${username} isimli kullanıcı öne çıkarılan animeleri değiştirdi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process, "", err)
	}
}

async function LogAddEpisode(props) {
	const process_type = "add-episode"

	const { username, episode_id } = props

	try {
		const { anime_name, episode_number, special_type } = await Episode.findOne({
			raw: true,
			where: { id: episode_id },
			attributes: [
				'episode_number',
				'special_type',
				[
					Sequelize.literal(`(
                        SELECT name
                        FROM anime
                        WHERE
                            id = episode.anime_id
                    )`),
					'anime_name'
				]
			]
		})
		const text = `${username} isimli kullanıcı ${anime_name} isimli animeye ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} ekledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, episode_id, err)
	}
}

async function LogUpdateEpisode(props) {
	const process_type = "update-episode"

	const { username, episode_id, can_user_download, request } = props

	try {
		const { anime_name, episode_number, special_type } = await Episode.findOne({
			raw: true,
			where: { id: episode_id },
			attributes: [
				'episode_number',
				'special_type',
				[
					Sequelize.literal(`(
                        SELECT name
                        FROM anime
                        WHERE
                            id = episode.anime_id
                    )`),
					'anime_name'
				]
			]
		})

		let text = ""

		switch (request) {
			case "update-visibility": {
				can_user_download === 1
					?
					text = `${username} isimli kullanıcı ${anime_name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} görünür yaptı.`
					:
					text = `${username} isimli kullanıcı ${anime_name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} görünmez yaptı.`
				break
			}
			case "update-data": {
				text = `${username} isimli kullanıcı ${anime_name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} güncelledi.`
				break
			}
			default: {
				text = `Geçersiz girdi.`
				break
			}
		}

		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, episode_id, err)
	}
}

async function LogDeleteEpisode(props) {
	const process_type = "delete-episode"

	const { username, anime_id, episode_number, special_type } = props

	try {
		const { name } = await Anime.findOne({ raw: true, where: { id: anime_id } })

		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} sildi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, anime_id, err)
	}
}

async function LogAddDownloadLink(props) {
	const process_type = "add-download-link"

	const { username, download_link_id } = props

	try {
		const { anime_name, episode_number, special_type, type } = await DownloadLink.findOne({
			raw: true,
			where: { id: download_link_id },
			attributes: [
				'type',
				[
					Sequelize.literal(`(
                        SELECT episode_number
                        FROM episode
                        WHERE
                            id = download_link.episode_id
                    )`),
					'episode_number'
				],
				[
					Sequelize.literal(`(
                        SELECT special_type
                        FROM episode
                        WHERE
                            id = download_link.episode_id
                    )`),
					'special_type'
				],
				[
					Sequelize.literal(`(
                        SELECT name
                        FROM anime
                        WHERE
                            id = download_link.anime_id
                    )`),
					'anime_name'
				]
			]
		})

		const text = `${username} isimli kullanıcı ${anime_name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümüne` : `${episode_number}. bölümüne`} ${type.toUpperCase()} indirme linkini ekledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, download_link_id, err)
	}
}

async function LogDeleteDownloadLink(props) {
	const process_type = "delete-download-link"

	const { username, episode_id, download_link_type } = props

	try {
		const { anime_name, episode_number, special_type } = await Episode.findOne({
			raw: true,
			where: { id: episode_id },
			attributes: [
				'episode_number',
				'special_type',
				[
					Sequelize.literal(`(
                        SELECT name
                        FROM anime
                        WHERE
                            id = episode.anime_id
                    )`),
					'anime_name'
				]
			]
		})

		const text = `${username} isimli kullanıcı ${anime_name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümündeki` : `${episode_number}. bölümündeki`} ${download_link_type.toUpperCase()} indirme linkini sildi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, episode_id, err)
	}
}

async function LogAddWatchLink(props) {
	const process_type = "add-watch-link"

	const { username, watch_link_id } = props

	try {
		const { anime_name, episode_number, special_type, type } = await WatchLink.findOne({
			raw: true,
			where: { id: watch_link_id },
			attributes: [
				'type',
				[
					Sequelize.literal(`(
                        SELECT episode_number
                        FROM episode
                        WHERE
                            id = watch_link.episode_id
                    )`),
					'episode_number'
				],
				[
					Sequelize.literal(`(
                        SELECT special_type
                        FROM episode
                        WHERE
                            id = watch_link.episode_id
                    )`),
					'special_type'
				],
				[
					Sequelize.literal(`(
                        SELECT name
                        FROM anime
                        WHERE
                            id = watch_link.anime_id
                    )`),
					'anime_name'
				]
			]
		})

		const text = `${username} isimli kullanıcı ${anime_name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümüne` : `${episode_number}. bölümüne`} ${type.toUpperCase()} izleme linkini ekledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, watch_link_id, err)
	}
}

async function LogDeleteWatchLink(props) {
	const process_type = "delete-watch-link"

	const { username, episode_id, watch_link_type } = props

	try {
		const { anime_name, episode_number, special_type } = await Episode.findOne({
			raw: true,
			where: { id: episode_id },
			attributes: [
				'episode_number',
				'special_type',
				[
					Sequelize.literal(`(
                        SELECT name
                        FROM anime
                        WHERE
                            id = episode.anime_id
                    )`),
					'anime_name'
				]
			]
		})

		const text = `${username} isimli kullanıcı ${anime_name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümündeki` : `${episode_number}. bölümündeki`} ${watch_link_type.toUpperCase()} izleme linkini sildi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, episode_id, err)
	}
}

async function LogAddManga(props) {
	const process_type = "add-manga"

	const { username, manga_id } = props

	try {
		const { name } = Manga.findOne({ where: { id: manga_id } })

		const text = `${username} isimli kullanıcı ${name} isimli mangayı ekledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, manga_id, err)
	}
}

async function LogUpdateManga(props) {
	const process_type = "update-manga"

	const { username, manga_id } = props

	try {
		const { name } = Manga.findOne({ where: { id: manga_id } })

		const text = `${username} isimli kullanıcı ${name} isimli mangayı düzenledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, manga_id, err)
	}
}

async function LogDeleteManga(props) {
	const process_type = "delete-manga"

	const { username, manga_name } = props

	try {
		const text = `${username} isimli kullanıcı ${manga_name} isimli mangayı sildi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, manga_name, err)
	}
}

async function LogFeaturedManga(props) {
	const { process_type, username } = props

	try {
		const text = `${username} isimli kullanıcı öne çıkarılan mangaları değiştirdi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process, "", err)
	}
}


async function LogAddMangaEpisode(props) {
	const process_type = "add-manga-episode"

	const { username, manga_episode_id } = props

	try {
		const { manga_name, episode_number } = await MangaEpisode.findOne({
			raw: true,
			attributes: [
				'*',
				[
					Sequelize.literal(`(
                    SELECT name
                    FROM manga
                    WHERE
                        id = manga_episode.manga_id
                )`),
					'manga_name'
				],
				[
					Sequelize.literal(`(
                    SELECT slug
                    FROM manga
                    WHERE
                        id = manga_episode.manga_id
                )`),
					'manga_slug'
				]
			], where: { id: manga_episode_id }
		})

		const text = `${username} isimli kullanıcı ${manga_name} isimli mangaya ${episode_number}. bölümü ekledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, manga_episode_id, err)
	}
}

async function LogUpdateMangaEpisode(props) {
	const process_type = "update-manga-episode"

	const { username, manga_episode_id } = props

	try {
		const { manga_name, episode_number } = await MangaEpisode.findOne({
			raw: true,
			attributes: [
				'*',
				[
					Sequelize.literal(`(
                    SELECT name
                    FROM manga
                    WHERE
                        id = manga_episode.manga_id
                )`),
					'manga_name'
				],
				[
					Sequelize.literal(`(
                    SELECT slug
                    FROM manga
                    WHERE
                        id = manga_episode.manga_id
                )`),
					'manga_slug'
				]
			], where: { id: manga_episode_id }
		})

		const text = `${username} isimli kullanıcı ${manga_name} isimli manganın ${episode_number}. bölümünü güncelledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, manga_episode_id, err)
	}
}

async function LogDeleteMangaEpisode(props) {
	const process_type = "delete-manga-episode"

	const { username, episode_number, manga_name } = props

	try {
		const text = `${username} isimli kullanıcı ${manga_name} isimli manganın ${episode_number}. bölümünü sildi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, manga_name, err)
	}
}

async function LogAddPermission(props) {
	const process_type = "add-permission"

	const { username, permission_id } = props

	try {
		const { name } = await Permission.findOne({ raw: true, where: { id: permission_id } })

		const text = `${username} isimli kullanıcı ${name} isimli yetkiyi ekledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, permission_id, err)
	}
}

async function LogUpdatePermission(props) {
	const process_type = "update-permission"

	const { username, permission_id } = props

	try {
		const { name } = await Permission.findOne({ raw: true, where: { id: permission_id } })

		const text = `${username} isimli kullanıcı ${name} isimli yetkiyi güncelledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, permission_id, err)
	}
}

async function LogDeletePermission(props) {
	const process_type = "delete-permission"

	const { username, permission_name } = props

	const text = `${username} isimli kullanıcı ${permission_name} isimli yetkiyi sildi.`
	try {
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, permission_name, err)
	}
}

async function LogAddUser(props) {
	const process_type = "add-user"

	const { username, user_id } = props

	try {
		const { name } = await User.findOne({ raw: true, where: { id: user_id } })

		const text = `${username} isimli kullanıcı ${name} isimli üyeyi ekledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, user_id, err)
	}
}

async function LogUpdateUser(props) {
	const process_type = "update-user"

	const { username, user_id } = props

	try {
		const { name } = await User.findOne({ raw: true, where: { id: user_id } })

		const text = `${username} isimli kullanıcı ${name} isimli kullanıcıyı güncelledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, user_id, err)
	}
}

async function LogDeleteUser(props) {
	const process_type = "delete-user"

	const { username, name } = props

	const text = `${username} isimli kullanıcı ${name} isimli üyeyi sildi.`
	try {
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, name, err)
	}
}

async function LogAddMotd(props) {
	const process_type = "add-motd"

	const { username, motd_id } = props

	try {
		const text = `${username} isimli kullanıcı ${motd_id} idli duyuruyu ekledi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, motd_id, err)
	}
}

async function LogUpdateMotd(props) {
	const process_type = "update-motd"

	const { username, motd_id } = props

	try {
		const text = `${username} isimli kullanıcı ${motd_id} idli duyurunun görünürlüğünü değiştirdi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, motd_id, err)
	}
}

async function LogDeleteMotd(props) {
	const process_type = "delete-motd"

	const { username, motd_id } = props

	try {
		const text = `${username} isimli kullanıcı ${motd_id} idli duyuruyu sildi.`
		await HandleDatabaseQuery(username, text, process_type)
	} catch (err) {
		logFailError(process_type, motd_id, err)
	}
}

module.exports = {
	LogAddAnime,
	LogUpdateAnime,
	LogDeleteAnime,
	LogFeaturedAnime,
	LogAddEpisode,
	LogUpdateEpisode,
	LogDeleteEpisode,
	LogAddDownloadLink,
	LogDeleteDownloadLink,
	LogAddWatchLink,
	LogDeleteWatchLink,
	LogAddManga,
	LogUpdateManga,
	LogDeleteManga,
	LogFeaturedManga,
	LogAddMangaEpisode,
	LogUpdateMangaEpisode,
	LogDeleteMangaEpisode,
	LogAddPermission,
	LogUpdatePermission,
	LogDeletePermission,
	LogAddUser,
	LogUpdateUser,
	LogDeleteUser,
	LogAddMotd,
	LogUpdateMotd,
	LogDeleteMotd
}