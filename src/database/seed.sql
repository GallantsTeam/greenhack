-- Этот файл содержит команды для начального заполнения базы данных.
-- Выполните эти команды в вашей MySQL базе данных (например, через phpMyAdmin).

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('client', 'booster', 'admin') NOT NULL DEFAULT 'client',
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    referral_code VARCHAR(50) UNIQUE,
    referred_by_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    telegram_id VARCHAR(255) NULL,
    FOREIGN KEY (referred_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Games Table (formerly Categories)
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    min_price DECIMAL(10, 2) DEFAULT 0.00,
    image_url VARCHAR(1024), -- For game banner
    logo_url VARCHAR(1024),  -- For category icon
    platform VARCHAR(100),
    tags TEXT, -- Comma-separated
    data_ai_hint VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY, -- Using slug or unique ID
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    game_slug VARCHAR(255) NOT NULL,
    image_url VARCHAR(1024),
    status ENUM('safe', 'updating', 'risky', 'unknown') NOT NULL DEFAULT 'unknown',
    status_text VARCHAR(255),
    short_description TEXT,
    long_description TEXT,
    data_ai_hint VARCHAR(255),
    mode ENUM('PVE', 'PVP', 'BOTH') NULL DEFAULT 'PVE',
    gallery_image_urls TEXT NULL, -- Comma-separated URLs
    functions_aim TEXT NULL,      -- Comma-separated
    functions_wallhack TEXT NULL, -- Comma-separated
    functions_misc TEXT NULL,     -- Comma-separated
    system_os VARCHAR(255) NULL,
    system_build VARCHAR(255) NULL,
    system_gpu VARCHAR(255) NULL,
    system_cpu VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_slug) REFERENCES games(slug) ON DELETE CASCADE
);

-- Product Pricing Options Table
CREATE TABLE IF NOT EXISTS product_pricing_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    duration_days INT NOT NULL,
    price_rub DECIMAL(10, 2) NOT NULL,
    price_gh DECIMAL(10, 2) NOT NULL,
    is_pvp BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


-- Cases Table
CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(1024),
    base_price_gh DECIMAL(10, 2) NOT NULL,
    description TEXT,
    data_ai_hint VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Case Prizes Table
CREATE TABLE IF NOT EXISTS case_prizes (
    id VARCHAR(255) PRIMARY KEY,
    case_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    prize_type ENUM('product_duration', 'balance_gh', 'physical_item') DEFAULT 'product_duration',
    related_product_id VARCHAR(255) NULL,
    duration_days INT NULL,
    balance_gh_amount DECIMAL(10, 2) NULL,
    image_url VARCHAR(1024),
    chance DECIMAL(5, 4) NOT NULL,
    sell_value_gh DECIMAL(10, 2) NULL,
    data_ai_hint VARCHAR(255),
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_pricing_option_id INT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount_paid_gh DECIMAL(10, 2) NOT NULL,
    status ENUM('completed', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'completed',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (product_pricing_option_id) REFERENCES product_pricing_options(id) ON DELETE SET NULL
);

-- Case Openings History Table
CREATE TABLE IF NOT EXISTS case_openings_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    case_id VARCHAR(255) NOT NULL,
    won_prize_id VARCHAR(255) NOT NULL,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_taken ENUM('kept', 'sold', 'pending') NOT NULL DEFAULT 'pending',
    sold_value_gh DECIMAL(10, 2) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (won_prize_id) REFERENCES case_prizes(id)
);

-- User Inventory Table
CREATE TABLE IF NOT EXISTS user_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    case_prize_id VARCHAR(255) NULL, -- If won from a case
    product_id VARCHAR(255) NULL, -- If direct product purchase or prize is a product
    product_name VARCHAR(255) NULL, -- Name of the product/prize, denormalized for convenience
    product_image_url VARCHAR(1024) NULL, -- Image of the product/prize
    activation_code VARCHAR(255) UNIQUE NULL,
    expires_at TIMESTAMP NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (case_prize_id) REFERENCES case_prizes(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_user_id INT NOT NULL,
    referred_user_id INT NOT NULL UNIQUE,
    status ENUM('pending_purchase', 'completed', 'expired') NOT NULL DEFAULT 'pending_purchase',
    reward_amount_gh DECIMAL(10, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reward_claimed_at TIMESTAMP NULL,
    FOREIGN KEY (referrer_user_id) REFERENCES users(id),
    FOREIGN KEY (referred_user_id) REFERENCES users(id)
);

-- Balance Transactions Table
CREATE TABLE IF NOT EXISTS balance_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transaction_type ENUM('deposit', 'purchase_product', 'open_case', 'sell_prize', 'referral_bonus', 'admin_adjustment') NOT NULL,
    amount_gh DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) NULL,
    related_purchase_id INT NULL,
    related_case_opening_id INT NULL,
    related_referral_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (related_purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
    FOREIGN KEY (related_case_opening_id) REFERENCES case_openings_history(id) ON DELETE SET NULL,
    FOREIGN KEY (related_referral_id) REFERENCES referrals(id) ON DELETE SET NULL
);

-- Example Indexes (add more as needed for performance)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_products_game_slug ON products(game_slug);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_case_openings_user_id ON case_openings_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id ON balance_transactions(user_id);


-- Seed data for Warface category (Game)
INSERT IGNORE INTO games (slug, name, description, min_price, image_url, logo_url, platform, tags, data_ai_hint) VALUES
('warface', 'Warface', 'Популярный онлайн-шутер с множеством режимов.', 150, 'https://avatars.mds.yandex.net/i?id=2d31d8b6345e119da1ccf6f8a983fe21_l-5348153-images-thumbs&n=13', 'https://picsum.photos/seed/warface-logo/150/150', 'PC', 'Шутер,Онлайн,Командный', 'warface game icon');

-- Seed data for UnitHack product
INSERT IGNORE INTO products (
    id, name, slug, game_slug, image_url, status, status_text,
    short_description, long_description, data_ai_hint,
    system_os, system_build, system_gpu, system_cpu, mode
) VALUES (
    'unithack-warface',
    'UnitHack',
    'unithack-warface',
    'warface',
    'https://picsum.photos/seed/unithack/600/400', -- Placeholder, replace with actual
    'safe',
    'Безопасен',
    'Передовое решение для Warface, обеспечивающее преимущество в бою.',
    'UnitHack - это многофункциональный чит для Warface, включающий в себя точный Aimbot, детализированный WallHack и множество других полезных функций. Помогает достигать высоких результатов, сохраняя безопасность аккаунта. Идеально подходит как для PvE, так и для PvP режимов, благодаря гибкой настройке.',
    'warface cheat unithack aimbot esp',
    'Windows 10/11',
    'Все сборки от 20H2 и выше',
    'Nvidia / AMD',
    'Intel / AMD',
    'PVE' -- Defaulting to PVE as per request, can be BOTH if applicable
);

-- Seed data for UnitHack pricing options (PVE mode)
INSERT IGNORE INTO product_pricing_options (product_id, duration_days, price_rub, price_gh, is_pvp) VALUES
('unithack-warface', 1, 150.00, 150.00, FALSE),
('unithack-warface', 7, 300.00, 300.00, FALSE),
('unithack-warface', 14, 1000.00, 1000.00, FALSE),
('unithack-warface', 30, 1500.00, 1500.00, FALSE);

-- Seed data for PUBG category (Game)
INSERT IGNORE INTO games (slug, name, description, min_price, image_url, logo_url, platform, tags, data_ai_hint) VALUES
('pubg', 'PUBG: Battlegrounds', 'Королевская битва, ставшая классикой жанра.', 100, 'https://i.ytimg.com/vi/YytiR1v_J0Y/maxresdefault.jpg', 'https://picsum.photos/seed/pubg-logo/150/150', 'PC, Console, Mobile', 'Battle Royale,Шутер,Выживание', 'pubg game icon');

-- Seed data for PUBG products
INSERT IGNORE INTO products (id, name, slug, game_slug, image_url, status, status_text, short_description, long_description, data_ai_hint, mode) VALUES
('pubg-hack', 'PUBG Hack', 'pubg-hack', 'pubg', 'https://picsum.photos/seed/pubghack/600/400', 'safe', 'Безопасен', 'Надежный чит для PUBG.', 'Детальное описание PUBG Hack... Содержит ESP, Aimbot и радар.', 'pubg cheat aimbot esp', 'BOTH'),
('publite-hack', 'PubLite Hack', 'publite-hack', 'pubg', 'https://picsum.photos/seed/publitehack/600/400', 'updating', 'Обновляется', 'Легковесный чит для PUBG Lite.', 'Описание PubLite Hack... Только ESP для минимальной нагрузки.', 'pubg lite cheat esp', 'BOTH'),
('greenpubg', 'GreenPubg', 'greenpubg', 'pubg', 'https://picsum.photos/seed/greenpubg/600/400', 'risky', 'Рискованно', 'Мощный, но рискованный чит.', 'Описание GreenPubg... Полный функционал, использовать с осторожностью.', 'pubg cheat risky full', 'BOTH');

-- Seed data for PUBG product pricing options
INSERT IGNORE INTO product_pricing_options (product_id, duration_days, price_rub, price_gh, is_pvp) VALUES
('pubg-hack', 7, 250.00, 250.00, FALSE), ('pubg-hack', 30, 800.00, 800.00, FALSE),
('publite-hack', 30, 100.00, 100.00, FALSE),
('greenpubg', 1, 120.00, 120.00, FALSE), ('greenpubg', 7, 500.00, 500.00, FALSE);


-- Seed data for a default Case
INSERT IGNORE INTO cases (id, name, image_url, base_price_gh, description, data_ai_hint, is_active) VALUES
('main-case-1', 'Стандартный Кейс Удачи', 'https://cdn.streamelements.com/uploads/ed049f7b-6dbd-419d-a279-c2e4db0f65f9.png', 100.00, 'Откройте кейс и получите шанс выиграть ценный приз!', 'loot box treasure', TRUE);

-- Seed data for Prizes in the 'main-case-1'
INSERT IGNORE INTO case_prizes (id, case_id, name, prize_type, related_product_id, duration_days, image_url, chance, sell_value_gh, data_ai_hint) VALUES
('prize-uh-1d', 'main-case-1', 'UnitHack 1 День', 'product_duration', 'unithack-warface', 1, 'https://picsum.photos/seed/uh1d/120/120', 0.30, 10, 'software chip'),
('prize-uh-3d', 'main-case-1', 'UnitHack 3 Дня', 'product_duration', 'unithack-warface', 3, 'https://picsum.photos/seed/uh3d/120/120', 0.20, 25, 'software package'),
('prize-uh-7d', 'main-case-1', 'UnitHack 7 Дней', 'product_duration', 'unithack-warface', 7, 'https://picsum.photos/seed/uh7d/120/120', 0.15, 60, 'software key'),
('prize-uh-30d', 'main-case-1', 'UnitHack 30 Дней', 'product_duration', 'unithack-warface', 30, 'https://picsum.photos/seed/uh30d/120/120', 0.10, 180, 'software disc'),
('prize-balance-50gh', 'main-case-1', '50 GH на баланс', 'balance_gh', NULL, NULL, 'https://picsum.photos/seed/gh50/120/120', 0.15, NULL, 'money coins gh'),
('prize-balance-200gh', 'main-case-1', '200 GH на баланс', 'balance_gh', NULL, NULL, 'https://picsum.photos/seed/gh200/120/120', 0.05, NULL, 'gold coins gh'),
('prize-balance-500gh', 'main-case-1', '500 GH на баланс', 'balance_gh', NULL, NULL, 'https://picsum.photos/seed/gh500/120/120', 0.03, NULL, 'diamond coins gh'),
('prize-pubg-7d', 'main-case-1', 'PUBG Hack 7 Дней', 'product_duration', 'pubg-hack', 7, 'https://picsum.photos/seed/pubgprize/120/120', 0.02, 150, 'pubg hack prize');

-- Add other games (Rust, Escape From Tarkov etc.)
INSERT IGNORE INTO games (slug, name, description, min_price, image_url, logo_url, platform, tags, data_ai_hint) VALUES
('rust', 'Rust', 'Многопользовательская игра на выживание.', 120, 'https://picsum.photos/seed/rustgame/800/400', 'https://picsum.photos/seed/rustlogo/150/150', 'PC', 'Выживание,Крафт,Мультиплеер', 'rust game icon'),
('escapefromtarkov', 'Escape From Tarkov', 'Хардкорный тактический шутер с элементами MMO.', 200, 'https://picsum.photos/seed/eftgame/800/400', 'https://picsum.photos/seed/eftlogo/150/150', 'PC', 'Шутер,Хардкор,MMO', 'escape from tarkov game icon');

-- Add sample products for these games (example)
INSERT IGNORE INTO products (id, name, slug, game_slug, image_url, status, short_description, mode) VALUES 
('rust-radar', 'Rust Radar', 'rust-radar', 'rust', 'https://picsum.photos/seed/rustradar/600/400', 'safe', 'Радар для Rust', 'BOTH'),
('eft-esp', 'EFT ESP', 'eft-esp', 'escapefromtarkov', 'https://picsum.photos/seed/eftesp/600/400', 'safe', 'ESP для Escape From Tarkov', 'BOTH');

INSERT IGNORE INTO product_pricing_options (product_id, duration_days, price_rub, price_gh, is_pvp) VALUES
('rust-radar', 7, 200.00, 200.00, FALSE),
('eft-esp', 7, 250.00, 250.00, FALSE);
