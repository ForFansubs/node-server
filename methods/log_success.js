const mariadb = require('../config/maria')
const { logFailError } = require('./console_logs')

const cleanText = (text) => {
	return text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")
}

const log_success = async (prop1, prop2, prop3, prop4) => {
	const process = prop1
	const username = prop2
	const documentId = prop3
	let text

	switch (process) {
		case 'add-anime':
			try {
				const anime = await mariadb(`SELECT name FROM anime WHERE id=${documentId}`)
				const animeName = anime[0].name
				const text = `${username} isimli kullanıcı ${animeName} isimli animeyi ekledi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'update-anime':
			try {
				const anime = await mariadb(`SELECT name FROM anime WHERE id=${documentId}`)
				const animeName = anime[0].name
				const text = `${username} isimli kullanıcı ${animeName} isimli animeyi düzenledi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'delete-anime':
			try {
				const animeName = prop4
				text = `${username} isimli kullanıcı ${animeName} isimli animeyi sildi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'featured-anime':
			try {
				text = `${username} isimli kullanıcı öne çıkarılan animeleri değiştirdi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'add-episode':
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`)
				const animeName = anime[0].name
				const episodeNumber = anime[0].episode_number
				const specialType = anime[0].special_type
				const text = `${username} isimli kullanıcı ${animeName} isimli animeye ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümünü` : `${episodeNumber}. bölümünü`} ekledi.`
				mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "update-episode":
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`)
				let text = ""
				const animeName = anime[0].name;
				const episodeNumber = anime[0].episode_number;
				const specialType = anime[0].special_type;
				const value = prop4
				value === 1
					?
					text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümünü` : `${episodeNumber}. bölümünü`} görünür yaptı.`
					:
					text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümünü` : `${episodeNumber}. bölümünü`} görünmez yaptı.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'delete-episode':
			try {
				const anime = await mariadb(`SELECT name FROM anime WHERE id=${documentId}`)
				const animeName = anime[0].name
				const episodeNumber = prop4
				const specialType = prop5
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümünü` : `${episodeNumber}. bölümünü`} sildi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'add-download-link':
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type, dl.type FROM anime as an INNER JOIN download_link as dl INNER JOIN episode as ep ON dl.episode_id = ep.id AND ep.anime_id = an.id WHERE dl.id="${documentId}"`)
				const animeName = anime[0].name
				const episodeNumber = anime[0].episode_number
				const specialType = anime[0].special_type
				const linkType = anime[0].type
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümüne` : `${episodeNumber}. bölümüne`} ${linkType.toUpperCase()} indirme linkini ekledi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'delete-download-link':
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`)
				const animeName = anime[0].name
				const episodeNumber = anime[0].episode_number
				const specialType = anime[0].special_type
				const linkType = prop4
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümündeki` : `${episodeNumber}. bölümündeki`} ${linkType.toUpperCase()} indirme linkini sildi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'add-watch-link':
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type, wl.type FROM anime as an INNER JOIN watch_link as wl INNER JOIN episode as ep ON wl.episode_id = ep.id AND ep.anime_id = an.id WHERE wl.id="${documentId}"`)
				const animeName = anime[0].name
				const episodeNumber = anime[0].episode_number
				const specialType = anime[0].special_type
				const linkType = anime[0].type
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümüne` : `${episodeNumber}. bölümüne`} ${linkType.toUpperCase()} izleme linkini ekledi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'delete-watch-link':
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`)
				const animeName = anime[0].name
				const episodeNumber = anime[0].episode_number
				const specialType = anime[0].special_type
				const linkType = prop4
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümündeki` : `${episodeNumber}. bölümündeki`} ${linkType.toUpperCase()} izleme linkini sildi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'add-manga':
			try {
				const manga = await mariadb(`SELECT name FROM manga WHERE id=${documentId}`)
				const mangaName = manga[0].name
				const text = `${username} isimli kullanıcı ${mangaName} isimli mangayı ekledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'update-manga':
			try {
				const manga = await mariadb(`SELECT name FROM manga WHERE id=${documentId}`)
				const mangaName = manga[0].name
				const text = `${username} isimli kullanıcı ${mangaName} isimli mangayı düzenledi.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case 'delete-manga':
			const mangaName = prop4
			text = `${username} isimli kullanıcı ${mangaName} isimli mangayı sildi.`
			try {
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${cleanText(text)}", "${process}", "success")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
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
			const permissionName = prop4
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
			const name = prop4
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
module.exports = log_success