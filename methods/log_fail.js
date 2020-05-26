const mariadb = require("../config/maria");
const { logFailError } = require("./console_logs");

const log_fail = async (prop1, prop2, prop3, prop4, prop5) => {
	const process = prop1;
	const username = prop2;
	const documentId = prop3;
	let text;

	switch (process) {
		case "add-anime":
			text = `${username} isimli kullanıcı anime eklemeye çalıştı.`;
			try {
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "update-anime":
			try {
				const anime = await mariadb(`SELECT name FROM anime WHERE id=${documentId}`)
				const animeName = anime[0].name;
				const text = `${username} isimli kullanıcı ${animeName} isimli animeyi düzenlemeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "delete-anime":
			try {
				const anime = await mariadb(`SELECT name FROM anime WHERE id=${documentId}`)
				const animeName = anime[0].name;
				const text = `${username} isimli kullanıcı ${animeName} isimli animeyi silmeye çalıştı.`

				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "featured-anime":
			const text = `${username} isimli kullanıcı öne çıkarılan animeleri değiştirmeye çalıştı.`;

			try {
				mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "add-episode":
			try {
				const anime = await mariadb(`SELECT name FROM anime id="${documentId}"`)
				const animeName = anime[0].name;
				const episodeNumber = prop4;
				const specialType = prop5;
				const text = `${username} isimli kullanıcı ${animeName} isimli animeye ${
					specialType
						? `${specialType.toUpperCase()} ${episodeNumber} bölümünü`
						: `${episodeNumber}. bölümünü`
					} eklemeye çalıştı.`;
				mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "update-episode":
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`)
				const animeName = anime[0].name;
				const episodeNumber = anime[0].episode_number;
				const specialType = anime[0].special_type;
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümünün` : `${episodeNumber}. bölümünün`} görünürlüğünü değiştirmeye çalıştı.`
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "delete-episode":
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`)
				const animeName = anime[0].name;
				const episodeNumber = anime[0].episode_number;
				const specialType = anime[0].special_type;
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${specialType ? `${specialType.toUpperCase()} ${episodeNumber} bölümünü` : `${episodeNumber}. bölümünü`} silmeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "add-download-link":
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`)
				const animeName = anime[0].name;
				const episodeNumber = anime[0].episode_number;
				const specialType = anime[0].special_type;
				const linkType = prop4;
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${
					specialType
						? `${specialType.toUpperCase()} ${episodeNumber} bölümüne`
						: `${episodeNumber}. bölümüne`
					} ${linkType.toUpperCase()} indirme linkini eklemeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "delete-download-link":
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type, dl.type FROM anime as an INNER JOIN download_link as dl INNER JOIN episode as ep ON dl.episode_id = ep.id AND ep.anime_id = an.id WHERE dl.id="${documentId}"`)
				const animeName = anime[0].name;
				const episodeNumber = anime[0].episode_number;
				const specialType = anime[0].special_type;
				const linkType = anime[0].type;
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${
					specialType
						? `${specialType.toUpperCase()} ${episodeNumber} bölümündeki`
						: `${episodeNumber}. bölümündeki`
					} ${linkType.toUpperCase()} indirme linkini silmeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "add-watch-link":
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type FROM anime as an INNER JOIN episode as ep ON ep.anime_id = an.id WHERE ep.id="${documentId}"`)
				const animeName = anime[0].name;
				const episodeNumber = anime[0].episode_number;
				const specialType = anime[0].special_type;
				const linkType = prop4;
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${
					specialType
						? `${specialType.toUpperCase()} ${episodeNumber} bölümüne`
						: `${episodeNumber}. bölümüne`
					} ${linkType.toUpperCase()} izleme linkini eklemeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "delete-download-link":
			try {
				const anime = await mariadb(`SELECT an.name, ep.episode_number, ep.special_type, wl.type FROM anime as an INNER JOIN watch_link as wl INNER JOIN episode as ep ON wl.episode_id = ep.id AND ep.anime_id = an.id WHERE wl.id="${documentId}"`)
				const animeName = anime[0].name;
				const episodeNumber = anime[0].episode_number;
				const specialType = anime[0].special_type;
				const linkType = anime[0].type;
				const text = `${username} isimli kullanıcı ${animeName} isimli animenin ${
					specialType
						? `${specialType.toUpperCase()} ${episodeNumber} bölümündeki`
						: `${episodeNumber}. bölümündeki`
					} ${linkType.toUpperCase()} izleme linkini silmeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
		case "add-manga":
			text = `${username} isimli kullanıcı manga eklemeye çalıştı.`;
			try {
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "update-manga":
			try {
				const manga = await mariadb(`SELECT name FROM manga WHERE id=${documentId}`)
				const mangaName = manga[0].name;
				const text = `${username} isimli kullanıcı ${mangaName} isimli mangayı düzenlemeye çalıştı.`;
				mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "delete-manga":
			try {
				const manga = await mariadb(`SELECT name FROM manga WHERE id=${documentId}`)
				const mangaName = manga[0].name;
				const text = `${username} isimli kullanıcı ${mangaName} isimli mangayı silmeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "add-permission":
			const permissionName = prop4;
			text = `${username} isimli kullanıcı ${permissionName} isimli yetkiyi eklemeye çalıştı.`;
			try {
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "update-permission":
			try {
				const permission = await mariadb(`SELECT name FROM permission WHERE id=${documentId}`)
				const permissionName = permission[0].name;
				const text = `${username} isimli kullanıcı ${permissionName} isimli yetkiyi güncellemeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "delete-permission":
			try {
				const permission = await mariadb(`SELECT name FROM permission WHERE id=${documentId}`)
				const permissionName = permission[0].name;
				const text = `${username} isimli kullanıcı ${permissionName} isimli yetkiyi silmeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "add-user":
			const name = prop4;
			text = `${username} isimli kullanıcı ${name} isimli üyeyi eklemeye çalıştı.`;
			try {
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "update-user":
			try {
				const user = await mariadb(`SELECT name FROM user WHERE id=${documentId}`)
				const user_name = user[0].name;
				const text = `${username} isimli kullanıcı ${user_name} isimli üyeyi güncellemeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		case "delete-user":
			try {
				const user = await mariadb(`SELECT name FROM user WHERE id=${documentId}`)
				const name = user[0].name;
				const text = `${username} isimli kullanıcı ${name} isimli üyeyi silmeye çalıştı.`;
				await mariadb(`INSERT INTO log (user, text, process_type, process) VALUES ("${username}", "${text.replace(/([!@#$%^&*()+=\[\]\\';,./{}|":<>?~_-])/g, "\\$1")}", "${process}", "fail")`)
			} catch (err) {
				logFailError(process, documentId, err)
			}
			break;
		default:
			return false;
	}
};
module.exports = log_fail;
