-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.3.10-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             10.2.0.5599
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dumping database structure for forfansubs
CREATE DATABASE IF NOT EXISTS `forfansubs` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `forfansubs`;

-- Dumping structure for table forfansubs.anime
CREATE TABLE IF NOT EXISTS `anime` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` char(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `version` char(11) NOT NULL DEFAULT 'tv',
  `pv` char(255) DEFAULT NULL,
  `name` char(100) NOT NULL,
  `synopsis` text DEFAULT NULL,
  `translators` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `encoders` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `studios` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `cover_art` char(255) NOT NULL,
  `mal_link` char(100) NOT NULL,
  `episode_count` int(11) NOT NULL DEFAULT 0,
  `genres` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `release_date` datetime NOT NULL,
  `premiered` char(50) DEFAULT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=501 DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table forfansubs.download_link
CREATE TABLE IF NOT EXISTS `download_link` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `anime_id` int(11) NOT NULL,
  `episode_id` int(11) NOT NULL,
  `resolution` text NOT NULL,
  `type` char(50) NOT NULL,
  `link` char(255) NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `link` (`link`),
  KEY `anime_id` (`anime_id`),
  KEY `episode_id` (`episode_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3012 DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table forfansubs.episode
CREATE TABLE IF NOT EXISTS `episode` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `anime_id` int(11) NOT NULL,
  `episode_number` char(11) DEFAULT '0',
  `special_type` char(10) DEFAULT NULL,
  `credits` char(255) DEFAULT NULL,
  `seen_download_page` tinyint(4) NOT NULL DEFAULT 1,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `anime_id` (`anime_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7458 DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table forfansubs.log
CREATE TABLE IF NOT EXISTS `log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` char(255) NOT NULL,
  `process_type` char(255) NOT NULL,
  `process` char(20) NOT NULL,
  `text` char(255) NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5272 DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table forfansubs.manga
CREATE TABLE IF NOT EXISTS `manga` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` char(255) NOT NULL,
  `name` char(100) NOT NULL,
  `synopsis` text DEFAULT NULL,
  `translators` char(255) DEFAULT NULL,
  `editors` char(255) DEFAULT NULL,
  `authors` char(255) DEFAULT NULL,
  `header` char(255) DEFAULT NULL,
  `cover_art` char(255) NOT NULL,
  `mal_link` char(255) NOT NULL,
  `genres` char(255) NOT NULL,
  `release_date` datetime NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  `mos_link` char(255) DEFAULT NULL,
  `download_link` char(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=167 DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table forfansubs.notification
CREATE TABLE IF NOT EXISTS `notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `is_active` int(1) DEFAULT 1,
  `type` char(10) NOT NULL DEFAULT 'default',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table forfansubs.permission
CREATE TABLE IF NOT EXISTS `permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` char(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `name` char(50) NOT NULL,
  `permission_set` text DEFAULT NULL,
  `color` char(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8;

-- Dumping data for table forfansubs.permission: ~4 rows (approximately)
DELETE FROM `permission`;
/*!40000 ALTER TABLE `permission` DISABLE KEYS */;
INSERT INTO `permission` (`id`, `slug`, `name`, `permission_set`, `color`) VALUES
	(1, 'yonetici', 'Yönetici', '["see-admin-page","see-logs","add-anime","update-anime","delete-anime","add-manga","update-manga","delete-manga","add-permission","update-permission","delete-permission","add-user","update-user","delete-user","add-episode","update-episode","delete-episode","add-watch-link","delete-watch-link","featured-anime","add-download-link","delete-download-link","see-administrative-stuff","take-backup"]', '#CC0000');
/*!40000 ALTER TABLE `permission` ENABLE KEYS */;

-- Dumping structure for table forfansubs.user
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `slug` char(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `name` char(75) NOT NULL,
  `password` text NOT NULL,
  `permission_level` char(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'kullanici',
  `avatar` char(100) NOT NULL,
  `email` char(100) NOT NULL,
  `created_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `activated` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

-- Dumping structure for table forfansubs.watch_link
CREATE TABLE IF NOT EXISTS `watch_link` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `anime_id` int(11) NOT NULL,
  `episode_id` int(11) NOT NULL,
  `type` char(255) NOT NULL,
  `link` char(255) NOT NULL,
  `created_time` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `episode_id` (`episode_id`),
  KEY `anime_id` (`anime_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20723 DEFAULT CHARSET=utf8;

-- Data exporting was unselected.

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
