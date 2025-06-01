
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `j25528309_ghack`
--

-- --------------------------------------------------------
-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('client', 'booster', 'admin') NOT NULL DEFAULT 'client',
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'GH currency',
    `referral_code` VARCHAR(50) UNIQUE,
    `referred_by_user_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `telegram_id` VARCHAR(255) NULL,
    FOREIGN KEY (`referred_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Games Table (Categories)
CREATE TABLE IF NOT EXISTS `games` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `min_price` decimal(10,2) DEFAULT 0.00,
  `image_url` varchar(1024) DEFAULT NULL,
  `logo_url` varchar(1024) DEFAULT NULL,
  `banner_url` varchar(1024) DEFAULT NULL,
  `platform` varchar(255) DEFAULT NULL,
  `tags` text DEFAULT NULL,
  `data_ai_hint` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
   PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Products Table (Cheats/Items)
CREATE TABLE IF NOT EXISTS `products` (
    `id` VARCHAR(255) PRIMARY KEY COMMENT 'This is usually the slug for the product',
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `game_slug` VARCHAR(255) NOT NULL,
    `image_url` VARCHAR(1024),
    `status` ENUM('safe', 'updating', 'risky', 'unknown') NOT NULL DEFAULT 'unknown',
    `status_text` VARCHAR(255),
    `price_text` VARCHAR(50) DEFAULT NULL,
    `short_description` TEXT,
    `long_description` TEXT,
    `data_ai_hint` VARCHAR(255),
    `mode` ENUM('PVE', 'PVP', 'BOTH') DEFAULT NULL,
    `gallery_image_urls` TEXT DEFAULT NULL COMMENT 'Comma-separated URLs',
    `functions_aim` TEXT DEFAULT NULL COMMENT 'Comma-separated list',
    `functions_wallhack` TEXT DEFAULT NULL COMMENT 'Comma-separated list',
    `functions_misc` TEXT DEFAULT NULL COMMENT 'Comma-separated list',
    `system_os` VARCHAR(255) DEFAULT NULL,
    `system_build` VARCHAR(255) DEFAULT NULL,
    `system_gpu` VARCHAR(255) DEFAULT NULL,
    `system_cpu` VARCHAR(255) DEFAULT NULL,
    `retrieval_modal_intro_text` TEXT NULL DEFAULT NULL,
    `retrieval_modal_antivirus_text` TEXT NULL DEFAULT NULL,
    `retrieval_modal_antivirus_link_text` VARCHAR(255) NULL DEFAULT NULL,
    `retrieval_modal_antivirus_link_url` VARCHAR(1024) NULL DEFAULT NULL,
    `retrieval_modal_launcher_text` TEXT NULL DEFAULT NULL,
    `retrieval_modal_launcher_link_text` VARCHAR(255) NULL DEFAULT NULL,
    `retrieval_modal_launcher_link_url` VARCHAR(1024) NULL DEFAULT NULL,
    `retrieval_modal_key_paste_text` TEXT NULL DEFAULT NULL,
    `retrieval_modal_support_text` TEXT NULL DEFAULT NULL,
    `retrieval_modal_support_link_text` VARCHAR(255) NULL DEFAULT NULL,
    `retrieval_modal_support_link_url` VARCHAR(1024) NULL DEFAULT NULL,
    `retrieval_modal_how_to_run_link` VARCHAR(1024) NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`game_slug`) REFERENCES `games`(`slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Product Pricing Options Table
CREATE TABLE IF NOT EXISTS `product_pricing_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` varchar(255) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `price_rub` decimal(10,2) NOT NULL,
  `price_gh` decimal(10,2) NOT NULL,
  `is_pvp` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Balance Transactions Table
CREATE TABLE IF NOT EXISTS `balance_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `transaction_type` enum('deposit','purchase_product','open_case','sell_prize','referral_bonus','admin_adjustment') NOT NULL,
  `amount_gh` decimal(10,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `related_purchase_id` int(11) DEFAULT NULL,
  `related_case_opening_id` int(11) DEFAULT NULL,
  `related_referral_id` int(11) DEFAULT NULL,
  `related_payment_request_id` INT NULL DEFAULT NULL COMMENT 'ID заявки на пополнение, если транзакция связана с ней',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`related_referral_id`) REFERENCES `referrals`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`related_payment_request_id`) REFERENCES `payment_requests`(`id`) ON DELETE SET NULL
  -- Note: Foreign keys for purchase_id and case_opening_id will be added after their tables are created
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Purchases Table
CREATE TABLE IF NOT EXISTS `purchases` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `product_id` VARCHAR(255) NOT NULL,
    `product_pricing_option_id` INT NULL,
    `purchase_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `amount_paid_gh` DECIMAL(10, 2) NOT NULL,
    `amount_paid_rub` DECIMAL(10, 2) DEFAULT NULL,
    `payment_method` ENUM('gh_balance', 'external') NOT NULL DEFAULT 'gh_balance',
    `status` ENUM('completed', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'completed',
    `balance_transaction_id` INT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_pricing_option_id`) REFERENCES `product_pricing_options`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`balance_transaction_id`) REFERENCES `balance_transactions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Cases Table
CREATE TABLE IF NOT EXISTS `cases` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `image_url` VARCHAR(1024),
    `base_price_gh` DECIMAL(10, 2) NOT NULL,
    `description` TEXT,
    `data_ai_hint` VARCHAR(255),
    `is_active` BOOLEAN DEFAULT TRUE,
    `total_opening_limit` INT NULL DEFAULT NULL COMMENT 'Глобальный лимит на кол-во открытий всего',
    `user_opening_limit` INT NULL DEFAULT NULL COMMENT 'Лимит открытий на одного пользователя',
    `is_hot_offer` BOOLEAN DEFAULT FALSE COMMENT 'Является ли кейс "горячим предложением"',
    `timer_enabled` BOOLEAN DEFAULT FALSE COMMENT 'Включен ли таймер для кейса',
    `timer_ends_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Время окончания действия таймера',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Case Prizes Table
CREATE TABLE IF NOT EXISTS `case_prizes` (
    `id` VARCHAR(255) PRIMARY KEY COMMENT 'Can be UUID or custom prize ID',
    `case_id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `prize_type` ENUM('product_duration', 'balance_gh', 'physical_item') DEFAULT 'product_duration',
    `related_product_id` VARCHAR(255) NULL,
    `duration_days` INT NULL,
    `balance_gh_amount` DECIMAL(10, 2) NULL,
    `image_url` VARCHAR(1024),
    `chance` DECIMAL(5, 4) NOT NULL,
    `sell_value_gh` DECIMAL(10, 2) NULL,
    `data_ai_hint` VARCHAR(255),
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`related_product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Case Openings History Table
CREATE TABLE IF NOT EXISTS `case_openings_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `case_id` VARCHAR(255) NOT NULL,
    `won_prize_id` VARCHAR(255) NOT NULL,
    `opened_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `action_taken` ENUM('kept', 'sold', 'pending') NOT NULL DEFAULT 'pending',
    `sold_value_gh` DECIMAL(10, 2) NULL,
    `balance_transaction_id` INT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`won_prize_id`) REFERENCES `case_prizes`(`id`) ON DELETE RESTRICT, -- Prevent prize deletion if used in history
    FOREIGN KEY (`balance_transaction_id`) REFERENCES `balance_transactions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- User Inventory Table
CREATE TABLE IF NOT EXISTS `user_inventory` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `case_prize_id` VARCHAR(255) NULL,
    `related_product_id` VARCHAR(255) NULL,
    `product_pricing_option_id` INT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `product_image_url` VARCHAR(1024) NULL,
    `activation_code` VARCHAR(255) UNIQUE NULL,
    `expires_at` TIMESTAMP NULL,
    `acquired_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `activated_at` TIMESTAMP NULL DEFAULT NULL,
    `is_used` BOOLEAN DEFAULT FALSE,
    `purchase_id` INT NULL,
    `case_opening_id` INT NULL,
    `activation_status` ENUM('available', 'pending_admin_approval', 'active', 'rejected', 'expired') NOT NULL DEFAULT 'available',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`case_prize_id`) REFERENCES `case_prizes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`related_product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL, -- SET NULL to keep inventory if product deleted
    FOREIGN KEY (`product_pricing_option_id`) REFERENCES `product_pricing_options`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`case_opening_id`) REFERENCES `case_openings_history`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Referrals Table
CREATE TABLE IF NOT EXISTS `referrals` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `referrer_user_id` INT NOT NULL,
    `referred_user_id` INT NOT NULL UNIQUE,
    `status` ENUM('pending_purchase', 'completed', 'expired') NOT NULL DEFAULT 'pending_purchase',
    `reward_amount_gh` DECIMAL(10, 2) NULL,
    `reward_description` VARCHAR(255) NULL,
    `related_balance_transaction_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `reward_claimed_at` TIMESTAMP NULL,
    FOREIGN KEY (`referrer_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`related_balance_transaction_id`) REFERENCES `balance_transactions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Site Settings Table
CREATE TABLE IF NOT EXISTS `site_settings` (
    `id` INT NOT NULL DEFAULT 1,
    `site_name` VARCHAR(255) DEFAULT 'GreenHacks',
    `site_description` TEXT,
    `logo_url` VARCHAR(1024),
    `footer_text` TEXT,
    PRIMARY KEY (`id`),
    CONSTRAINT pk_site_settings_id_is_1 CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
INSERT IGNORE INTO `site_settings` (`id`, `site_name`, `footer_text`) VALUES (1, 'GreenHacks', '© 2024 GreenHacks. Все права защищены.');

-- Site Navigation Items Table
CREATE TABLE IF NOT EXISTS `site_navigation_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `label` VARCHAR(100) NOT NULL,
    `href` VARCHAR(255) NOT NULL,
    `icon_name` VARCHAR(50) NULL DEFAULT NULL,
    `item_order` INT NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- SMTP Settings Table
CREATE TABLE IF NOT EXISTS `site_smtp_settings` (
    `id` INT NOT NULL DEFAULT 1,
    `smtp_host` VARCHAR(255) NULL DEFAULT NULL,
    `smtp_port` INT NULL DEFAULT NULL,
    `smtp_username` VARCHAR(255) NULL DEFAULT NULL,
    `smtp_password` VARCHAR(255) NULL DEFAULT NULL,
    `smtp_encryption` ENUM('none', 'ssl', 'tls') NULL DEFAULT 'none',
    `from_email` VARCHAR(255) NULL DEFAULT NULL,
    `from_name` VARCHAR(255) NULL DEFAULT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT pk_site_smtp_settings_id_is_1 CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
INSERT IGNORE INTO `site_smtp_settings` (`id`, `smtp_port`, `smtp_encryption`) VALUES (1, 587, 'tls');

-- Site Notification Settings Table
CREATE TABLE IF NOT EXISTS `site_notification_settings` (
    `id` INT NOT NULL DEFAULT 1,
    `notify_on_registration` BOOLEAN NOT NULL DEFAULT TRUE,
    `notify_on_balance_deposit` BOOLEAN NOT NULL DEFAULT TRUE,
    `notify_on_product_purchase` BOOLEAN NOT NULL DEFAULT TRUE,
    `notify_on_support_reply` BOOLEAN NOT NULL DEFAULT FALSE,
    `notify_on_software_activation` BOOLEAN NOT NULL DEFAULT FALSE,
    `notify_on_license_expiry_soon` BOOLEAN NOT NULL DEFAULT FALSE,
    `notify_on_promotions` BOOLEAN NOT NULL DEFAULT FALSE,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT pk_site_notification_settings_id_is_1 CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
INSERT IGNORE INTO `site_notification_settings` (`id`) VALUES (1);

-- Site Telegram Settings Table
CREATE TABLE IF NOT EXISTS `site_telegram_settings` (
    `id` INT NOT NULL DEFAULT 1,
    `client_bot_token` VARCHAR(255) NULL DEFAULT NULL,
    `client_bot_chat_id` VARCHAR(255) NULL DEFAULT NULL,
    `admin_bot_token` VARCHAR(255) NULL DEFAULT NULL,
    `admin_bot_chat_ids` TEXT NULL,
    `key_bot_token` VARCHAR(255) NULL DEFAULT NULL,
    `key_bot_admin_chat_ids` TEXT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT pk_site_telegram_settings_id_is_1 CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
INSERT IGNORE INTO `site_telegram_settings` (`id`) VALUES (1);

-- Admin Telegram Notification Preferences Table
CREATE TABLE IF NOT EXISTS `admin_telegram_notification_prefs` (
    `id` INT NOT NULL DEFAULT 1,
    `notify_admin_on_balance_deposit` BOOLEAN NOT NULL DEFAULT FALSE,
    `notify_admin_on_product_purchase` BOOLEAN NOT NULL DEFAULT FALSE,
    `notify_admin_on_promo_code_creation` BOOLEAN NOT NULL DEFAULT FALSE,
    `notify_admin_on_admin_login` BOOLEAN NOT NULL DEFAULT FALSE,
    `notify_admin_on_key_activation_request` BOOLEAN NOT NULL DEFAULT FALSE,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT pk_admin_telegram_notification_prefs_id_is_1 CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
INSERT IGNORE INTO `admin_telegram_notification_prefs` (`id`) VALUES (1);

-- Payment Requests Table (for manual/test deposits)
CREATE TABLE IF NOT EXISTS `payment_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `username` VARCHAR(255) NULL,
    `amount_gh` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'pending_yoomoney') NOT NULL DEFAULT 'pending',
    `payment_method_details` VARCHAR(255) DEFAULT 'Тестовый платеж (Card)',
    `admin_notes` TEXT NULL,
    `external_payment_id` VARCHAR(255) NULL DEFAULT NULL,
    `payment_gateway` VARCHAR(50) NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Promo Codes Table
CREATE TABLE IF NOT EXISTS `promo_codes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(255) NOT NULL UNIQUE,
    `type` ENUM('balance_gh', 'product') NOT NULL,
    `value_gh` DECIMAL(10, 2) NULL DEFAULT NULL,
    `related_product_id` VARCHAR(255) NULL DEFAULT NULL,
    `product_pricing_option_id` INT NULL DEFAULT NULL,
    `max_uses` INT NOT NULL DEFAULT 1,
    `current_uses` INT NOT NULL DEFAULT 0,
    `expires_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`related_product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`product_pricing_option_id`) REFERENCES `product_pricing_options`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- User Promo Code Uses Table
CREATE TABLE IF NOT EXISTS `user_promo_code_uses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `promo_code_id` INT NOT NULL,
    `used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_user_promo_code` (`user_id`, `promo_code_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Site Banners Table
CREATE TABLE IF NOT EXISTS `site_banners` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(255) NULL DEFAULT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `image_url` VARCHAR(1024) NOT NULL,
    `image_alt_text` VARCHAR(255) NULL DEFAULT NULL,
    `button_text` VARCHAR(100) NULL DEFAULT NULL,
    `button_link` VARCHAR(1024) NULL DEFAULT NULL,
    `item_order` INT NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `hero_image_object_position` VARCHAR(100) DEFAULT 'center center',
    `hero_image_hint` VARCHAR(255) DEFAULT NULL,
    `price_text` VARCHAR(100) DEFAULT NULL,
    `game_slug` VARCHAR(255) DEFAULT NULL,
    `related_product_slug_1` VARCHAR(255) NULL DEFAULT NULL,
    `related_product_slug_2` VARCHAR(255) NULL DEFAULT NULL,
    `related_product_slug_3` VARCHAR(255) NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`game_slug`) REFERENCES `games`(`slug`) ON DELETE SET NULL,
    FOREIGN KEY (`related_product_slug_1`) REFERENCES `products`(`slug`) ON DELETE SET NULL,
    FOREIGN KEY (`related_product_slug_2`) REFERENCES `products`(`slug`) ON DELETE SET NULL,
    FOREIGN KEY (`related_product_slug_3`) REFERENCES `products`(`slug`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- Site Payment Gateway Settings Table
CREATE TABLE IF NOT EXISTS `site_payment_gateway_settings` (
    `id` INT NOT NULL DEFAULT 1,
    `gateway_name` VARCHAR(50) DEFAULT 'yoomoney',
    `yoomoney_shop_id` VARCHAR(255) NULL DEFAULT NULL,
    `yoomoney_secret_key` VARCHAR(255) NULL DEFAULT NULL,
    `yoomoney_webhook_url` VARCHAR(255) NULL DEFAULT '/api/payment/yoomoney-webhook',
    `yoomoney_notify_payment_succeeded` BOOLEAN NOT NULL DEFAULT TRUE,
    `yoomoney_notify_payment_waiting_for_capture` BOOLEAN NOT NULL DEFAULT FALSE,
    `yoomoney_notify_payment_canceled` BOOLEAN NOT NULL DEFAULT TRUE,
    `yoomoney_notify_refund_succeeded` BOOLEAN NOT NULL DEFAULT TRUE,
    `is_test_mode_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT pk_site_payment_gateway_settings_id_is_1 CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
INSERT IGNORE INTO `site_payment_gateway_settings` (`id`, `yoomoney_webhook_url`, `is_test_mode_active`) VALUES (1, '/api/payment/yoomoney-webhook', TRUE);


-- Add missing foreign keys after tables are created
ALTER TABLE `balance_transactions`
ADD CONSTRAINT `fk_balance_transactions_purchase` FOREIGN KEY (`related_purchase_id`) REFERENCES `purchases`(`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_balance_transactions_case_opening` FOREIGN KEY (`related_case_opening_id`) REFERENCES `case_openings_history`(`id`) ON DELETE SET NULL;


-- Add some sample data (optional, you can manage this via admin panel)
INSERT IGNORE INTO `games` (`id`, `slug`, `name`, `description`, `min_price`, `image_url`, `logo_url`, `platform`, `data_ai_hint`) VALUES
(1, 'warface', 'Warface', 'Популярный онлайн-шутер с множеством режимов.', 150.00, 'https://avatars.mds.yandex.net/i?id=2d31d8b6345e119da1ccf6f8a983fe21_l-5348153-images-thumbs&n=13', 'https://placehold.co/150x150.png?text=WF', 'PC', 'warface game icon'),
(2, 'call-of-duty-warzone', 'Call of Duty: Warzone', 'Королевская битва во вселенной Call of Duty.', 200.00, 'https://placehold.co/800x400.png?text=Warzone', 'https://placehold.co/150x150.png?text=WZ', 'PC, PS, Xbox', 'warzone game icon'),
(3, 'rust', 'Rust', 'Многопользовательская игра на выживание.', 250.00, 'https://placehold.co/800x400.png?text=Rust', 'https://placehold.co/150x150.png?text=RS', 'PC', 'rust game icon'),
(4, 'pubg', 'PUBG: Battlegrounds', 'Одна из первых и самых популярных королевских битв.', 180.00, 'https://i.ytimg.com/vi/YytiR1v_J0Y/maxresdefault.jpg', 'https://placehold.co/150x150.png?text=PUBG', 'PC, PS, Xbox', 'pubg game icon');


INSERT IGNORE INTO `products` (
    `id`, `name`, `slug`, `game_slug`, `image_url`, `status`, `status_text`, `short_description`, `long_description`, `data_ai_hint`, `system_os`, `system_build`, `system_gpu`, `system_cpu`, `mode`, `gallery_image_urls`, `functions_aim`, `functions_wallhack`, `functions_misc`, `created_at`, `updated_at`
) VALUES 
('unithack-warface', 'UnitHack', 'unithack-warface', 'warface', 'https://placehold.co/400x300.png?text=UnitHack', 'safe', 'Безопасен', 'Продвинутый чит для Warface.', 'Полное описание UnitHack...', 'warface cheat', 'Windows 10/11', '22H2+', 'Nvidia/AMD', 'Intel/AMD', 'PVE', 'https://static.wixstatic.com/media/de06e2_b2f59ac0625a4b7ba81933b5ca6ac7be~mv2.jpg/v1/fill/w_459,h_564,al_c,q_80,enc_auto/de06e2_b2f59ac0625a4b7ba81933b5ca6ac7be~mv2.jpg', 'Точный Aimbot, Silent Aim', 'ESP на игроков, Показ скелета', 'Без отдачи, Анти-флеш', NOW(), NOW()),
('gallant-hack-warface', 'Gallant Hack', 'gallant-hack-warface', 'warface', 'https://placehold.co/400x300.png?text=Gallant', 'safe', 'Безопасен', 'Надежный чит для Warface.', 'Описание Gallant Hack...', 'warface cheat reliable', 'Windows 10/11', '21H2+', 'Nvidia/AMD', 'Intel/AMD', 'BOTH', NULL, 'Aimbot, Triggerbot', 'Chams, ESP Box', 'Speedhack, No Spread', NOW(), NOW()),
('aqua-hack-warface', 'Aqua Hack', 'aqua-hack-warface', 'warface', 'https://placehold.co/400x300.png?text=Aqua', 'updating', 'Обновляется', 'Многофункциональный чит.', 'Описание Aqua Hack...', 'warface cheat multi', 'Windows 10/11', '20H2+', 'Nvidia', 'Intel', 'PVP', NULL, 'Aimbot, FOV', 'ESP Lines, Health', 'Radar, No Recoil', NOW(), NOW()),
('pubg-hack-pro', 'PUBG Hack Pro', 'pubg-hack-pro', 'pubg', 'https://placehold.co/400x300.png?text=PUBGPro', 'safe', 'Безопасен', 'Профессиональный чит для PUBG.', 'Описание PUBG Hack Pro...', 'pubg cheat pro', 'Windows 10/11', 'All', 'Nvidia/AMD', 'Intel/AMD', 'PVP', NULL, 'Aimbot, Magic Bullet', 'Player ESP, Item ESP', 'Radar, Vehicle ESP', NOW(), NOW()),
('pubglite-hack', 'PubLite Hack', 'pubglite-hack', 'pubg', 'https://placehold.co/400x300.png?text=PUBGLite', 'safe', 'Безопасен', 'Легкий чит для PUBG.', 'Описание PubLite Hack...', 'pubg cheat lite', 'Windows 10/11', 'All', 'Nvidia/AMD', 'Intel/AMD', 'PVP', NULL, 'Simple Aimbot', 'Basic ESP', 'No Recoil', NOW(), NOW()),
('greenpubg-special', 'GreenPUBG Special', 'greenpubg-special', 'pubg', 'https://placehold.co/400x300.png?text=GreenPUBG', 'risky', 'Рискованно', 'Эксклюзивный чит для PUBG.', 'Описание GreenPUBG Special...', 'pubg cheat exclusive', 'Windows 10/11', 'Latest', 'Nvidia', 'Intel', 'PVP', NULL, 'Advanced Aimbot, Prediction', 'Full ESP, Loot ESP', 'Fly hack (use with caution)', NOW(), NOW());

INSERT IGNORE INTO `product_pricing_options` (`product_id`, `duration_days`, `price_rub`, `price_gh`, `is_pvp`) VALUES
('unithack-warface', 1, 150.00, 150.00, FALSE),('unithack-warface', 7, 300.00, 300.00, FALSE),('unithack-warface', 14, 1000.00, 1000.00, FALSE),('unithack-warface', 30, 1500.00, 1500.00, FALSE),
('gallant-hack-warface', 1, 160.00, 160.00, TRUE),('gallant-hack-warface', 7, 320.00, 320.00, TRUE),('gallant-hack-warface', 30, 1600.00, 1600.00, TRUE),
('aqua-hack-warface', 1, 100.00, 100.00, FALSE),('aqua-hack-warface', 7, 250.00, 250.00, FALSE),
('pubg-hack-pro', 7, 500.00, 500.00, TRUE),('pubg-hack-pro', 30, 1800.00, 1800.00, TRUE),
('pubglite-hack', 30, 200.00, 200.00, TRUE),
('greenpubg-special', 7, 700.00, 700.00, TRUE);

INSERT IGNORE INTO `site_navigation_items` (`label`, `href`, `icon_name`, `item_order`, `is_visible`) VALUES
('Главная', '/', 'Home', 0, TRUE),
('Каталог игр', '/games', 'LayoutGrid', 1, TRUE),
('Отзывы', '/#reviews', 'Star', 2, TRUE),
('FAQ & Поддержка', '/#faq-support', 'HelpCircle', 3, TRUE),
('Правила и Оферта', '/#rules', 'FileText', 4, TRUE),
('Статус Читов', '/#status', 'BarChart3', 5, TRUE);

INSERT IGNORE INTO `site_banners` (`id`, `title`, `subtitle`, `description`, `image_url`, `button_text`, `button_link`, `item_order`, `is_active`, `hero_image_object_position`, `price_text`, `game_slug`, `related_product_slug_1`, `related_product_slug_2`, `related_product_slug_3`) VALUES
(1, 'Warface', 'Приватные читы для', 'Широкий выбор читов, которые помогут повысить вашу эффективность и дать больше шансов на победу!', 'https://avatars.mds.yandex.net/i?id=2d31d8b6345e119da1ccf6f8a983fe21_l-5348153-images-thumbs&n=13', 'Подробнее', '/games/warface', 0, 1, 'center top', 'от 150 ₽', 'warface', 'unithack-warface', 'gallant-hack-warface', 'aqua-hack-warface'),
(2, 'PUBG', 'Приватные читы для', 'Надежные и безопасные читы для PUBG. Станьте королем битвы уже сегодня!', 'https://i.ytimg.com/vi/YytiR1v_J0Y/maxresdefault.jpg', 'Все читы для PUBG', '/games/pubg', 1, 1, 'center center', 'от 200 ₽', 'pubg', 'pubg-hack-pro', 'pubglite-hack', 'greenpubg-special');


-- Add example users
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `balance`, `referral_code`, `referred_by_user_id`, `created_at`, `updated_at`, `telegram_id`) VALUES
(1, 'admin', 'admin@example.com', '$2a$10$021MaUt1zUkjRl9qoL6U6eJ8Jo327Fj3JZ.t0h/U.M3otc6VDjSjW', 'admin', '10000.00', 'GH-ADMIN001', NULL, '2025-05-10 10:00:00', '2025-05-10 10:00:00', NULL),
(2, 'testuser', 'test@example.com', '$2a$10$NvAibTunPvb2rXPTItmtve4GTx9OjXSC6jfcCShkaK27xC55xZHry', 'client', '500.00', 'GH-TESTU002', 1, '2025-05-11 11:00:00', '2025-05-11 11:00:00', NULL);


COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
