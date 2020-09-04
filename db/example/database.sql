-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.12-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             11.0.0.5919
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dumping database structure for ffs_nodejs
CREATE DATABASE IF NOT EXISTS `ffs_nodejs` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `ffs_nodejs`;

-- Dumping structure for table ffs_nodejs.anime
CREATE TABLE IF NOT EXISTS `anime` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` char(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `version` char(11) NOT NULL DEFAULT 'tv',
  `pv` char(255) DEFAULT '',
  `series_status` char(50) NOT NULL DEFAULT 'Tamamlandı',
  `trans_status` char(50) NOT NULL DEFAULT 'Tamamlandı',
  `name` char(100) NOT NULL,
  `synopsis` text DEFAULT '',
  `translators` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '',
  `encoders` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '',
  `studios` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '',
  `cover_art` char(255) NOT NULL,
  `mal_link` char(100) NOT NULL,
  `episode_count` int(11) NOT NULL DEFAULT 0,
  `genres` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `release_date` datetime NOT NULL,
  `premiered` char(50) DEFAULT '',
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table ffs_nodejs.download_link
CREATE TABLE IF NOT EXISTS `download_link` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `anime_id` int(11) NOT NULL,
  `episode_id` int(11) NOT NULL,
  `type` char(50) NOT NULL,
  `link` char(255) NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `link` (`link`),
  KEY `anime_id` (`anime_id`),
  KEY `episode_id` (`episode_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table ffs_nodejs.episode
CREATE TABLE IF NOT EXISTS `episode` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `anime_id` int(11) NOT NULL,
  `episode_number` char(11) DEFAULT '0',
  `special_type` char(10) DEFAULT NULL,
  `credits` char(255) DEFAULT NULL,
  `can_user_download` tinyint(4) NOT NULL DEFAULT 1,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `anime_id` (`anime_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table ffs_nodejs.log
CREATE TABLE IF NOT EXISTS `log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` char(255) NOT NULL,
  `process_type` char(255) NOT NULL,
  `process` char(20) NOT NULL,
  `text` char(255) NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table ffs_nodejs.manga
CREATE TABLE IF NOT EXISTS `manga` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` char(255) NOT NULL,
  `name` char(100) NOT NULL,
  `synopsis` text DEFAULT NULL,
  `series_status` char(50) NOT NULL DEFAULT 'Tamamlandı',
  `trans_status` char(50) NOT NULL DEFAULT 'Tamamlandı',
  `translators` char(255) DEFAULT NULL,
  `editors` char(255) DEFAULT NULL,
  `authors` char(255) DEFAULT NULL,
  `cover_art` char(255) NOT NULL,
  `mal_link` char(255) NOT NULL,
  `reader_link` char(255) DEFAULT NULL,
  `download_link` char(255) DEFAULT NULL,
  `genres` char(255) NOT NULL,
  `release_date` datetime NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table ffs_nodejs.manga_episode
CREATE TABLE IF NOT EXISTS `manga_episode` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `manga_id` int(11) NOT NULL,
  `episode_number` varchar(50) NOT NULL,
  `episode_name` varchar(255) DEFAULT NULL,
  `credits` char(255) DEFAULT NULL,
  `pages` longtext NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table ffs_nodejs.motd
CREATE TABLE IF NOT EXISTS `motd` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `can_user_dismiss` tinyint(4) DEFAULT 1,
  `title` text DEFAULT NULL,
  `subtitle` text NOT NULL,
  `content_type` char(50) DEFAULT NULL,
  `content_id` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table ffs_nodejs.pending_user
CREATE TABLE IF NOT EXISTS `pending_user` (
  `user_id` int(11) NOT NULL,
  `hash_key` text NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table ffs_nodejs.permission
CREATE TABLE IF NOT EXISTS `permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` char(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `name` char(50) NOT NULL,
  `permission_set` longtext DEFAULT NULL,
  `color` char(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Dumping data for table ffs_nodejs.permission: ~1 rows (approximately)
DELETE FROM `permission`;
/*!40000 ALTER TABLE `permission` DISABLE KEYS */;
INSERT INTO `permission` (`id`, `slug`, `name`, `permission_set`, `color`) VALUES
	(1, 'yonetici', 'Yönetici', '["see-admin-page","see-logs","see-anime","add-anime","update-anime","delete-anime","featured-anime","see-episode","add-episode","update-episode","delete-episode","see-watch-link","add-watch-link","delete-watch-link","see-download-link","add-download-link","delete-download-link","see-manga","add-manga","update-manga","delete-manga","see-manga-episode","add-manga-episode","update-manga-episode","delete-manga-episode","see-motd","add-motd","update-motd","delete-motd","see-user","add-user","update-user","delete-user","see-permission","add-permission","update-permission","delete-permission","see-notification","add-notification","update-notification","delete-notification"]', '#CC0000'),
	(3, 'kullanici', 'Kullanıcı', '[]', NULL);

-- Dumping structure for table ffs_nodejs.user
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `slug` char(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `name` char(75) NOT NULL,
  `password` text NOT NULL,
  `permission_level` char(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'kullanici',
  `avatar` char(100) NOT NULL,
  `email` char(100) NOT NULL,
  `created_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `activated` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table ffs_nodejs.watch_link
CREATE TABLE IF NOT EXISTS `watch_link` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `anime_id` int(11) NOT NULL,
  `episode_id` int(11) NOT NULL,
  `type` char(255) NOT NULL,
  `link` char(255) NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `episode_id` (`episode_id`),
  KEY `anime_id` (`anime_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
