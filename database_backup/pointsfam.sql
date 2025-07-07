-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 07, 2025 at 08:07 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pointsfam`
--
CREATE DATABASE IF NOT EXISTS `pointsfam` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pointsfam`;

-- --------------------------------------------------------

--
-- Table structure for table `families`
--

CREATE TABLE `families` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `families`
--

INSERT INTO `families` (`id`, `name`, `created_at`) VALUES
(1, 'The Johnson Family', '2025-07-04 17:58:11'),
(2, 'Familie van der Berg', '2025-07-04 17:58:11'),
(3, 'The Smith Family', '2025-07-04 17:58:11');

-- --------------------------------------------------------

--
-- Stand-in structure for view `family_leaderboard`
-- (See below for the actual view)
--
CREATE TABLE `family_leaderboard` (
`family_id` int(11)
,`family_name` varchar(255)
,`user_id` int(11)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`points` int(11)
,`rank_in_family` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `points_transactions`
--

CREATE TABLE `points_transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `points` int(11) NOT NULL,
  `transaction_type` enum('earned','bonus','redeemed','penalty') NOT NULL,
  `description` varchar(500) NOT NULL,
  `task_assignment_id` int(11) DEFAULT NULL,
  `reward_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `points_transactions`
--

INSERT INTO `points_transactions` (`id`, `user_id`, `points`, `transaction_type`, `description`, `task_assignment_id`, `reward_id`, `created_by`, `created_at`) VALUES
(1, 3, 50, 'bonus', 'Welkom bonus', NULL, NULL, 1, '2025-07-04 17:58:11'),
(2, 3, 100, 'earned', 'Taken deze week voltooid', NULL, NULL, 1, '2025-07-04 17:58:11'),
(3, 4, 75, 'earned', 'Goed gedrag', NULL, NULL, 1, '2025-07-04 17:58:11'),
(4, 7, 200, 'earned', 'Uitstekende prestaties', NULL, NULL, 5, '2025-07-04 17:58:11'),
(5, 8, 120, 'earned', 'Taken voltooid', NULL, NULL, 5, '2025-07-04 17:58:11'),
(6, 3, -150, 'redeemed', 'Reward redeemed: Extra schermtijd', NULL, NULL, 3, '2025-07-07 03:37:33'),
(7, 3, 20, 'earned', 'Task completed: Hond uitlaten', NULL, NULL, 3, '2025-07-07 05:29:20'),
(8, 3, 10, 'earned', 'Task completed: Slaapkamer opruimen', NULL, NULL, 3, '2025-07-07 05:51:56'),
(9, 3, 10, 'earned', 'Task completed: Vaatwasser inruimen', NULL, NULL, 3, '2025-07-07 05:57:14');

-- --------------------------------------------------------

--
-- Table structure for table `profile_images`
--

CREATE TABLE `profile_images` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `image_path` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `family_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `profile_images`
--

INSERT INTO `profile_images` (`id`, `user_id`, `image_path`, `description`, `uploaded_by`, `family_id`, `is_active`, `created_at`) VALUES
(1, 3, '/uploads/profiles/profile-1751864234730-845113694.jpg', NULL, 1, 1, 1, '2025-07-07 04:57:14'),
(2, 3, '/uploads/profiles/profile-1751864514022-477149159.avif', NULL, 1, 1, 1, '2025-07-07 05:01:54'),
(3, 3, '/uploads/profiles/profile-1751864951804-541672018.avif', NULL, 1, 1, 1, '2025-07-07 05:09:11'),
(4, 4, '/uploads/profiles/profile-1751867704792-924129551.jpg', NULL, 1, 1, 1, '2025-07-07 05:55:04'),
(5, 2, '/uploads/profiles/profile-1751867765314-9373131.webp', NULL, 1, 1, 1, '2025-07-07 05:56:05');

-- --------------------------------------------------------

--
-- Table structure for table `rewards`
--

CREATE TABLE `rewards` (
  `id` int(11) NOT NULL,
  `family_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `points_required` int(11) NOT NULL,
  `category` varchar(100) DEFAULT 'privilege',
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rewards`
--

INSERT INTO `rewards` (`id`, `family_id`, `name`, `description`, `points_required`, `category`, `is_active`, `created_by`, `created_at`) VALUES
(1, 1, 'Kiezen wat we eten', 'Jij mag kiezen wat we vanavond eten', 100, 'eten', 1, 1, '2025-07-04 17:58:11'),
(2, 1, 'Extra schermtijd', '1 uur extra tijd op tablet/computer', 150, 'entertainment', 1, 1, '2025-07-04 17:58:11'),
(3, 1, 'Later naar bed', 'Op vrijdag 1 uur later naar bed', 200, 'privileges', 1, 1, '2025-07-04 17:58:11'),
(4, 1, 'Ijsje halen', 'Samen ijsje halen bij de ijssalon', 75, 'treats', 1, 1, '2025-07-04 17:58:11');

-- --------------------------------------------------------

--
-- Table structure for table `reward_redemptions`
--

CREATE TABLE `reward_redemptions` (
  `id` int(11) NOT NULL,
  `reward_id` int(11) NOT NULL,
  `redeemed_by` int(11) NOT NULL,
  `points_spent` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reward_redemptions`
--

INSERT INTO `reward_redemptions` (`id`, `reward_id`, `redeemed_by`, `points_spent`, `approved_by`, `approved_at`, `notes`, `created_at`) VALUES
(1, 2, 3, 150, NULL, NULL, NULL, '2025-07-07 03:37:33');

-- --------------------------------------------------------

--
-- Table structure for table `standard_tasks`
--

CREATE TABLE `standard_tasks` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `default_points` int(11) NOT NULL,
  `category` varchar(100) DEFAULT 'household',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `standard_tasks`
--

INSERT INTO `standard_tasks` (`id`, `name`, `description`, `default_points`, `category`, `created_at`) VALUES
(1, 'Vaatwasser inruimen', 'Alle schone vaat uit de vaatwasser halen en op de juiste plek zetten', 10, 'keuken', '2025-07-04 17:58:11'),
(2, 'Kamer opruimen', 'Eigen kamer netjes maken en speelgoed opruimen', 15, 'slaapkamer', '2025-07-04 17:58:11'),
(3, 'Hond uitlaten', 'De hond een wandeling geven van minimaal 15 minuten', 20, 'huisdieren', '2025-07-04 17:58:11'),
(4, 'Tafel dekken', 'De eettafel klaarmaken voor het avondeten', 8, 'keuken', '2025-07-04 17:58:11'),
(5, 'Stofzuigen woonkamer', 'De woonkamer stofzuigen', 12, 'schoonmaak', '2025-07-04 17:58:11'),
(6, 'Huiswerk maken', 'Alle huiswerk voor school afmaken', 25, 'school', '2025-07-04 17:58:11');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `family_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `points` int(11) NOT NULL,
  `category` varchar(100) DEFAULT 'household',
  `is_custom` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `family_id`, `name`, `description`, `points`, `category`, `is_custom`, `is_active`, `created_by`, `created_at`) VALUES
(1, 1, 'Vaatwasser inruimen', 'Alle schone vaat uit de vaatwasser halen en op de juiste plek zetten', 10, 'keuken', 0, 1, 1, '2025-07-04 17:58:11'),
(2, 1, 'Kamer opruimen', 'Eigen kamer netjes maken en speelgoed opruimen', 15, 'slaapkamer', 0, 1, 1, '2025-07-04 17:58:11'),
(3, 1, 'Hond uitlaten', 'De hond een wandeling geven van minimaal 15 minuten', 20, 'huisdieren', 0, 1, 1, '2025-07-04 17:58:11'),
(4, 1, 'Huiswerk maken', 'Alle huiswerk voor school afmaken', 25, 'school', 0, 1, 1, '2025-07-04 17:58:11'),
(6, 1, 'Slaapkamer opruimen', NULL, 10, 'household', 1, 1, 1, '2025-07-07 05:51:21'),
(7, 1, 'Huiswerk maken ', 'Alle huiswerk voor school afmaken', 15, 'household', 1, 1, 1, '2025-07-07 06:01:07'),
(8, 1, 'Hond uitlaten ', 'De hond een wandeling geven van minimaal 15 minuten', 5, 'household', 1, 1, 1, '2025-07-07 06:01:28'),
(9, 1, 'Slaapkamer opruimen ', NULL, 10, 'household', 1, 1, 1, '2025-07-07 06:01:43'),
(10, 1, 'Vaatwasser inruimen', ' Alle schone vaat uit de vaatwasser halen en op de juiste plek zetten', 5, 'household', 1, 1, 1, '2025-07-07 06:02:03');

-- --------------------------------------------------------

--
-- Table structure for table `task_assignments`
--

CREATE TABLE `task_assignments` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `assigned_to` int(11) NOT NULL,
  `assigned_by` int(11) NOT NULL,
  `status` enum('pending','completed','approved','rejected') DEFAULT 'pending',
  `completed_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `points_awarded` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_assignments`
--

INSERT INTO `task_assignments` (`id`, `task_id`, `assigned_to`, `assigned_by`, `status`, `completed_at`, `approved_at`, `approved_by`, `points_awarded`, `notes`, `created_at`) VALUES
(1, 4, 3, 1, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-07-07 05:17:45'),
(2, 4, 4, 1, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-07-07 05:17:45'),
(3, 3, 3, 1, 'approved', NULL, '2025-07-07 05:29:20', 3, 20, NULL, '2025-07-07 05:17:49'),
(4, 3, 4, 1, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-07-07 05:17:49'),
(5, 2, 3, 1, 'rejected', NULL, NULL, NULL, NULL, NULL, '2025-07-07 05:39:22'),
(6, 2, 4, 1, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-07-07 05:39:22'),
(7, 6, 3, 1, 'approved', NULL, '2025-07-07 05:51:56', 3, 10, NULL, '2025-07-07 05:51:25'),
(8, 6, 4, 1, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-07-07 05:51:25'),
(9, 1, 3, 1, 'approved', NULL, '2025-07-07 05:57:14', 3, 10, NULL, '2025-07-07 05:56:42'),
(10, 1, 4, 1, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-07-07 05:56:42'),
(11, 7, 3, 1, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-07-07 06:06:16'),
(12, 7, 4, 1, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-07-07 06:06:16');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `role` enum('parent','child') NOT NULL,
  `family_id` int(11) NOT NULL,
  `points` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `first_name`, `last_name`, `role`, `family_id`, `points`, `created_at`) VALUES
(1, 'parent1', '$2b$10$3CH/Yo8AMABYnRH6oDS9xuXAjaGkMJnJFX96f9x7Gd9qsLng32jtq', 'John', 'Johnson', 'parent', 1, 0, '2025-07-04 17:58:11'),
(2, 'parent2', '$2b$10$3CH/Yo8AMABYnRH6oDS9xuXAjaGkMJnJFX96f9x7Gd9qsLng32jtq', 'Jane', 'Johnson', 'parent', 1, 0, '2025-07-04 17:58:11'),
(3, 'child1', '$2b$10$3CH/Yo8AMABYnRH6oDS9xuXAjaGkMJnJFX96f9x7Gd9qsLng32jtq', 'Emma', 'Johnson', 'child', 1, 40, '2025-07-04 17:58:11'),
(4, 'child2', '$2b$10$3CH/Yo8AMABYnRH6oDS9xuXAjaGkMJnJFX96f9x7Gd9qsLng32jtq', 'Liam', 'Johnson', 'child', 1, 75, '2025-07-04 17:58:11'),
(5, 'papa_berg', '$2b$10$3CH/Yo8AMABYnRH6oDS9xuXAjaGkMJnJFX96f9x7Gd9qsLng32jtq', 'Piet', 'van der Berg', 'parent', 2, 0, '2025-07-04 17:58:11'),
(6, 'mama_berg', '$2b$10$3CH/Yo8AMABYnRH6oDS9xuXAjaGkMJnJFX96f9x7Gd9qsLng32jtq', 'Maria', 'van der Berg', 'parent', 2, 0, '2025-07-04 17:58:11'),
(7, 'lisa_berg', '$2b$10$3CH/Yo8AMABYnRH6oDS9xuXAjaGkMJnJFX96f9x7Gd9qsLng32jtq', 'Lisa', 'van der Berg', 'child', 2, 200, '2025-07-04 17:58:11'),
(8, 'tom_berg', '$2b$10$3CH/Yo8AMABYnRH6oDS9xuXAjaGkMJnJFX96f9x7Gd9qsLng32jtq', 'Tom', 'van der Berg', 'child', 2, 120, '2025-07-04 17:58:11'),
(9, 'dad_smith', '$2b$10$3CH/Yo8AMABYnRH6oDS9xuXAjaGkMJnJFX96f9x7Gd9qsLng32jtq', 'David', 'Smith', 'parent', 3, 0, '2025-07-04 17:58:11'),
(10, 'sarah_smith', '$2b$10$3CH/Yo8AMABYnRH6oDS9xuXAjaGkMJnJFX96f9x7Gd9qsLng32jtq', 'Sarah', 'Smith', 'child', 3, 95, '2025-07-04 17:58:11');

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `user_stats`
-- (See below for the actual view)
--
CREATE TABLE `user_stats` (
`id` int(11)
,`username` varchar(100)
,`first_name` varchar(100)
,`last_name` varchar(100)
,`role` enum('parent','child')
,`family_id` int(11)
,`points` int(11)
,`completed_tasks` bigint(21)
,`pending_tasks` bigint(21)
);

-- --------------------------------------------------------

--
-- Structure for view `family_leaderboard`
--
DROP TABLE IF EXISTS `family_leaderboard`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `family_leaderboard`  AS SELECT `f`.`id` AS `family_id`, `f`.`name` AS `family_name`, `u`.`id` AS `user_id`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`points` AS `points`, rank() over ( partition by `f`.`id` order by `u`.`points` desc) AS `rank_in_family` FROM (`families` `f` join `users` `u` on(`f`.`id` = `u`.`family_id`)) WHERE `u`.`role` = 'child' ORDER BY `f`.`id` ASC, `u`.`points` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `user_stats`
--
DROP TABLE IF EXISTS `user_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `user_stats`  AS SELECT `u`.`id` AS `id`, `u`.`username` AS `username`, `u`.`first_name` AS `first_name`, `u`.`last_name` AS `last_name`, `u`.`role` AS `role`, `u`.`family_id` AS `family_id`, `u`.`points` AS `points`, (select count(0) from (`task_assignments` `ta` join `tasks` `t` on(`ta`.`task_id` = `t`.`id`)) where `ta`.`assigned_to` = `u`.`id` and `ta`.`status` = 'approved' and `t`.`family_id` = `u`.`family_id`) AS `completed_tasks`, (select count(0) from (`task_assignments` `ta` join `tasks` `t` on(`ta`.`task_id` = `t`.`id`)) where `ta`.`assigned_to` = `u`.`id` and `ta`.`status` in ('pending','completed') and `t`.`family_id` = `u`.`family_id`) AS `pending_tasks` FROM `users` AS `u` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `families`
--
ALTER TABLE `families`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `points_transactions`
--
ALTER TABLE `points_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_assignment_id` (`task_assignment_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_points_transactions_user_id` (`user_id`);

--
-- Indexes for table `profile_images`
--
ALTER TABLE `profile_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `family_id` (`family_id`);

--
-- Indexes for table `rewards`
--
ALTER TABLE `rewards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_rewards_family_id` (`family_id`);

--
-- Indexes for table `reward_redemptions`
--
ALTER TABLE `reward_redemptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reward_id` (`reward_id`),
  ADD KEY `redeemed_by` (`redeemed_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `standard_tasks`
--
ALTER TABLE `standard_tasks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tasks_family_id` (`family_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `assigned_by` (`assigned_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_task_assignments_assigned_to` (`assigned_to`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_family_id` (`family_id`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `families`
--
ALTER TABLE `families`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `points_transactions`
--
ALTER TABLE `points_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `profile_images`
--
ALTER TABLE `profile_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `rewards`
--
ALTER TABLE `rewards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reward_redemptions`
--
ALTER TABLE `reward_redemptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `standard_tasks`
--
ALTER TABLE `standard_tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `task_assignments`
--
ALTER TABLE `task_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `points_transactions`
--
ALTER TABLE `points_transactions`
  ADD CONSTRAINT `points_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `points_transactions_ibfk_2` FOREIGN KEY (`task_assignment_id`) REFERENCES `task_assignments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `points_transactions_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `profile_images`
--
ALTER TABLE `profile_images`
  ADD CONSTRAINT `profile_images_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `profile_images_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `profile_images_ibfk_3` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rewards`
--
ALTER TABLE `rewards`
  ADD CONSTRAINT `rewards_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rewards_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reward_redemptions`
--
ALTER TABLE `reward_redemptions`
  ADD CONSTRAINT `reward_redemptions_ibfk_1` FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reward_redemptions_ibfk_2` FOREIGN KEY (`redeemed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reward_redemptions_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD CONSTRAINT `task_assignments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignments_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignments_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
