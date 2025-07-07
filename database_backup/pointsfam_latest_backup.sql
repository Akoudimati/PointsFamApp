-- PointsFam Database Backup
-- Generated on: 2025-07-07T08:19:13.596Z
-- Database: pointsfam
-- Host: mysql-3dfa6410-student-b14a.h.aivencloud.com:15421

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Database: `pointsfam`
CREATE DATABASE IF NOT EXISTS `pointsfam` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pointsfam`;

-- Table structure for table `families`
DROP TABLE IF EXISTS `families`;
CREATE TABLE "families" (
  "id" int NOT NULL AUTO_INCREMENT,
  "name" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Dumping data for table `families`
INSERT INTO `families` VALUES
(1, 'The Johnson Family', '2025-07-04 17:58:11'),
(2, 'Familie van der Berg', '2025-07-04 17:58:11'),
(3, 'The Smith Family', '2025-07-04 17:58:11'),
(4, 'joep', '2025-07-07 06:07:14');

-- Table structure for table `points_transactions`
DROP TABLE IF EXISTS `points_transactions`;
CREATE TABLE "points_transactions" (
  "id" int NOT NULL AUTO_INCREMENT,
  "user_id" int NOT NULL,
  "points" int NOT NULL,
  "transaction_type" enum('earned','bonus','redeemed','penalty') COLLATE utf8mb4_unicode_ci NOT NULL,
  "description" varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  "task_assignment_id" int DEFAULT NULL,
  "reward_id" int DEFAULT NULL,
  "created_by" int DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "task_assignment_id" ("task_assignment_id"),
  KEY "created_by" ("created_by"),
  KEY "idx_points_transactions_user_id" ("user_id"),
  CONSTRAINT "points_transactions_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "points_transactions_ibfk_2" FOREIGN KEY ("task_assignment_id") REFERENCES "task_assignments" ("id") ON DELETE SET NULL,
  CONSTRAINT "points_transactions_ibfk_3" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL
);

-- Dumping data for table `points_transactions`
INSERT INTO `points_transactions` VALUES
(1, 3, 50, 'bonus', 'Welkom bonus', NULL, NULL, 1, '2025-07-04 17:58:11'),
(2, 3, 100, 'earned', 'Taken deze week voltooid', NULL, NULL, 1, '2025-07-04 17:58:11'),
(3, 4, 75, 'earned', 'Goed gedrag', NULL, NULL, 1, '2025-07-04 17:58:11'),
(4, 7, 200, 'earned', 'Uitstekende prestaties', NULL, NULL, 5, '2025-07-04 17:58:11'),
(5, 8, 120, 'earned', 'Taken voltooid', NULL, NULL, 5, '2025-07-04 17:58:11');

-- Table structure for table `profile_images`
DROP TABLE IF EXISTS `profile_images`;
CREATE TABLE "profile_images" (
  "id" int NOT NULL AUTO_INCREMENT,
  "user_id" int NOT NULL,
  "image_path" varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  "description" text COLLATE utf8mb4_unicode_ci,
  "uploaded_by" int NOT NULL,
  "family_id" int NOT NULL,
  "is_active" tinyint(1) DEFAULT '1',
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "user_id" ("user_id"),
  KEY "uploaded_by" ("uploaded_by"),
  KEY "family_id" ("family_id"),
  CONSTRAINT "profile_images_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "profile_images_ibfk_2" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "profile_images_ibfk_3" FOREIGN KEY ("family_id") REFERENCES "families" ("id") ON DELETE CASCADE
);

-- Dumping data for table `profile_images`
INSERT INTO `profile_images` VALUES
(1, 2, '/uploads/profiles/profile-1751870077812-293955720.webp', NULL, 1, 1, 1, '2025-07-07 04:34:44'),
(2, 4, '/uploads/profiles/profile-1751870085417-413077029.jpg', NULL, 1, 1, 1, '2025-07-07 04:34:51'),
(3, 3, '/uploads/profiles/profile-1751870091560-473382993.avif', NULL, 1, 1, 1, '2025-07-07 04:34:58');

-- Table structure for table `reward_redemptions`
DROP TABLE IF EXISTS `reward_redemptions`;
CREATE TABLE "reward_redemptions" (
  "id" int NOT NULL AUTO_INCREMENT,
  "reward_id" int NOT NULL,
  "redeemed_by" int NOT NULL,
  "points_spent" int NOT NULL,
  "approved_by" int DEFAULT NULL,
  "approved_at" timestamp NULL DEFAULT NULL,
  "notes" text COLLATE utf8mb4_unicode_ci,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "reward_id" ("reward_id"),
  KEY "redeemed_by" ("redeemed_by"),
  KEY "approved_by" ("approved_by"),
  CONSTRAINT "reward_redemptions_ibfk_1" FOREIGN KEY ("reward_id") REFERENCES "rewards" ("id") ON DELETE CASCADE,
  CONSTRAINT "reward_redemptions_ibfk_2" FOREIGN KEY ("redeemed_by") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "reward_redemptions_ibfk_3" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL
);

-- No data for table `reward_redemptions`

-- Table structure for table `rewards`
DROP TABLE IF EXISTS `rewards`;
CREATE TABLE "rewards" (
  "id" int NOT NULL AUTO_INCREMENT,
  "family_id" int NOT NULL,
  "name" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "description" text COLLATE utf8mb4_unicode_ci,
  "points_required" int NOT NULL,
  "category" varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'privilege',
  "is_active" tinyint(1) DEFAULT '1',
  "created_by" int NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "created_by" ("created_by"),
  KEY "idx_rewards_family_id" ("family_id"),
  CONSTRAINT "rewards_ibfk_1" FOREIGN KEY ("family_id") REFERENCES "families" ("id") ON DELETE CASCADE,
  CONSTRAINT "rewards_ibfk_2" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Dumping data for table `rewards`
INSERT INTO `rewards` VALUES
(1, 1, 'Kiezen wat we eten', 'Jij mag kiezen wat we vanavond eten', 100, 'eten', 1, 1, '2025-07-04 17:58:11'),
(2, 1, 'Extra schermtijd', '1 uur extra tijd op tablet/computer', 150, 'entertainment', 1, 1, '2025-07-04 17:58:11'),
(3, 1, 'Later naar bed', 'Op vrijdag 1 uur later naar bed', 200, 'privileges', 1, 1, '2025-07-04 17:58:11'),
(4, 1, 'Ijsje halen', 'Samen ijsje halen bij de ijssalon', 75, 'treats', 1, 1, '2025-07-04 17:58:11');

-- Table structure for table `standard_tasks`
DROP TABLE IF EXISTS `standard_tasks`;
CREATE TABLE "standard_tasks" (
  "id" int NOT NULL AUTO_INCREMENT,
  "name" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "description" text COLLATE utf8mb4_unicode_ci,
  "default_points" int NOT NULL,
  "category" varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'household',
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Dumping data for table `standard_tasks`
INSERT INTO `standard_tasks` VALUES
(1, 'Vaatwasser inruimen', 'Alle schone vaat uit de vaatwasser halen en op de juiste plek zetten', 10, 'keuken', '2025-07-04 17:58:11'),
(2, 'Kamer opruimen', 'Eigen kamer netjes maken en speelgoed opruimen', 15, 'slaapkamer', '2025-07-04 17:58:11'),
(3, 'Hond uitlaten', 'De hond een wandeling geven van minimaal 15 minuten', 20, 'huisdieren', '2025-07-04 17:58:11'),
(4, 'Tafel dekken', 'De eettafel klaarmaken voor het avondeten', 8, 'keuken', '2025-07-04 17:58:11'),
(5, 'Stofzuigen woonkamer', 'De woonkamer stofzuigen', 12, 'schoonmaak', '2025-07-04 17:58:11'),
(6, 'Huiswerk maken', 'Alle huiswerk voor school afmaken', 25, 'school', '2025-07-04 17:58:11');

-- Table structure for table `task_assignments`
DROP TABLE IF EXISTS `task_assignments`;
CREATE TABLE "task_assignments" (
  "id" int NOT NULL AUTO_INCREMENT,
  "task_id" int NOT NULL,
  "assigned_to" int NOT NULL,
  "assigned_by" int NOT NULL,
  "status" enum('pending','completed','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  "completed_at" timestamp NULL DEFAULT NULL,
  "approved_at" timestamp NULL DEFAULT NULL,
  "approved_by" int DEFAULT NULL,
  "points_awarded" int DEFAULT NULL,
  "notes" text COLLATE utf8mb4_unicode_ci,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "task_id" ("task_id"),
  KEY "assigned_by" ("assigned_by"),
  KEY "approved_by" ("approved_by"),
  KEY "idx_task_assignments_assigned_to" ("assigned_to"),
  CONSTRAINT "task_assignments_ibfk_1" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE,
  CONSTRAINT "task_assignments_ibfk_2" FOREIGN KEY ("assigned_to") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "task_assignments_ibfk_3" FOREIGN KEY ("assigned_by") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "task_assignments_ibfk_4" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL
);

-- Dumping data for table `task_assignments`
INSERT INTO `task_assignments` VALUES
(1, 4, 3, 12, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-07-07 06:14:34'),
(2, 4, 4, 12, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-07-07 06:14:34');

-- Table structure for table `tasks`
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE "tasks" (
  "id" int NOT NULL AUTO_INCREMENT,
  "family_id" int NOT NULL,
  "name" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "description" text COLLATE utf8mb4_unicode_ci,
  "points" int NOT NULL,
  "category" varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'household',
  "is_custom" tinyint(1) DEFAULT '0',
  "is_active" tinyint(1) DEFAULT '1',
  "created_by" int NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "idx_tasks_family_id" ("family_id"),
  KEY "created_by" ("created_by"),
  CONSTRAINT "tasks_ibfk_1" FOREIGN KEY ("family_id") REFERENCES "families" ("id") ON DELETE CASCADE,
  CONSTRAINT "tasks_ibfk_2" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Dumping data for table `tasks`
INSERT INTO `tasks` VALUES
(1, 1, 'Vaatwasser inruimen', 'Alle schone vaat uit de vaatwasser halen en op de juiste plek zetten', 10, 'keuken', 0, 1, 1, '2025-07-04 17:58:11'),
(2, 1, 'Kamer opruimen', 'Eigen kamer netjes maken en speelgoed opruimen', 15, 'slaapkamer', 0, 1, 1, '2025-07-04 17:58:11'),
(3, 1, 'Hond uitlaten', 'De hond een wandeling geven van minimaal 15 minuten', 20, 'huisdieren', 0, 1, 1, '2025-07-04 17:58:11'),
(4, 1, 'Huiswerk maken', 'Alle huiswerk voor school afmaken', 25, 'school', 0, 1, 1, '2025-07-04 17:58:11');

-- Table structure for table `user_sessions`
DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE "user_sessions" (
  "id" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "user_id" int NOT NULL,
  "expires_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "user_id" ("user_id"),
  CONSTRAINT "user_sessions_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- No data for table `user_sessions`

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE "users" (
  "id" int NOT NULL AUTO_INCREMENT,
  "username" varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  "password_hash" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "first_name" varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  "last_name" varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  "role" enum('parent','child') COLLATE utf8mb4_unicode_ci NOT NULL,
  "family_id" int NOT NULL,
  "points" int DEFAULT '0',
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "username" ("username"),
  KEY "idx_users_family_id" ("family_id"),
  CONSTRAINT "users_ibfk_1" FOREIGN KEY ("family_id") REFERENCES "families" ("id") ON DELETE CASCADE
);

-- Dumping data for table `users`
INSERT INTO `users` VALUES
(1, 'parent1', '$2b$10$iwpk9aSTmjmG.0bB7qu5keycHVmzTPokrymbPel2d28uOB9LmKTqq', 'John', 'Johnson', 'parent', 1, 0, '2025-07-04 17:58:11'),
(2, 'parent2', '$2b$10$iwpk9aSTmjmG.0bB7qu5keycHVmzTPokrymbPel2d28uOB9LmKTqq', 'Jane', 'Johnson', 'parent', 1, 0, '2025-07-04 17:58:11'),
(3, 'child1', '$2b$10$iwpk9aSTmjmG.0bB7qu5keycHVmzTPokrymbPel2d28uOB9LmKTqq', 'Emma', 'Johnson', 'child', 1, 150, '2025-07-04 17:58:11'),
(4, 'child2', '$2b$10$iwpk9aSTmjmG.0bB7qu5keycHVmzTPokrymbPel2d28uOB9LmKTqq', 'Liam2', 'Johnson', 'child', 1, 75, '2025-07-04 17:58:11'),
(5, 'papa_berg', '$2b$10$iwpk9aSTmjmG.0bB7qu5keycHVmzTPokrymbPel2d28uOB9LmKTqq', 'Piet', 'van der Berg', 'parent', 2, 0, '2025-07-04 17:58:11'),
(6, 'mama_berg', '$2b$10$iwpk9aSTmjmG.0bB7qu5keycHVmzTPokrymbPel2d28uOB9LmKTqq', 'Maria', 'van der Berg', 'parent', 2, 0, '2025-07-04 17:58:11'),
(7, 'lisa_berg', '$2b$10$iwpk9aSTmjmG.0bB7qu5keycHVmzTPokrymbPel2d28uOB9LmKTqq', 'Lisa', 'van der Berg', 'child', 2, 200, '2025-07-04 17:58:11'),
(8, 'tom_berg', '$2b$10$iwpk9aSTmjmG.0bB7qu5keycHVmzTPokrymbPel2d28uOB9LmKTqq', 'Tom', 'van der Berg', 'child', 2, 120, '2025-07-04 17:58:11'),
(9, 'dad_smith', '$2b$10$iwpk9aSTmjmG.0bB7qu5keycHVmzTPokrymbPel2d28uOB9LmKTqq', 'David', 'Smith', 'parent', 3, 0, '2025-07-04 17:58:11'),
(10, 'sarah_smith', '$2b$10$iwpk9aSTmjmG.0bB7qu5keycHVmzTPokrymbPel2d28uOB9LmKTqq', 'Sarah', 'Smith', 'child', 3, 95, '2025-07-04 17:58:11'),
(11, 'mario22', '$2b$10$9n/dRIup5jjhWS1UzyCqLOp8PL3GsPNli3ZHtfE5xJi2.zHBGuzPS', 'mario', 'Koudimati', 'parent', 4, 0, '2025-07-07 06:07:14'),
(12, 'ouder', '$2b$10$qmpqm7S2NbGkmiSPYbqiyuLYMamRIKH1oSlU9ToL5gZa.5z8qm/JS', 'Ouder', 'Gebruiker', 'parent', 1, 0, '2025-07-07 06:11:39');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- Backup completed successfully
-- Total tables: 10
-- Generated at: 7/7/2025, 10:19:13 AM
