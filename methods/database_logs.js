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
	const { process, username } = props

	try {
		text = `${username} isimli kullanıcı öne çıkarılan animeleri değiştirdi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
	} catch (err) {
		logFailError(process, "", err)
	}
}

async function LogAddEpisode(props) {
	const { process, username, episode_id } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${episode_id}"`)
		const { name, episode_number, special_type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animeye ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} ekledi.`
		mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
	} catch (err) {
		logFailError(process, episode_id, err)
	}
}

async function LogUpdateEpisode(props) {
	const { process, username, episode_id, can_user_download } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${episode_id}"`)
		let text = ""
		const { name, episode_number, special_type } = anime[0]

		can_user_download === 1
			?
			text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} görünür yaptı.`
			:
			text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} görünmez yaptı.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "fail")`)
	} catch (err) {
		logFailError(process, episode_id, err)
	}
}

async function LogDeleteEpisode(props) {
	const { process, username, anime_id, episode_number, special_type } = props

	try {
		const anime = await mariadb(`SELECT name FROM anime WHERE id=${anime_id}`)
		const { name } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} sildi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
	} catch (err) {
		logFailError(process, anime_id, err)
	}
}

async function LogAddDownloadLink(props) {
	const { process, username, download_link_id } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type, dl.type FROM anime as an INNER JOIN download_link as dl INNER JOIN episode as ep ON dl.episode_id = ep.id AND ep.anime_id = an.id WHERE dl.id="${download_link_id}"`)
		const { name, episode_number, special_type, type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümüne` : `${episode_number}. bölümüne`} ${type.toUpperCase()} indirme linkini ekledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
	} catch (err) {
		logFailError(process, download_link_id, err)
	}
}

async function LogDeleteDownloadLink(props) {
	const { process, username, episode_id, download_link_type } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${episode_id}"`)
		const { name, episode_number, special_type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümündeki` : `${episode_number}. bölümündeki`} ${download_link_type.toUpperCase()} indirme linkini sildi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
	} catch (err) {
		logFailError(process, episode_id, err)
	}
}

async function LogAddWatchLink(props) {
	const { process, username, watch_link_id } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type, wl.type FROM anime as an INNER JOIN watch_link as wl INNER JOIN episode as ep ON wl.episode_id = ep.id AND ep.anime_id = an.id WHERE wl.id="${documentId}"`)
		const { name, episode_number, special_type, type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümüne` : `${episode_number}. bölümüne`} ${type.toUpperCase()} izleme linkini ekledi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
	} catch (err) {
		logFailError(process, watch_link_id, err)
	}
}

async function LogDeleteWatchLink(props) {
	const { process, username, episode_id, watch_link_type } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${episode_id}"`)
		const { name, episode_number, special_type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümündeki` : `${episode_number}. bölümündeki`} ${watch_link_type.toUpperCase()} izleme linkini sildi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
	} catch (err) {
		logFailError(process, episode_id, err)
	}
}

async function LogAddManga(props) {
	const { process, username, manga_id } = props

	try {
		const manga = await mariadb(`SELECT name FROM manga WHERE id=${manga_id}`)
		const { name } = manga[0]
		const text = `${username} isimli kullanıcı ${name} isimli mangayı ekledi.`
		mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
	} catch (err) {
		logFailError(process, documentId, err)
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
	const { process, username, episode_id } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${episode_id}"`)
		const { name, episode_number, special_type } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animeye ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} ekledi.`
		mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
	} catch (err) {
		logFailError(process, episode_id, err)
	}
}

async function LogUpdateMangaEpisode(props) {
	const { process, username, episode_id, can_user_download } = props

	try {
		const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${episode_id}"`)
		let text = ""
		const { name, episode_number, special_type } = anime[0]

		can_user_download === 1
			?
			text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} görünür yaptı.`
			:
			text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} görünmez yaptı.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "fail")`)
	} catch (err) {
		logFailError(process, episode_id, err)
	}
}

async function LogDeleteMangaEpisode(props) {
	const { process, username, anime_id, episode_number, special_type } = props

	try {
		const anime = await mariadb(`SELECT name FROM anime WHERE id=${anime_id}`)
		const { name } = anime[0]
		const text = `${username} isimli kullanıcı ${name} isimli animenin ${special_type ? `${special_type.toUpperCase()} ${episode_number} bölümünü` : `${episode_number}. bölümünü`} sildi.`
		await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
	} catch (err) {
		logFailError(process, anime_id, err)
	}
}

/* async function LogAddAnime (props) {
	const { process, username } = props
} */

const log_success = async (props) => {
	let text
	switch (process) {
		case 'add-permission':
			try {
				const permission = await mariadb(`SELECT name FROM permission WHERE id=${documentId}`)
				const permissionName = permission[0].name
				const text = `${username} isimli kullanıcı ${permissionName} isimli yetkiyi ekledi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'update-permission':
			try {
				const permission = await mariadb(`SELECT name FROM permission WHERE id=${documentId}`)
				const permissionName = permission[0].name
				const text = `${username} isimli kullanıcı ${permissionName} isimli yetkiyi güncelledi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'delete-permission':
			const { permissionName } = props
			text = `${username} isimli kullanıcı ${permissionName} isimli yetkiyi sildi.`
			try {
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'add-user':
			try {
				const user = await mariadb(`SELECT name FROM user WHERE id=${documentId}`)
				const name = user[0].name
				const text = `${username} isimli kullanıcı ${name} isimli üyeyi ekledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'update-user':
			try {
				const user = await mariadb(`SELECT name FROM user WHERE id=${documentId}`)
				const user_name = user[0].name
				const text = `${username} isimli kullanıcı ${user_name} isimli kullanıcıyı güncelledi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'delete-user':
			const { name } = props
			text = `${username} isimli kullanıcı ${name} isimli üyeyi sildi.`
			try {
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		default:
			return false
			break;
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
	LogDeleteManga
}