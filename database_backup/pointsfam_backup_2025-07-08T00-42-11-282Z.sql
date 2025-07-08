-- PointsFam Database Backup
-- Created: 2025-07-08T00:42:11.283Z
-- ========================================

-- Table: users
DELETE FROM users;
INSERT INTO users (id, username, password_hash, first_name, last_name, role, family_id, points, created_at) VALUES (1, 'parent1', '$2b$10$gDbod.6L1RZNTzDVRV0shOkdUBhdOnY0u7TVw4bQblCX6Pd/PK.ES', 'John', 'Johnson', 'parent', 1, 0, '2025-07-04 17:58:11');
INSERT INTO users (id, username, password_hash, first_name, last_name, role, family_id, points, created_at) VALUES (2, 'parent2', '$2b$10$gDbod.6L1RZNTzDVRV0shOkdUBhdOnY0u7TVw4bQblCX6Pd/PK.ES', 'Jane', 'Johnson', 'parent', 1, 0, '2025-07-04 17:58:11');
INSERT INTO users (id, username, password_hash, first_name, last_name, role, family_id, points, created_at) VALUES (3, 'child1', '$2b$10$gDbod.6L1RZNTzDVRV0shOkdUBhdOnY0u7TVw4bQblCX6Pd/PK.ES', 'Emma', 'Johnson', 'child', 1, 150, '2025-07-04 17:58:11');
INSERT INTO users (id, username, password_hash, first_name, last_name, role, family_id, points, created_at) VALUES (4, 'child2', '$2b$10$gDbod.6L1RZNTzDVRV0shOkdUBhdOnY0u7TVw4bQblCX6Pd/PK.ES', 'Liam', 'Johnson', 'child', 1, 75, '2025-07-04 17:58:11');
INSERT INTO users (id, username, password_hash, first_name, last_name, role, family_id, points, created_at) VALUES (5, 'papa_berg', '$2b$10$gDbod.6L1RZNTzDVRV0shOkdUBhdOnY0u7TVw4bQblCX6Pd/PK.ES', 'Piet', 'van der Berg', 'parent', 2, 0, '2025-07-04 17:58:11');
INSERT INTO users (id, username, password_hash, first_name, last_name, role, family_id, points, created_at) VALUES (6, 'mama_berg', '$2b$10$gDbod.6L1RZNTzDVRV0shOkdUBhdOnY0u7TVw4bQblCX6Pd/PK.ES', 'Maria', 'van der Berg', 'parent', 2, 0, '2025-07-04 17:58:11');
INSERT INTO users (id, username, password_hash, first_name, last_name, role, family_id, points, created_at) VALUES (7, 'lisa_berg', '$2b$10$gDbod.6L1RZNTzDVRV0shOkdUBhdOnY0u7TVw4bQblCX6Pd/PK.ES', 'Lisa', 'van der Berg', 'child', 2, 200, '2025-07-04 17:58:11');
INSERT INTO users (id, username, password_hash, first_name, last_name, role, family_id, points, created_at) VALUES (8, 'tom_berg', '$2b$10$gDbod.6L1RZNTzDVRV0shOkdUBhdOnY0u7TVw4bQblCX6Pd/PK.ES', 'Tom', 'van der Berg', 'child', 2, 120, '2025-07-04 17:58:11');
INSERT INTO users (id, username, password_hash, first_name, last_name, role, family_id, points, created_at) VALUES (9, 'dad_smith', '$2b$10$gDbod.6L1RZNTzDVRV0shOkdUBhdOnY0u7TVw4bQblCX6Pd/PK.ES', 'David', 'Smith', 'parent', 3, 0, '2025-07-04 17:58:11');
INSERT INTO users (id, username, password_hash, first_name, last_name, role, family_id, points, created_at) VALUES (10, 'sarah_smith', '$2b$10$gDbod.6L1RZNTzDVRV0shOkdUBhdOnY0u7TVw4bQblCX6Pd/PK.ES', 'Sarah', 'Smith', 'child', 3, 95, '2025-07-04 17:58:11');

-- Table: families
DELETE FROM families;
INSERT INTO families (id, name, created_at) VALUES (1, 'The Johnson Family', '2025-07-04 17:58:11');
INSERT INTO families (id, name, created_at) VALUES (2, 'Familie van der Berg', '2025-07-04 17:58:11');
INSERT INTO families (id, name, created_at) VALUES (3, 'The Smith Family', '2025-07-04 17:58:11');

-- Table: conversations
DELETE FROM conversations;
INSERT INTO conversations (id, type, title, description, family_id, created_by, created_at, updated_at) VALUES (1, 'family', 'Familie Johnson Chat', 'Algemene familie chat voor The Johnson Family', 1, 1, '2025-07-07 08:00:00', '2025-07-07 10:30:00');
INSERT INTO conversations (id, type, title, description, family_id, created_by, created_at, updated_at) VALUES (2, 'family', 'Familie van der Berg', 'Familie gesprek voor dagelijkse zaken', 2, 5, '2025-07-07 07:00:00', '2025-07-07 09:45:00');
INSERT INTO conversations (id, type, title, description, family_id, created_by, created_at, updated_at) VALUES (3, 'direct', 'John & Emma', 'Direct gesprek tussen vader en dochter', NULL, 1, '2025-07-07 06:00:00', '2025-07-07 08:15:00');
INSERT INTO conversations (id, type, title, description, family_id, created_by, created_at, updated_at) VALUES (4, 'group', 'Ouders Support Groep', 'Ondersteuning voor ouders', NULL, 1, '2025-07-07 05:00:00', '2025-07-07 12:20:00');
INSERT INTO conversations (id, type, title, description, family_id, created_by, created_at, updated_at) VALUES (5, 'cross_family', 'Cross-Familie Chat', 'Gesprek tussen verschillende families', NULL, 1, '2025-07-07 04:00:00', '2025-07-07 11:10:00');

-- Table: conversation_participants
DELETE FROM conversation_participants;
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (1, 1, 'admin', '2025-07-07 08:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (1, 2, 'admin', '2025-07-07 08:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (1, 3, 'member', '2025-07-07 08:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (1, 4, 'member', '2025-07-07 08:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (2, 5, 'admin', '2025-07-07 07:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (2, 6, 'admin', '2025-07-07 07:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (2, 7, 'member', '2025-07-07 07:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (2, 8, 'member', '2025-07-07 07:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (3, 1, 'admin', '2025-07-07 06:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (3, 3, 'member', '2025-07-07 06:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (4, 1, 'admin', '2025-07-07 05:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (4, 2, 'member', '2025-07-07 05:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (4, 5, 'member', '2025-07-07 05:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (4, 6, 'member', '2025-07-07 05:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (5, 1, 'admin', '2025-07-07 04:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (5, 5, 'member', '2025-07-07 04:00:00', 1);
INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, is_active) VALUES (5, 9, 'member', '2025-07-07 04:00:00', 1);

-- Table: messages
DELETE FROM messages;
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (1, 1, 1, 'text', 'Hallo allemaal! Welkom in onze familie chat 👋', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 08:00:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (2, 1, 3, 'text', 'Hoi papa! Leuk dat we nu kunnen chatten 😊', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 08:05:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (3, 1, 2, 'text', 'Dit is heel handig om afspraken te maken!', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 08:10:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (4, 1, 4, 'text', 'Wanneer eten we vanavond?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 10:30:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (5, 2, 5, 'text', 'Goedemorgen familie! Hoe gaat het met iedereen?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 07:00:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (6, 2, 7, 'text', 'Goed papa! Ik ga vandaag mijn kamer opruimen 🧹', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 07:15:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (7, 2, 6, 'text', 'Vergeet je huiswerk niet Lisa!', NULL, NULL, NULL, 3, 0, 0, NULL, '2025-07-07 07:30:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (8, 2, 8, 'text', 'Mam, mag ik vrienden uitnodigen dit weekend?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 09:45:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (9, 3, 1, 'text', 'Hoi Emma, hoe ging het op school vandaag?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 06:00:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (10, 3, 3, 'text', 'Heel goed papa! Ik heb een 8 gehaald voor wiskunde! 🎉', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 06:15:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (11, 3, 1, 'text', 'Wat geweldig! Daar ben ik heel trots op! 👏', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 08:15:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (12, 4, 1, 'text', 'Hallo ouders! Welkom in onze support groep', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 05:00:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (13, 4, 5, 'text', 'Fijn dat dit er is! Hoe gaan jullie om met schermtijd?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 07:30:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (14, 4, 2, 'text', 'Wij hebben vaste tijden ingesteld, werkt heel goed!', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 12:20:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (15, 5, 1, 'text', 'Hallo families! Zullen we een gezamenlijke activiteit organiseren?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 04:00:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (16, 5, 5, 'text', 'Goed idee! Misschien een picknick in het park?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 06:30:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (17, 5, 9, 'text', 'Dat klinkt leuk! Wanneer hadden jullie gedacht?', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 11:10:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (18, 1, 1, 'text', 'Test message from automated test', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 22:19:30');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (19, 1, 1, 'text', 'Test message from automated test', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 22:26:00');
INSERT INTO messages (id, conversation_id, sender_id, message_type, content, file_path, file_name, file_size, reply_to_message_id, is_deleted, is_edited, edited_at, created_at) VALUES (20, 1, 1, 'text', 'Hello family! This is a test message in existing chat.', NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-07-07 22:39:14');

-- Table: message_status
DELETE FROM message_status;
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (1, 1, 2, 'read', '2025-07-07 08:01:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (2, 1, 3, 'read', '2025-07-07 08:02:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (3, 1, 4, 'read', '2025-07-07 08:03:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (4, 2, 1, 'read', '2025-07-07 22:41:02');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (5, 2, 2, 'read', '2025-07-07 08:07:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (6, 2, 4, 'read', '2025-07-07 08:08:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (7, 3, 1, 'read', '2025-07-07 22:41:02');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (8, 3, 3, 'read', '2025-07-07 08:12:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (9, 3, 4, 'read', '2025-07-07 08:13:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (10, 4, 1, 'read', '2025-07-07 22:41:02');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (11, 4, 2, 'read', '2025-07-07 10:32:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (12, 4, 3, 'read', '2025-07-07 10:33:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (13, 9, 3, 'read', '2025-07-07 06:01:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (14, 10, 1, 'read', '2025-07-07 06:16:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (15, 11, 3, 'read', '2025-07-07 08:16:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (16, 12, 5, 'read', '2025-07-07 05:01:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (17, 12, 6, 'read', '2025-07-07 05:02:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (18, 13, 1, 'read', '2025-07-07 07:31:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (19, 13, 2, 'read', '2025-07-07 07:32:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (20, 13, 6, 'read', '2025-07-07 07:33:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (21, 15, 5, 'read', '2025-07-07 04:01:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (22, 15, 9, 'read', '2025-07-07 04:02:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (23, 16, 1, 'read', '2025-07-07 06:31:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (24, 16, 9, 'read', '2025-07-07 06:32:00');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (25, 1, 1, 'read', '2025-07-07 22:41:02');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (37, 18, 1, 'read', '2025-07-07 22:41:02');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (88, 19, 1, 'read', '2025-07-07 22:41:02');
INSERT INTO message_status (id, message_id, user_id, status, status_at) VALUES (134, 20, 1, 'read', '2025-07-07 22:41:02');

-- Table: tasks
DELETE FROM tasks;
INSERT INTO tasks (id, family_id, name, description, points, category, is_custom, is_active, created_by, created_at) VALUES (1, 1, 'Vaatwasser inruimen', 'Alle schone vaat uit de vaatwasser halen en op de juiste plek zetten', 10, 'keuken', 0, 1, 1, '2025-07-04 17:58:11');
INSERT INTO tasks (id, family_id, name, description, points, category, is_custom, is_active, created_by, created_at) VALUES (2, 1, 'Kamer opruimen', 'Eigen kamer netjes maken en speelgoed opruimen', 15, 'slaapkamer', 0, 1, 1, '2025-07-04 17:58:11');
INSERT INTO tasks (id, family_id, name, description, points, category, is_custom, is_active, created_by, created_at) VALUES (3, 1, 'Hond uitlaten', 'De hond een wandeling geven van minimaal 15 minuten', 20, 'huisdieren', 0, 1, 1, '2025-07-04 17:58:11');
INSERT INTO tasks (id, family_id, name, description, points, category, is_custom, is_active, created_by, created_at) VALUES (4, 1, 'Huiswerk maken', 'Alle huiswerk voor school afmaken', 25, 'school', 0, 1, 1, '2025-07-04 17:58:11');

-- Table: rewards
DELETE FROM rewards;
INSERT INTO rewards (id, family_id, name, description, points_required, category, is_active, created_by, created_at) VALUES (1, 1, 'Kiezen wat we eten', 'Jij mag kiezen wat we vanavond eten', 100, 'eten', 1, 1, '2025-07-04 17:58:11');
INSERT INTO rewards (id, family_id, name, description, points_required, category, is_active, created_by, created_at) VALUES (2, 1, 'Extra schermtijd', '1 uur extra tijd op tablet/computer', 150, 'entertainment', 1, 1, '2025-07-04 17:58:11');
INSERT INTO rewards (id, family_id, name, description, points_required, category, is_active, created_by, created_at) VALUES (3, 1, 'Later naar bed', 'Op vrijdag 1 uur later naar bed', 200, 'privileges', 1, 1, '2025-07-04 17:58:11');
INSERT INTO rewards (id, family_id, name, description, points_required, category, is_active, created_by, created_at) VALUES (4, 1, 'Ijsje halen', 'Samen ijsje halen bij de ijssalon', 75, 'treats', 1, 1, '2025-07-04 17:58:11');

-- Table: points_transactions
DELETE FROM points_transactions;
INSERT INTO points_transactions (id, user_id, points, transaction_type, description, task_assignment_id, reward_id, created_by, created_at) VALUES (1, 3, 50, 'bonus', 'Welkom bonus', NULL, NULL, 1, '2025-07-04 17:58:11');
INSERT INTO points_transactions (id, user_id, points, transaction_type, description, task_assignment_id, reward_id, created_by, created_at) VALUES (2, 3, 100, 'earned', 'Taken deze week voltooid', NULL, NULL, 1, '2025-07-04 17:58:11');
INSERT INTO points_transactions (id, user_id, points, transaction_type, description, task_assignment_id, reward_id, created_by, created_at) VALUES (3, 4, 75, 'earned', 'Goed gedrag', NULL, NULL, 1, '2025-07-04 17:58:11');
INSERT INTO points_transactions (id, user_id, points, transaction_type, description, task_assignment_id, reward_id, created_by, created_at) VALUES (4, 7, 200, 'earned', 'Uitstekende prestaties', NULL, NULL, 5, '2025-07-04 17:58:11');
INSERT INTO points_transactions (id, user_id, points, transaction_type, description, task_assignment_id, reward_id, created_by, created_at) VALUES (5, 8, 120, 'earned', 'Taken voltooid', NULL, NULL, 5, '2025-07-04 17:58:11');

-- Table: profile_images
DELETE FROM profile_images;
INSERT INTO profile_images (id, user_id, image_path, description, uploaded_by, family_id, is_active, created_at) VALUES (1, 2, '/uploads/profiles/profile-1751870077812-293955720.webp', NULL, 1, 1, 1, '2025-07-07 04:34:44');
INSERT INTO profile_images (id, user_id, image_path, description, uploaded_by, family_id, is_active, created_at) VALUES (2, 4, '/uploads/profiles/profile-1751870085417-413077029.jpg', NULL, 1, 1, 1, '2025-07-07 04:34:51');
INSERT INTO profile_images (id, user_id, image_path, description, uploaded_by, family_id, is_active, created_at) VALUES (3, 3, '/uploads/profiles/profile-1751870091560-473382993.avif', NULL, 1, 1, 1, '2025-07-07 04:34:58');
