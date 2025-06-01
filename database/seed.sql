
-- Clear existing data to prevent conflicts and ensure a clean slate
DELETE FROM product_pricing_options;
DELETE FROM user_inventory;
DELETE FROM case_openings_history;
DELETE FROM case_prizes;
DELETE FROM cases;
DELETE FROM products;
DELETE FROM games;
DELETE FROM referrals;
DELETE FROM balance_transactions;
-- Users table is usually not cleared in seed unless for full reset

-- Reset auto_increment values for tables that were cleared
ALTER TABLE games AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE product_pricing_options AUTO_INCREMENT = 1;
ALTER TABLE case_openings_history AUTO_INCREMENT = 1;
ALTER TABLE user_inventory AUTO_INCREMENT = 1;
ALTER TABLE referrals AUTO_INCREMENT = 1;
ALTER TABLE balance_transactions AUTO_INCREMENT = 1;

-- Seed Games (Categories)
INSERT INTO games (name, slug, description, min_price, image_url, banner_url, platform, tags, data_ai_hint) VALUES
('Warface', 'warface', 'Многопользовательский онлайн-шутер от первого лица с миллионами поклонников по всему миру.', 150.00, 'https://picsum.photos/seed/warface-logo/150/150', 'https://avatars.mds.yandex.net/i?id=2d31d8b6345e119da1ccf6f8a983fe21_l-5348153-images-thumbs&n=13', 'PC', 'Шутер,F2P,Онлайн', 'warface game icon'),
('PUBG: Battlegrounds', 'pubg', 'Королевская битва, где 100 игроков сражаются за выживание на сужающейся карте.', 120.00, 'https://picsum.photos/seed/pubg-logo/150/150', 'https://i.ytimg.com/vi/YytiR1v_J0Y/maxresdefault.jpg', 'PC, Xbox, PlayStation', 'Battle Royale,Шутер,Онлайн', 'pubg game icon'),
('Rust', 'rust', 'Выживание в суровом открытом мире, где все хотят тебя убить. Строй, воюй, выживай.', 200.00, 'https://picsum.photos/seed/rust-logo/150/150', 'https://picsum.photos/seed/rust-banner/800/400', 'PC', 'Выживание,Открытый мир,Крафт', 'rust game icon'),
('Escape From Tarkov', 'escapefromtarkov', 'Хардкорный и реалистичный сюжетный многопользовательский онлайн-экшн от первого лица.', 99.00, 'https://picsum.photos/seed/eft-logo/150/150', 'https://picsum.photos/seed/eft-banner/800/400', 'PC', 'Хардкор,Шутер,Реализм', 'escape from tarkov game icon');

-- Seed Products
-- Warface - UnitHack
INSERT INTO products (name, slug, game_slug, image_url, status, status_text, price_text, base_price_gh, short_description, long_description, data_ai_hint, mode, gallery_image_urls, functions_aim, functions_wallhack, functions_misc, system_os, system_build, system_gpu, system_cpu)
VALUES (
    'UnitHack',
    'unithack',
    'warface',
    'https://picsum.photos/seed/unithack-product/300/350',
    'safe',
    'Безопасен',
    'от 150₽ и 150 GH',
    150.00,
    'Продвинутый чит для Warface с множеством функций для режима PVE.',
    'UnitHack - это ваш надежный помощник в мире Warface. Улучшайте свои навыки и достигайте новых высот с нашим многофункциональным читом, специально адаптированным для PVE миссий. Включает в себя точный Aimbot, детальный WallHack для обнаружения противников и полезные Misc функции для облегчения игрового процесса. Продукт регулярно обновляется для обеспечения максимальной безопасности и эффективности.',
    'unithack warface cheat',
    'PVE',
    'https://picsum.photos/seed/unithack-gallery1/600/400,https://picsum.photos/seed/unithack-gallery2/600/400,https://picsum.photos/seed/unithack-gallery3/600/400',
    'Точный Aimbot,Настройка FOV,Выбор части тела,Автовыстрел',
    'ESP Box (Обводка),ESP Name (Имена),ESP Health (Здоровье),ESP Skeleton (Скелеты),Видимость сквозь стены',
    'No Recoil (Без отдачи),No Spread (Без разброса),Speed Hack (Ускорение),Anti-AFK',
    'Windows 10 / 11',
    '22H02 и выше',
    'Nvidia (все поколения)',
    'Intel (Не работает на AMD)'
);

-- PUBG Products
INSERT INTO products (name, slug, game_slug, image_url, status, status_text, price_text, base_price_gh, short_description, long_description, data_ai_hint, mode)
VALUES
('PUBG Hack', 'pubg-hack', 'pubg', 'https://picsum.photos/seed/pubg-hack/300/350', 'safe', 'Безопасен', 'от 120₽', 120.00, 'Надежный чит для PUBG.', 'Описание PUBG Hack...','pubg hack logo', 'PVP'),
('PubLite Hack', 'publite-hack', 'pubg', 'https://picsum.photos/seed/publite-hack/300/350', 'updating', 'Обновляется', 'от 100₽', 100.00, 'Легкий чит для PUBG.', 'Описание PubLite Hack...','pubg lite hack logo', 'PVP'),
('GreenPubg', 'greenpubg', 'pubg', 'https://picsum.photos/seed/greenpubg/300/350', 'risky', 'Рискованно', 'от 150₽', 150.00, 'Мощный чит для PUBG с зеленым интерфейсом.', 'Описание GreenPubg...','green pubg cheat icon', 'BOTH');


-- Seed Product Pricing Options for UnitHack (product_id refers to the AUTO_INCREMENT id of UnitHack)
-- Assuming UnitHack gets id = 1
INSERT INTO product_pricing_options (product_id, duration_days, price_rub, price_gh, is_pvp) VALUES
((SELECT id FROM products WHERE slug = 'unithack'), 1, 150.00, 150.00, FALSE),
((SELECT id FROM products WHERE slug = 'unithack'), 7, 300.00, 300.00, FALSE),
((SELECT id FROM products WHERE slug = 'unithack'), 14, 1000.00, 1000.00, FALSE),
((SELECT id FROM products WHERE slug = 'unithack'), 30, 1500.00, 1500.00, FALSE);

-- Seed Product Pricing Options for PUBG Hack
INSERT INTO product_pricing_options (product_id, duration_days, price_rub, price_gh, is_pvp) VALUES
((SELECT id FROM products WHERE slug = 'pubg-hack'), 1, 120.00, 120.00, TRUE),
((SELECT id FROM products WHERE slug = 'pubg-hack'), 7, 250.00, 250.00, TRUE);

-- Seed Product Pricing Options for PubLite Hack
INSERT INTO product_pricing_options (product_id, duration_days, price_rub, price_gh, is_pvp) VALUES
((SELECT id FROM products WHERE slug = 'publite-hack'), 1, 100.00, 100.00, TRUE);

-- Seed Product Pricing Options for GreenPubg (PVE)
INSERT INTO product_pricing_options (product_id, duration_days, price_rub, price_gh, is_pvp) VALUES
((SELECT id FROM products WHERE slug = 'greenpubg'), 7, 150.00, 150.00, FALSE),
((SELECT id FROM products WHERE slug = 'greenpubg'), 30, 500.00, 500.00, FALSE);
-- Seed Product Pricing Options for GreenPubg (PVP)
INSERT INTO product_pricing_options (product_id, duration_days, price_rub, price_gh, is_pvp) VALUES
((SELECT id FROM products WHERE slug = 'greenpubg'), 7, 180.00, 180.00, TRUE),
((SELECT id FROM products WHERE slug = 'greenpubg'), 30, 600.00, 600.00, TRUE);


-- Seed Cases (main-case-1)
INSERT INTO cases (id, name, image_url, base_price_gh, description, data_ai_hint, is_active) VALUES
('main-case-1', 'Стандартный Кейс Удачи', 'https://cdn.streamelements.com/uploads/ed049f7b-6dbd-419d-a279-c2e4db0f65f9.png', 100.00, 'Откройте кейс и получите шанс выиграть ценный приз!', 'loot box', TRUE);

-- Seed Case Prizes (for main-case-1, prizes are product durations for UnitHack)
-- Assuming UnitHack product ID is 1 (you might need to adjust this if it's different after insertion)
INSERT INTO case_prizes (id, case_id, name, prize_type, related_product_id, duration_days, image_url, chance, sell_value_gh, data_ai_hint) VALUES
('uh1d-prize', 'main-case-1', 'UnitHack 1 День', 'product_duration', (SELECT id FROM products WHERE slug = 'unithack'), 1, 'https://picsum.photos/seed/uh1d-prize/120/120', 0.30, 10, 'software chip'),
('uh3d-prize', 'main-case-1', 'UnitHack 3 Дня', 'product_duration', (SELECT id FROM products WHERE slug = 'unithack'), 3, 'https://picsum.photos/seed/uh3d-prize/120/120', 0.20, 25, 'software package'),
('uh5d-prize', 'main-case-1', 'UnitHack 5 Дней', 'product_duration', (SELECT id FROM products WHERE slug = 'unithack'), 5, 'https://picsum.photos/seed/uh5d-prize/120/120', 0.15, 45, 'software box'),
('uh7d-prize', 'main-case-1', 'UnitHack 7 Дней', 'product_duration', (SELECT id FROM products WHERE slug = 'unithack'), 7, 'https://picsum.photos/seed/uh7d-prize/120/120', 0.10, 60, 'software key'),
('uh10d-prize', 'main-case-1', 'UnitHack 10 Дней', 'product_duration', (SELECT id FROM products WHERE slug = 'unithack'), 10, 'https://picsum.photos/seed/uh10d-prize/120/120', 0.08, 80, 'software icon'),
('uh14d-prize', 'main-case-1', 'UnitHack 14 Дней', 'product_duration', (SELECT id FROM products WHERE slug = 'unithack'), 14, 'https://picsum.photos/seed/uh14d-prize/120/120', 0.07, 100, 'software cd'),
('uh30d-prize', 'main-case-1', 'UnitHack 30 Дней', 'product_duration', (SELECT id FROM products WHERE slug = 'unithack'), 30, 'https://picsum.photos/seed/uh30d-prize/120/120', 0.06, 180, 'software disc'),
('uh90d-prize', 'main-case-1', 'UnitHack 90 Дней', 'product_duration', (SELECT id FROM products WHERE slug = 'unithack'), 90, 'https://picsum.photos/seed/uh90d-prize/120/120', 0.04, 500, 'software archive');

-- Seed Site Settings
INSERT INTO settings (site_name, site_description, logo_url, footer_text) VALUES
('Green Hack', 'Лучшие приватные читы для ваших любимых игр.', '/img/logo.webp', '© 2024 Green Hack. Все права защищены.');
