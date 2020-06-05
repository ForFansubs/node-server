const mariadb = require('../config/maria')
const { logFailError } = require('./console_logs')

const cleanText = (text) => {
	return text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
}

async function LogAddAnime(props) {
	const { process_type, username, anime_id } = props

	try {
		const { anime_id } = props
		const anime = await mariadb(`SELECT name FROM anime WHERE id=${anime_id}`)
		const { name } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animeyi ekledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, anime_id, err)
	}
}

async function LogUpdateAnime(props) {
	const { process_type, username, anime_id } = props

	try {
		const anime = await mariadb(`SELECT name FROM anime WHERE id=${anime_id}`)
		const { name } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animeyi düzenledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, anime_id, err)
	}
}

async function LogDeleteAnime(props) {
	const { process_type, username, anime_name } = props

	try {
		const text = `${username} isimli kullanıcı ${anime_name} isimli animeyi sildi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, anime_name, err)
	}
}

async function LogFeaturedAnime(props) {
	const { process_type, username } = props

	try {
		text = `${username} isimli kullanıcı öne çıkarılan animeleri değiştirdi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process, "", err)
	}
}

async function LogAddEpisode(props) {
	const { process_type, username, episode_id } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${episode_id}"`)
		const { name, episode_number, special_type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animeye ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} ekledi.`
		mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, episode_id, err)
	}
}

async function LogUpdateEpisode(props) {
	const { process_type, username, episode_id, can_user_download, request } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${episode_id}"`)
		let text = ""
		const { name, episode_number, special_type } = anime[0]

		switch (request) {
			case "update-visibility": {
				can_user_download === 1
					?
					text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} görünür yaptı.`
					:
					text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} görünmez yaptı.`
				break
			}
			case "update-data": {
				text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} güncelledi.`
				break
			}
			default: {
				text = `Geçersiz girdi.`
				break
			}
		}

		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, episode_id, err)
	}
}

async function LogDeleteEpisode(props) {
	const { process_type, username, anime_id, episode_number, special_type } = props

	try {
		const anime = await mariadb(`SELECT name FROM anime WHERE id=${anime_id}`)
		const { name } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} sildi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, anime_id, err)
	}
}

async function LogAddDownloadLink(props) {
	const { process_type, username, download_link_id } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type, dl.type FROM anime as an INNER JOIN download_link as dl INNER JOIN episode as ep ON dl.episode_id = ep.id AND ep.anime_id = an.id WHERE dl.id="${download_link_id}"`)
		const { name, episode_number, special_type, type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümüne` : `${episode_number}. bölümüne`} ${type.toUpperCase()} indirme linkini ekledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, download_link_id, err)
	}
}

async function LogDeleteDownloadLink(props) {
	const { process_type, username, episode_id, download_link_type } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${episode_id}"`)
		const { name, episode_number, special_type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümündeki` : `${episode_number}. bölümündeki`} ${download_link_type.toUpperCase()} indirme linkini sildi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, episode_id, err)
	}
}

async function LogAddWatchLink(props) {
	const { process_type, username, watch_link_id } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type, wl.type FROM anime as an INNER JOIN watch_link as wl INNER JOIN episode as ep ON wl.episode_id = ep.id AND ep.anime_id = an.id WHERE wl.id="${watch_link_id}"`)
		const { name, episode_number, special_type, type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümüne` : `${episode_number}. bölümüne`} ${type.toUpperCase()} izleme linkini ekledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, watch_link_id, err)
	}
}

async function LogDeleteWatchLink(props) {
	const { process_type, username, episode_id, watch_link_type } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${episode_id}"`)
		const { name, episode_number, special_type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümündeki` : `${episode_number}. bölümündeki`} ${watch_link_type.toUpperCase()} izleme linkini sildi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, episode_id, err)
	}
}

async function LogAddManga(props) {
	const { process_type, username, manga_id } = props

	try {
		const manga = await mariadb(`SELECT name FROM manga WHERE id=${manga_id}`)
		const { name } = manga[0]
		const text = `${username} isimli kullanıcı ${name} isimli mangayı ekledi.`
		mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, manga_id, err)
	}
}

async function LogUpdateManga(props) {
	const { process_type, username, manga_id } = props

	try {
		const manga = await mariadb(`SELECT name FROM manga WHERE id=${manga_id}`)
		const { name } = manga[0]
		const text = `${username} isimli kullanıcı ${name} isimli mangayı düzenledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, manga_id, err)
	}
}

async function LogDeleteManga(props) {
	const { process_type, username, manga_name } = props

	try {
		const text = `${username} isimli kullanıcı ${manga_name} isimli mangayı sildi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, manga_name, err)
	}
}

async function LogAddMangaEpisode(props) {
	const { process_type, username, manga_episode_id } = props

	try {
		const manga = await mariadb(`SELECT id, episode_number, (SELECT name FROM manga WHERE id=manga_episode.manga_id) as manga_name FROM manga_episode WHERE id=${manga_episode_id}`)
		const { episode_number, manga_name } = manga[0]
		const text = `${username} isimli kullanıcı ${manga_name} isimli mangaya ${episode_number}. bölümü ekledi.`
		mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, manga_episode_id, err)
	}
}

async function LogUpdateMangaEpisode(props) {
	const { process_type, username, manga_episode_id } = props

	try {
		const manga = await mariadb(`SELECT id, episode_number, (SELECT name FROM manga WHERE id=manga_episode.manga_id) as manga_name FROM manga_episode WHERE id=${manga_episode_id}`)
		const { episode_number, manga_name } = manga[0]
		const text = `${username} isimli kullanıcı ${manga_name} isimli manganın ${episode_number}. bölümünü güncelledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, manga_episode_id, err)
	}
}

async function LogDeleteMangaEpisode(props) {
	const { process_type, username, episode_number, manga_name } = props

	try {
		const text = `${username} isimli kullanıcı ${manga_name} isimli manganın ${episode_number}. bölümünü sildi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, manga_name, err)
	}
}

async function LogAddPermission(props) {
	const { process_type, username, permission_id } = props

	try {
		const permission = await mariadb(`SELECT name FROM permission WHERE id=${permission_id}`)
		const { name } = permission[0]
		const text = `${username} isimli kullanıcı ${name} isimli yetkiyi ekledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, permission_id, err)
	}
}

async function LogUpdatePermission(props) {
	const { process_type, username, permission_id } = props

	try {
		const permission = await mariadb(`SELECT name FROM permission WHERE id=${permission_id}`)
		const { name } = permission[0]
		const text = `${username} isimli kullanıcı ${name} isimli yetkiyi güncelledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, permission_id, err)
	}
}

async function LogDeletePermission(props) {
	const { process_type, username, permission_name } = props

	text = `${username} isimli kullanıcı ${permission_name} isimli yetkiyi sildi.`
	try {
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, permission_name, err)
	}
}

async function LogAddUser(props) {
	const { process_type, username, user_id } = props

	try {
		const user = await mariadb(`SELECT name FROM user WHERE id=${user_id}`)
		const { name } = user[0]
		const text = `${username} isimli kullanıcı ${name} isimli üyeyi ekledi.`
		mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, user_id, err)
	}
}

async function LogUpdateUser(props) {
	const { process_type, username, user_id } = props

	try {
		const user = await mariadb(`SELECT name FROM user WHERE id=${user_id}`)
		const { name } = user[0]
		const text = `${username} isimli kullanıcı ${name} isimli kullanıcıyı güncelledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, user_id, err)
	}
}

async function LogDeleteUser(props) {
	const { process_type, username, name } = props

	text = `${username} isimli kullanıcı ${name} isimli üyeyi sildi.`
	try {
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process_type}", "success")`)
	} catch (err) {
		logFailError(process_type, name, err)
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
	LogAddMangaEpisode,
	LogUpdateMangaEpisode,
	LogDeleteMangaEpisode,
	LogAddPermission,
	LogUpdatePermission,
	LogDeletePermission,
	LogAddUser,
	LogUpdateUser,
	LogDeleteUser
}