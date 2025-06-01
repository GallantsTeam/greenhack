
-- Update existing products table
ALTER TABLE products
ADD COLUMN mode ENUM('PVE', 'PVP', 'BOTH') DEFAULT 'PVE' NULL AFTER game_slug,
ADD COLUMN gallery_image_urls TEXT NULL COMMENT 'Comma-separated list of image URLs' AFTER image_url,
ADD COLUMN functions_aim TEXT NULL COMMENT 'Comma-separated list of aim features' AFTER long_description,
ADD COLUMN functions_wallhack TEXT NULL COMMENT 'Comma-separated list of wallhack features' AFTER functions_aim,
ADD COLUMN functions_misc TEXT NULL COMMENT 'Comma-separated list of misc features' AFTER functions_wallhack,
ADD COLUMN system_os VARCHAR(255) NULL AFTER functions_misc,
ADD COLUMN system_build VARCHAR(255) NULL AFTER system_os,
ADD COLUMN system_gpu VARCHAR(255) NULL AFTER system_build,
ADD COLUMN system_cpu VARCHAR(255) NULL AFTER system_gpu;

-- Remove old pricing columns from products if they exist and are no longer needed
-- Ensure these are not used elsewhere before dropping or comment out if unsure.
-- ALTER TABLE products
-- DROP COLUMN IF EXISTS price_text,
-- DROP COLUMN IF EXISTS base_price_gh; -- The main `price` column might still be used for "display from" price

-- Create new table for product pricing options
CREATE TABLE IF NOT EXISTS product_pricing_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    duration_days INT NOT NULL,
    price_rub DECIMAL(10, 2) NOT NULL,
    price_gh DECIMAL(10, 2) NOT NULL,
    is_pvp BOOLEAN DEFAULT FALSE, -- To handle different prices for PVE/PVP if needed for the same duration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX idx_product_pricing_product_id ON product_pricing_options(product_id);

-- Insert "Warface" game/category if it doesn't exist
-- This assumes categories are derived. If you have a 'games' table, insert there.
-- For now, we'll rely on products having 'warface' as game_slug.

-- Insert "UnitHack" product
INSERT IGNORE INTO products (
    id, name, slug, game_slug, image_url, status, status_text, 
    short_description, long_description, 
    mode, gallery_image_urls, 
    functions_aim, functions_wallhack, functions_misc,
    system_os, system_build, system_gpu, system_cpu,
    data_ai_hint, price -- Add a default "display from" price
) VALUES (
    'unithack-warface', 
    'UnitHack', 
    'unithack-warface', 
    'warface', 
    'https://picsum.photos/seed/unithack/600/400', -- Placeholder product image
    'safe', 
    'Безопасен',
    'Мощный чит для Warface с широким функционалом.', 
    'UnitHack предоставляет полный набор функций для доминирования в PVE и PVP режимах Warface. Включает продвинутый Aimbot, Wallhack для обзора сквозь стены и множество других полезных опций для улучшения вашего игрового опыта. Регулярные обновления обеспечивают безопасность и стабильность.',
    'PVE', -- Default mode, can be overridden by pricing options
    'https://picsum.photos/seed/unithack-gallery1/800/600,https://picsum.photos/seed/unithack-gallery2/800/600,https://picsum.photos/seed/unithack-gallery3/800/600', -- Placeholder gallery images
    'Точный Aimbot,Настройка радиуса,Выбор части тела,Без отдачи,Без разброса',
    'ESP Боксы,ESP Скелеты,ESP Здоровье,ESP Имена,ESP Дистанция',
    'Быстрая перезарядка,Спидхак (контролируемый),Анти-флеш,Анти-дым,Полет (ограниченный)',
    'Windows 10 / 11',
    '22H2 и новее',
    'NVIDIA GTX 1050 / AMD RX 560 или лучше',
    'Intel Core i5 / AMD Ryzen 5 (Не работает на некоторых старых AMD)',
    'Warface cheat software menu',
    150.00 -- Display price "from", matches the lowest price_rub
);

-- Insert pricing options for UnitHack
INSERT INTO product_pricing_options (product_id, duration_days, price_rub, price_gh, is_pvp) VALUES
('unithack-warface', 1, 150.00, 150.00, FALSE), -- PVE 1 day
('unithack-warface', 7, 300.00, 300.00, FALSE), -- PVE 7 days
('unithack-warface', 14, 1000.00, 1000.00, FALSE), -- PVE 14 days
('unithack-warface', 30, 1500.00, 1500.00, FALSE); -- PVE 30 days

-- Placeholder pricing for potential PVP mode (can be marked as unavailable in UI)
-- INSERT INTO product_pricing_options (product_id, duration_days, price_rub, price_gh, is_pvp) VALUES
-- ('unithack-warface', 1, 200.00, 200.00, TRUE), 
-- ('unithack-warface', 7, 700.00, 700.00, TRUE);

-- Note: To ensure data consistency, you might want to run these INSERTS after confirming
-- the 'warface' game_slug exists or after creating a corresponding entry in a 'games' table if you add one.
-- The IGNORE keyword in INSERT IGNORE INTO products prevents errors if 'unithack-warface' already exists.
