const mariadb = require('./maria')

const log_success = (prop1, prop2, prop3, prop4) => {
	const process = prop1
	const username = prop2
	const documentId = prop3
	let text

	switch (process) {
		case 'add-anime':
			mariadb.query(`SELECT name FROM anime WHERE id=${documentId}`).then(anime => {
				const animeName = anime[0].name
				const text = `${username} isimli kullanıcı ${animeName} isimli animeyi ekledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'update-anime':
			mariadb.query(`SELECT name FROM anime WHERE id=${documentId}`).then(anime => {
				const animeName = anime[0].name
				const text = `${username} isimli kullanıcı ${animeName} isimli animeyi düzenledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'delete-anime':
			const animeName = prop4
			text = `${username} isimli kullanıcı ${animeName} isimli animeyi sildi.`
			mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'featured-anime':
			text = `${username} isimli kullanıcı öne çıkarılan animeleri değiştirdi.`
			mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'add-episode':
			mariadb.query(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`).then(anime => {
				const animeName = anime[0].name
				const episodeNumber = anime[0].episode_number
				const specialType = anime[0].special_type
				const text = `${username} isimli kullanıcı ${animeName} isimli animeye ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümünü` : `${episodeNumber}. bölümünü`} ekledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case "update-episode":
			mariadb.query(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`)
				.then(anime => {
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
					mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
						.catch(err => console.log(err));
				})
				.catch(err => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}-success\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'delete-episode':
			mariadb.query(`SELECT name FROM anime WHERE id=${documentId}`).then(anime => {
				const animeName = anime[0].name
				const episodeNumber = prop4
				const specialType = prop5
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümünü` : `${episodeNumber}. bölümünü`} sildi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'add-download-link':
			mariadb.query(`SELECT an.name, ep.episode_number, ep.special_type, dl.type FROM anime as an INNER JOIN download_link as dl INNER JOIN episode as ep ON dl.episode_id = ep.id AND ep.anime_id = an.id WHERE dl.id="${documentId}"`).then(anime => {
				const animeName = anime[0].name
				const episodeNumber = anime[0].episode_number
				const specialType = anime[0].special_type
				const linkType = anime[0].type
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümüne` : `${episodeNumber}. bölümüne`} ${linkType.toUpperCase()} indirme linkini ekledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'delete-download-link':
			mariadb.query(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`).then(anime => {
				const animeName = anime[0].name
				const episodeNumber = anime[0].episode_number
				const specialType = anime[0].special_type
				const linkType = prop4
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümündeki` : `${episodeNumber}. bölümündeki`} ${linkType.toUpperCase()} indirme linkini sildi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'add-watch-link':
			mariadb.query(`SELECT an.name, ep.episode_number, ep.special_type, wl.type FROM anime as an INNER JOIN watch_link as wl INNER JOIN episode as ep ON wl.episode_id = ep.id AND ep.anime_id = an.id WHERE wl.id="${documentId}"`).then(anime => {
				const animeName = anime[0].name
				const episodeNumber = anime[0].episode_number
				const specialType = anime[0].special_type
				const linkType = anime[0].type
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümüne` : `${episodeNumber}. bölümüne`} ${linkType.toUpperCase()} izleme linkini ekledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'delete-watch-link':
			mariadb.query(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`).then(anime => {
				const animeName = anime[0].name
				const episodeNumber = anime[0].episode_number
				const specialType = anime[0].special_type
				const linkType = prop4
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümündeki` : `${episodeNumber}. bölümündeki`} ${linkType.toUpperCase()} izleme linkini sildi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'add-manga':
			mariadb.query(`SELECT name FROM manga WHERE id=${documentId}`).then(manga => {
				const mangaName = manga[0].name
				const text = `${username} isimli kullanıcı ${mangaName} isimli mangayı ekledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'update-manga':
			mariadb.query(`SELECT name FROM manga WHERE id=${documentId}`).then(manga => {
				const mangaName = manga[0].name
				const text = `${username} isimli kullanıcı ${mangaName} isimli mangayı düzenledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'delete-manga':
			const mangaName = prop4
			text = `${username} isimli kullanıcı ${mangaName} isimli mangayı sildi.`
			mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'add-permission':
			mariadb.query(`SELECT name FROM permission WHERE id=${documentId}`).then(permission => {
				const permissionName = permission[0].name
				const text = `${username} isimli kullanıcı ${permissionName} isimli yetkiyi ekledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'update-permission':
			mariadb.query(`SELECT name FROM permission WHERE id=${documentId}`).then(permission => {
				const permissionName = permission[0].name
				const text = `${username} isimli kullanıcı ${permissionName} isimli yetkiyi güncelledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'delete-permission':
			const permissionName = prop4
			text = `${username} isimli kullanıcı ${permissionName} isimli yetkiyi sildi.`
			mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'add-user':
			mariadb.query(`SELECT name FROM user WHERE id=${documentId}`).then(permission => {
				const name = permission[0].name
				const text = `${username} isimli kullanıcı ${name} isimli üyeyi ekledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'update-user':
			mariadb.query(`SELECT name FROM user WHERE id=${documentId}`).then(user => {
				const user_name = user[0].name
				const text = `${username} isimli kullanıcı ${user_name} isimli kullanıcıyı güncelledi.`
				mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
					.catch(err => console.log(err))
			})
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		case 'delete-user':
			const name = prop4
			text = `${username} isimli kullanıcı ${name} isimli üyeyi sildi.`
			mariadb.query(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "success")`)
				.catch(_ => console.log(`Loglara kayıt ederken hata.\nOlay yeri: ${process}\nSorunu çıkaran girdi: ${documentId}`))
			break;
		default:
			return false
			break;
	}
}
module.exports = log_success