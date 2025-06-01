
-- GreenHack Database Schema (Conceptual)
-- This is a basic schema. You'll need to adapt and expand it based on your specific needs.
-- Remember to use appropriate data types and constraints for your MySQL version.

-- Users Table (Firebase Auth will handle primary authentication, this table stores additional profile info)
CREATE TABLE IF NOT EXISTS Users (
    uid VARCHAR(255) PRIMARY KEY, -- Firebase User ID
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    role ENUM('client', 'booster', 'admin') DEFAULT 'client',
    balance DECIMAL(10, 2) DEFAULT 0.00, -- GH currency
    referral_code VARCHAR(20) UNIQUE,
    referred_by_uid VARCHAR(255) NULL, -- UID of the user who referred this user
    telegram_id VARCHAR(255) NULL UNIQUE, -- For Telegram linking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (referred_by_uid) REFERENCES Users(uid) ON DELETE SET NULL
);

-- Products Table (Cheats, Services, etc.)
CREATE TABLE IF NOT EXISTS Products (
    id VARCHAR(255) PRIMARY KEY, -- Could be a slug or a UUID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL, -- Price in GH
    category VARCHAR(100), -- e.g., 'warface_cheat', 'rust_boost'
    type ENUM('cheat', 'boost_service', 'case_key') NOT NULL,
    -- Add other product-specific fields (e.g., duration_days for cheats)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Purchases Table (Transaction history)
CREATE TABLE IF NOT EXISTS Purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL, -- Amount in GH
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
    -- Add details like payment_gateway_transaction_id if integrating with external payments
    FOREIGN KEY (user_uid) REFERENCES Users(uid),
    FOREIGN KEY (product_id) REFERENCES Products(id)
);

-- Cases Table (Definition of a case)
CREATE TABLE IF NOT EXISTS Cases (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL, -- Cost to open in GH
    image_url VARCHAR(2048),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CasePrizes Table (Possible prizes within a case and their chances)
CREATE TABLE IF NOT EXISTS CasePrizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(255) NOT NULL,
    prize_name VARCHAR(255) NOT NULL,
    prize_description TEXT, -- e.g., "Unit Hack 7 Дней"
    prize_image_url VARCHAR(2048),
    prize_type ENUM('product_subscription', 'balance_gh', 'physical_item') DEFAULT 'product_subscription',
    prize_value_product_id VARCHAR(255) NULL, -- FK to Products if it's a product subscription
    prize_value_gh DECIMAL(10, 2) NULL, -- Amount of GH if prize is balance
    prize_duration_days INT NULL, -- For subscriptions
    chance DECIMAL(5, 4) NOT NULL, -- Probability (e.g., 0.10 for 10%)
    sell_value_gh DECIMAL(10, 2) NULL, -- Value in GH if sold back
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES Cases(id),
    FOREIGN KEY (prize_value_product_id) REFERENCES Products(id)
);

-- UserCaseOpenings Table (History of cases opened by users)
CREATE TABLE IF NOT EXISTS UserCaseOpenings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    case_id VARCHAR(255) NOT NULL,
    case_prize_id INT NOT NULL, -- FK to CasePrizes
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_taken ENUM('kept', 'sold') NOT NULL,
    sold_value_gh DECIMAL(10, 2) NULL, -- If sold, the GH amount received
    FOREIGN KEY (user_uid) REFERENCES Users(uid),
    FOREIGN KEY (case_id) REFERENCES Cases(id),
    FOREIGN KEY (case_prize_id) REFERENCES CasePrizes(id)
);

-- UserInventory Table (Items the user decided to keep)
CREATE TABLE IF NOT EXISTS UserInventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    case_opening_id INT NULL UNIQUE, -- Link to the specific case opening if won from a case
    product_id VARCHAR(255) NULL, -- Link to Products table if it's a direct product or a product won
    item_name VARCHAR(255) NOT NULL, -- Could be denormalized from CasePrizes or Products
    item_description TEXT,
    item_image_url VARCHAR(2048),
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL, -- For timed items
    activation_details TEXT NULL, -- e.g., a key or instructions
    FOREIGN KEY (user_uid) REFERENCES Users(uid),
    FOREIGN KEY (case_opening_id) REFERENCES UserCaseOpenings(id),
    FOREIGN KEY (product_id) REFERENCES Products(id)
);

-- Referrals Table
CREATE TABLE IF NOT EXISTS Referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_uid VARCHAR(255) NOT NULL, -- User who referred
    referred_uid VARCHAR(255) NOT NULL UNIQUE, -- User who was referred
    status ENUM('pending_purchase', 'completed', 'expired') DEFAULT 'pending_purchase',
    bonus_earned_gh DECIMAL(10, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (referrer_uid) REFERENCES Users(uid),
    FOREIGN KEY (referred_uid) REFERENCES Users(uid)
);

-- BalanceTransactions Table
CREATE TABLE IF NOT EXISTS BalanceTransactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    type ENUM('deposit', 'purchase_product', 'open_case', 'sell_prize', 'referral_bonus', 'admin_adjustment') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL, -- Can be positive (deposit, sell) or negative (purchase, open case)
    description VARCHAR(255) NULL,
    related_purchase_id INT NULL,
    related_case_opening_id INT NULL,
    related_referral_id INT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uid) REFERENCES Users(uid),
    FOREIGN KEY (related_purchase_id) REFERENCES Purchases(id),
    FOREIGN KEY (related_case_opening_id) REFERENCES UserCaseOpenings(id),
    FOREIGN KEY (related_referral_id) REFERENCES Referrals(id)
);

-- Boosters Table (For the "Booster" user role)
CREATE TABLE IF NOT EXISTS Boosters (
    user_uid VARCHAR(255) PRIMARY KEY,
    specialization TEXT, -- e.g., "Warface Rank Boost", "PUBG Chicken Dinners"
    rating DECIMAL(3, 2) DEFAULT NULL, -- Average rating from clients
    completed_orders INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_uid) REFERENCES Users(uid)
);

-- BoostingServices Table (Services offered by boosters)
CREATE TABLE IF NOT EXISTS BoostingServices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booster_uid VARCHAR(255) NOT NULL,
    game_id VARCHAR(255) NOT NULL, -- Could be a slug or FK to a Games table if you have one
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    price_gh DECIMAL(10, 2) NOT NULL,
    estimated_completion_time VARCHAR(100), -- e.g., "24-48 hours"
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (booster_uid) REFERENCES Boosters(user_uid)
    -- FOREIGN KEY (game_id) REFERENCES Games(id) -- If you have a Games table
);

-- BoostingOrders Table
CREATE TABLE IF NOT EXISTS BoostingOrders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_uid VARCHAR(255) NOT NULL,
    booster_uid VARCHAR(255) NOT NULL,
    service_id INT NOT NULL,
    status ENUM('pending_payment', 'pending_acceptance', 'in_progress', 'completed', 'cancelled_by_client', 'cancelled_by_booster', 'disputed') NOT NULL,
    order_details TEXT, -- Client might provide account details here (handle securely!)
    price_paid_gh DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    client_review_rating INT NULL CHECK (client_review_rating BETWEEN 1 AND 5),
    client_review_comment TEXT NULL,
    FOREIGN KEY (client_uid) REFERENCES Users(uid),
    FOREIGN KEY (booster_uid) REFERENCES Boosters(user_uid),
    FOREIGN KEY (service_id) REFERENCES BoostingServices(id)
);


-- Note: For storing sensitive data like game account credentials for boosting services,
-- consider encryption and very strict access controls. This schema is conceptual.
-- Always prioritize security best practices.
