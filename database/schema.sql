
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

-- Games Table (was Categories in user's DDL, using 'games' for clarity)
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    min_price DECIMAL(10, 2) DEFAULT 0.00,
    image_url VARCHAR(1024), -- For category/icon display
    banner_url VARCHAR(1024), -- For game detail page banner
    platform VARCHAR(255),
    tags TEXT, -- Comma-separated, or consider a separate tags table for many-to-many
    data_ai_hint VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    game_slug VARCHAR(255) NOT NULL, -- References games.slug for easier joining
    image_url VARCHAR(1024),
    status ENUM('safe', 'updating', 'risky', 'unknown') NOT NULL DEFAULT 'unknown',
    status_text VARCHAR(255),
    price_text VARCHAR(100), -- e.g., "от 150₽ и 150 GH"
    base_price_gh DECIMAL(10, 2) DEFAULT 0.00, -- For default/base cost reference
    short_description TEXT,
    long_description TEXT,
    data_ai_hint VARCHAR(255),
    mode ENUM('PVE', 'PVP', 'BOTH') NULL,
    gallery_image_urls TEXT NULL, -- Comma-separated URLs
    functions_aim TEXT NULL, -- Comma-separated
    functions_wallhack TEXT NULL, -- Comma-separated
    functions_misc TEXT NULL, -- Comma-separated
    system_os VARCHAR(255) NULL,
    system_build VARCHAR(255) NULL,
    system_gpu VARCHAR(255) NULL,
    system_cpu VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    -- Consider adding FOREIGN KEY (game_slug) REFERENCES games(slug) if DB supports it well for VARCHAR keys
    -- Or, add game_id INT and FOREIGN KEY (game_id) REFERENCES games(id) for stricter FKs
);

-- Product Pricing Options Table
CREATE TABLE IF NOT EXISTS product_pricing_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
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
    related_product_id INT NULL, -- FK to products.id
    duration_days INT NULL,
    balance_gh_amount DECIMAL(10, 2) NULL,
    image_url VARCHAR(1024),
    chance DECIMAL(5, 4) NOT NULL,
    sell_value_gh DECIMAL(10, 2) NULL,
    data_ai_hint VARCHAR(255),
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE SET NULL
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
    case_prize_id VARCHAR(255) NULL, -- Prize from a case
    product_id INT NULL, -- Product if bought directly or from case prize
    product_name VARCHAR(255) NOT NULL, -- Denormalized for easy display
    product_image_url VARCHAR(1024), -- Denormalized
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
    FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE
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


-- Site Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255) DEFAULT 'Green Hack',
    site_description TEXT,
    logo_url VARCHAR(255),
    footer_text TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_products_game_slug ON products(game_slug);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_case_openings_user_id ON case_openings_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

