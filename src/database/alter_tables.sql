
-- Add product_name to user_inventory if it doesn't exist
ALTER TABLE user_inventory
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) NOT NULL AFTER related_product_id;

-- Add product_image_url to user_inventory if it doesn't exist
ALTER TABLE user_inventory
ADD COLUMN IF NOT EXISTS product_image_url VARCHAR(1024) NULL AFTER product_name;

-- Add case_opening_id to user_inventory if it doesn't exist
ALTER TABLE user_inventory
ADD COLUMN IF NOT EXISTS case_opening_id INT NULL AFTER is_used,
ADD CONSTRAINT fk_inventory_case_opening
FOREIGN KEY (case_opening_id) REFERENCES case_openings_history(id) ON DELETE SET NULL;

-- Add balance_transaction_id to purchases table if it doesn't exist
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS balance_transaction_id INT NULL AFTER status,
ADD CONSTRAINT fk_purchase_balance_transaction_new
FOREIGN KEY (balance_transaction_id) REFERENCES balance_transactions(id) ON DELETE SET NULL;

-- Add purchase_id to user_inventory table if it doesn't exist
ALTER TABLE user_inventory
ADD COLUMN IF NOT EXISTS purchase_id INT NULL AFTER case_opening_id,
ADD CONSTRAINT fk_inventory_purchase
FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL;

-- Add product_pricing_option_id to user_inventory table if it doesn't exist
ALTER TABLE user_inventory
ADD COLUMN IF NOT EXISTS product_pricing_option_id INT NULL AFTER related_product_id,
ADD CONSTRAINT fk_inventory_pricing_option
FOREIGN KEY (product_pricing_option_id) REFERENCES product_pricing_options(id) ON DELETE SET NULL;

-- Add 'mode' column to products table if it doesn't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS mode ENUM('PVE', 'PVP', 'BOTH') NULL AFTER data_ai_hint;

-- Add gallery_image_urls column to products table if it doesn't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS gallery_image_urls TEXT NULL AFTER mode;

-- Add function columns to products table if they don't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS functions_aim TEXT NULL AFTER gallery_image_urls,
ADD COLUMN IF NOT EXISTS functions_wallhack TEXT NULL AFTER functions_aim,
ADD COLUMN IF NOT EXISTS functions_misc TEXT NULL AFTER functions_wallhack;

-- Add system requirement columns to products table if they don't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS system_os VARCHAR(255) NULL AFTER functions_misc,
ADD COLUMN IF NOT EXISTS system_build VARCHAR(255) NULL AFTER system_os,
ADD COLUMN IF NOT EXISTS system_gpu VARCHAR(255) NULL AFTER system_build,
ADD COLUMN IF NOT EXISTS system_cpu VARCHAR(255) NULL AFTER system_gpu;

-- Modify case_openings_history action_taken to include 'pending'
ALTER TABLE case_openings_history
MODIFY COLUMN action_taken ENUM('kept', 'sold', 'pending') NOT NULL DEFAULT 'pending';

-- Ensure related_product_id in case_prizes can be NULL
ALTER TABLE case_prizes
MODIFY COLUMN related_product_id VARCHAR(255) NULL;

-- Ensure related_product_id in user_inventory can be NULL and has FK
ALTER TABLE user_inventory
MODIFY COLUMN related_product_id VARCHAR(255) NULL;
-- If the foreign key was dropped, re-add it carefully:
-- ALTER TABLE user_inventory ADD CONSTRAINT fk_inventory_product FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Ensure case_prize_id in user_inventory can be NULL and has FK
ALTER TABLE user_inventory
MODIFY COLUMN case_prize_id VARCHAR(255) NULL;
-- If the foreign key was dropped, re-add it carefully:
-- ALTER TABLE user_inventory ADD CONSTRAINT fk_inventory_case_prize FOREIGN KEY (case_prize_id) REFERENCES case_prizes(id) ON DELETE SET NULL;

-- Add telegram_id to users table if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(255) NULL AFTER updated_at;

-- Ensure referred_by_user_id in users table can be NULL
ALTER TABLE users
MODIFY COLUMN referred_by_user_id INT NULL;

-- Add Indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_ppo_product_id ON product_pricing_options(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_related_product_id ON user_inventory(related_product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_ppo_id ON user_inventory(product_pricing_option_id);
CREATE INDEX IF NOT EXISTS idx_purchases_balance_transaction_id ON purchases(balance_transaction_id);

-- Drop old foreign key if it exists and has a different name (be careful with this)
-- SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND CONSTRAINT_NAME = 'purchases_ibfk_3' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
-- SET @sql = IF(@fk_exists > 0, 'ALTER TABLE purchases DROP FOREIGN KEY purchases_ibfk_3;', 'SELECT "Old FK on purchases.balance_transaction_id not found or already dropped." AS message;');
-- PREPARE stmt FROM @sql;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- Make sure the FK constraint is correctly named, this might be specific to your DB's auto-naming
-- If 'fk_purchase_balance_transaction' already exists from a previous schema.sql run, this specific ADD CONSTRAINT might fail.
-- Consider a more robust way to check or use MODIFY COLUMN with ADD CONSTRAINT IF NOT EXISTS syntax if available for your MySQL version
-- For example, you might need to drop it first if it exists with a different definition or name
-- ALTER TABLE purchases DROP FOREIGN KEY IF EXISTS `name_of_existing_fk_on_balance_transaction_id`;
-- ALTER TABLE purchases ADD CONSTRAINT fk_purchase_balance_transaction FOREIGN KEY (balance_transaction_id) REFERENCES balance_transactions(id) ON DELETE SET NULL;


-- Change product_id in product_pricing_options to VARCHAR(255)
-- This requires dropping and re-adding the foreign key if it exists
-- First, find the name of the foreign key constraint on product_pricing_options.product_id
-- SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_pricing_options' AND COLUMN_NAME = 'product_id' AND REFERENCED_TABLE_NAME = 'products';
-- Then drop it (replace 'your_fk_name_here' with the actual name):
-- ALTER TABLE product_pricing_options DROP FOREIGN KEY your_fk_name_here;
-- ALTER TABLE product_pricing_options MODIFY COLUMN product_id VARCHAR(255) NOT NULL;
-- Re-add the foreign key constraint
-- ALTER TABLE product_pricing_options ADD CONSTRAINT fk_ppo_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Change related_product_id in case_prizes to VARCHAR(255)
-- Similar steps: find FK name, drop FK, modify column, re-add FK
-- ALTER TABLE case_prizes DROP FOREIGN KEY your_fk_name_for_related_product_id;
-- ALTER TABLE case_prizes MODIFY COLUMN related_product_id VARCHAR(255) NULL;
-- ALTER TABLE case_prizes ADD CONSTRAINT fk_caseprize_related_product FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Change won_prize_id in case_openings_history to VARCHAR(255)
-- ALTER TABLE case_openings_history DROP FOREIGN KEY your_fk_name_for_won_prize_id;
-- ALTER TABLE case_openings_history MODIFY COLUMN won_prize_id VARCHAR(255) NOT NULL;
-- ALTER TABLE case_openings_history ADD CONSTRAINT fk_caseopening_won_prize FOREIGN KEY (won_prize_id) REFERENCES case_prizes(id);

-- Change case_prize_id in user_inventory to VARCHAR(255)
-- ALTER TABLE user_inventory DROP FOREIGN KEY your_fk_name_for_ui_case_prize_id;
-- ALTER TABLE user_inventory MODIFY COLUMN case_prize_id VARCHAR(255) NULL;
-- ALTER TABLE user_inventory ADD CONSTRAINT fk_inventory_case_prize_new FOREIGN KEY (case_prize_id) REFERENCES case_prizes(id) ON DELETE SET NULL;

-- Add product_id to purchases table if it does not exist and is not a primary key
-- ALTER TABLE purchases ADD COLUMN IF NOT EXISTS product_id VARCHAR(255) NOT NULL AFTER user_id;
-- Add foreign key for product_id in purchases table if not already present
-- SELECT IF (
--   (SELECT COUNT(*)
--   FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
--   WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME = 'purchases'
--   AND COLUMN_NAME = 'product_id'
--   AND REFERENCED_TABLE_NAME = 'products'
--   ) = 0,
--   'ALTER TABLE purchases ADD CONSTRAINT fk_purchase_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;',
--   'SELECT "Foreign key fk_purchase_product already exists or column setup is different." AS message;'
-- ) INTO @alter_statement;
-- PREPARE stmt FROM @alter_statement;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;
