
import type { Category, Product, CaseItem, Prize, ProductPricingOption, Purchase, InventoryItem, Referral, BalanceTransaction } from '@/types';
import { query } from './mysql'; 

// Fetch all "categories" (which are now games derived from products)
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const results = await query(
      `SELECT DISTINCT 
         g.id as id, 
         g.slug as slug,
         g.name as name, 
         g.description as description,
         g.min_price as min_price,
         g.image_url as imageUrl, 
         g.logo_url as logoUrl, 
         g.banner_url as banner_url,
         g.platform as platform,
         g.tags as tags,
         g.data_ai_hint as dataAiHint,
         g.hero_bullet_points as hero_bullet_points,
         (SELECT COUNT(*) FROM products p WHERE p.game_slug = g.slug) as product_count 
       FROM games g
       ORDER BY g.name ASC`
    );
    
    return results.map((row: any) => ({
      id: row.id, 
      name: row.name,
      slug: String(row.slug).trim(), // Trimmed slug
      description: row.description,
      min_price: parseFloat(row.min_price) || 0,
      imageUrl: (row.imageUrl || `https://placehold.co/800x400.png?text=${encodeURIComponent(row.name)}`).trim(),
      logoUrl: (row.logoUrl || `https://placehold.co/150x150.png?text=${encodeURIComponent(row.name.substring(0,3))}`).trim(),
      banner_url: row.banner_url ? String(row.banner_url).trim() : null,
      platform: row.platform,
      tags: typeof row.tags === 'string' ? row.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
      dataAiHint: `${row.dataAiHint || String(row.name).toLowerCase()} game icon`,
      hero_bullet_points: typeof row.hero_bullet_points === 'string' ? row.hero_bullet_points.split('\n').map((bp: string) => bp.trim()).filter(Boolean) : [],
      product_count: parseInt(row.product_count) || 0,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Fetch a single "category" (game) by its slug
export const getCategoryBySlug = async (slug: string): Promise<Category | undefined> => {
  try {
    const results = await query(
      `SELECT DISTINCT 
         g.id as id,
         g.slug as slug,
         g.name as name,
         g.description as description,
         g.min_price as min_price,
         g.image_url as imageUrl,
         g.logo_url as logoUrl,
         g.banner_url as banner_url,
         g.platform as platform,
         g.tags as tags,
         g.data_ai_hint as dataAiHint,
         g.hero_bullet_points as hero_bullet_points,
         (SELECT COUNT(*) FROM products p WHERE p.game_slug = g.slug) as product_count
       FROM games g
       WHERE g.slug = ?`,
      [slug.trim()] // Trim slug before query
    );
    if (results.length === 0) return undefined;
    const row = results[0];
    return {
      id: row.id,
      name: row.name,
      slug: String(row.slug).trim(), // Trimmed slug
      description: row.description,
      min_price: parseFloat(row.min_price) || 0,
      imageUrl: (row.imageUrl || `https://placehold.co/800x400.png?text=${encodeURIComponent(row.name)}`).trim(),
      logoUrl: (row.logoUrl || `https://placehold.co/150x150.png?text=${encodeURIComponent(row.name.substring(0,3))}`).trim(),
      banner_url: row.banner_url ? String(row.banner_url).trim() : null,
      platform: row.platform,
      tags: typeof row.tags === 'string' ? row.tags.split(',').map((tag: string) => tag.trim()).filter(tag => tag) : [],
      dataAiHint: `${row.dataAiHint || String(row.name).toLowerCase()} game icon`,
      hero_bullet_points: typeof row.hero_bullet_points === 'string' ? row.hero_bullet_points.split('\n').map((bp: string) => bp.trim()).filter(Boolean) : [],
      product_count: parseInt(row.product_count) || 0,
    };
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error);
    return undefined;
  }
};

// Fetch all products from the database
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const results = await query(
      `SELECT 
         p.id, p.name, p.slug, p.game_slug, p.image_url, 
         p.status, p.status_text, 
         p.short_description, p.long_description, p.data_ai_hint,
         p.mode, p.gallery_image_urls,
         p.functions_aim_title, p.functions_aim, p.functions_aim_description,
         p.functions_esp_title, p.functions_wallhack, p.functions_esp_description,
         p.functions_misc_title, p.functions_misc, p.functions_misc_description,
         p.system_os, p.system_build, p.system_gpu, p.system_cpu,
         p.price_text,
         p.retrieval_modal_intro_text,
         p.retrieval_modal_antivirus_text,
         p.retrieval_modal_antivirus_link_text,
         p.retrieval_modal_antivirus_link_url,
         p.retrieval_modal_launcher_text,
         p.retrieval_modal_launcher_link_text,
         p.retrieval_modal_launcher_link_url,
         p.retrieval_modal_key_paste_text,
         p.retrieval_modal_support_text,
         p.retrieval_modal_support_link_text,
         p.retrieval_modal_support_link_url,
         p.retrieval_modal_how_to_run_link,
         p.created_at, p.updated_at,
         (SELECT MIN(ppo.price_rub) FROM product_pricing_options ppo WHERE ppo.product_id = p.id AND ppo.is_rub_payment_visible = TRUE) as min_price_rub_calculated,
         (SELECT MIN(ppo.price_gh) FROM product_pricing_options ppo WHERE ppo.product_id = p.id AND ppo.is_gh_payment_visible = TRUE) as min_price_gh_calculated,
         COALESCE(g.name, p.game_slug) as gameName,
         g.logo_url as gameLogoUrl,
         g.platform as gamePlatform
       FROM products p
       LEFT JOIN games g ON p.game_slug = g.slug 
       ORDER BY p.name ASC`
    );
    
    return results.map((row: any) => ({
      id: String(row.id).trim(), // Trimmed id (product slug)
      name: row.name,
      slug: String(row.slug).trim(), // Trimmed slug
      game_slug: String(row.game_slug).trim(), // Trimmed game_slug
      image_url: row.image_url ? String(row.image_url).trim() : null,
      imageUrl: (row.image_url || `https://placehold.co/300x350.png?text=${encodeURIComponent(row.name)}`).trim(),
      status: (row.status ? String(row.status).toLowerCase() : 'unknown') as Product['status'],
      status_text: row.status_text,
      price: parseFloat(row.min_price_rub_calculated || '0'), 
      min_price_rub: row.min_price_rub_calculated ? parseFloat(row.min_price_rub_calculated) : undefined,
      min_price_gh: row.min_price_gh_calculated ? parseFloat(row.min_price_gh_calculated) : undefined,
      price_text: row.price_text,
      short_description: row.short_description,
      long_description: row.long_description,
      data_ai_hint: row.data_ai_hint || `${String(row.name).toLowerCase()} product`,
      mode: row.mode,
      gallery_image_urls: row.gallery_image_urls ? String(row.gallery_image_urls).split(',').map((url: string) => url.trim()).filter(Boolean) : [],
      functions_aim_title: row.functions_aim_title,
      functions_aim: row.functions_aim ? String(row.functions_aim).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
      functions_aim_description: row.functions_aim_description,
      functions_esp_title: row.functions_esp_title,
      functions_wallhack: row.functions_wallhack ? String(row.functions_wallhack).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
      functions_esp_description: row.functions_esp_description,
      functions_misc_title: row.functions_misc_title,
      functions_misc: row.functions_misc ? String(row.functions_misc).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
      functions_misc_description: row.functions_misc_description,
      system_os: row.system_os,
      system_build: row.system_build,
      system_gpu: row.system_gpu,
      system_cpu: row.system_cpu,
      retrieval_modal_intro_text: row.retrieval_modal_intro_text,
      retrieval_modal_antivirus_text: row.retrieval_modal_antivirus_text,
      retrieval_modal_antivirus_link_text: row.retrieval_modal_antivirus_link_text, 
      retrieval_modal_antivirus_link_url: row.retrieval_modal_antivirus_link_url,   
      retrieval_modal_launcher_text: row.retrieval_modal_launcher_text,
      retrieval_modal_launcher_link_text: row.retrieval_modal_launcher_link_text, 
      retrieval_modal_launcher_link_url: row.retrieval_modal_launcher_link_url,   
      retrieval_modal_key_paste_text: row.retrieval_modal_key_paste_text,
      retrieval_modal_support_text: row.retrieval_modal_support_text,
      retrieval_modal_support_link_text: row.retrieval_modal_support_link_text, 
      retrieval_modal_support_link_url: row.retrieval_modal_support_link_url,   
      retrieval_modal_how_to_run_link: row.retrieval_modal_how_to_run_link,
      created_at: row.created_at,
      updated_at: row.updated_at,
      gameName: row.gameName,
      gameLogoUrl: row.gameLogoUrl ? String(row.gameLogoUrl).trim() : null,
      gamePlatform: row.gamePlatform, 
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};


// Fetch a single product by its slug, including new detailed fields
export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
  try {
    const productResults = await query(
      `SELECT 
         p.id, p.name, p.slug, p.game_slug, p.image_url, 
         p.status, p.status_text, 
         p.short_description, p.long_description, p.data_ai_hint,
         p.mode, p.gallery_image_urls,
         p.functions_aim_title, p.functions_aim, p.functions_aim_description,
         p.functions_esp_title, p.functions_wallhack, p.functions_esp_description,
         p.functions_misc_title, p.functions_misc, p.functions_misc_description,
         p.system_os, p.system_build, p.system_gpu, p.system_cpu,
         p.price_text,
         p.retrieval_modal_intro_text, 
         p.retrieval_modal_antivirus_text, 
         p.retrieval_modal_antivirus_link_text,
         p.retrieval_modal_antivirus_link_url,
         p.retrieval_modal_launcher_text,
         p.retrieval_modal_launcher_link_text,
         p.retrieval_modal_launcher_link_url,
         p.retrieval_modal_key_paste_text,
         p.retrieval_modal_support_text,
         p.retrieval_modal_support_link_text,
         p.retrieval_modal_support_link_url,
         p.retrieval_modal_how_to_run_link,
         p.created_at, p.updated_at,
         COALESCE(g.name, p.game_slug) as gameName,
         g.logo_url as gameLogoUrl,
         g.platform as gamePlatform 
       FROM products p
       LEFT JOIN games g ON p.game_slug = g.slug 
       WHERE p.slug = ?`,
      [slug.trim()] // Trim slug before query
    );
    if (productResults.length === 0) return undefined;
    const row = productResults[0];

    const pricingOptionsResults = await query(
      'SELECT * FROM product_pricing_options WHERE product_id = ? ORDER BY duration_days ASC, mode_label ASC',
      [String(row.id).trim()] // Trim product.id when fetching options
    );
    
    const pricing_options: ProductPricingOption[] = Array.isArray(pricingOptionsResults) ? pricingOptionsResults.map((opt: any) => ({
      id: opt.id, 
      product_id: String(opt.product_id).trim(), // Trim product_id in options
      duration_days: parseInt(opt.duration_days, 10),
      price_rub: parseFloat(opt.price_rub),
      price_gh: parseFloat(opt.price_gh),
      payment_link: opt.payment_link || null,
      mode_label: opt.mode_label || null, 
      created_at: opt.created_at,
      // Added new fields with defaults
      is_rub_payment_visible: opt.is_rub_payment_visible === undefined ? true : Boolean(opt.is_rub_payment_visible),
      is_gh_payment_visible: opt.is_gh_payment_visible === undefined ? true : Boolean(opt.is_gh_payment_visible),
      custom_payment_1_label: opt.custom_payment_1_label || null,
      custom_payment_1_price_rub: opt.custom_payment_1_price_rub ? parseFloat(opt.custom_payment_1_price_rub) : null,
      custom_payment_1_link: opt.custom_payment_1_link || null,
      custom_payment_1_is_visible: opt.custom_payment_1_is_visible === undefined ? false : Boolean(opt.custom_payment_1_is_visible),
      custom_payment_2_label: opt.custom_payment_2_label || null,
      custom_payment_2_price_rub: opt.custom_payment_2_price_rub ? parseFloat(opt.custom_payment_2_price_rub) : null,
      custom_payment_2_link: opt.custom_payment_2_link || null,
      custom_payment_2_is_visible: opt.custom_payment_2_is_visible === undefined ? false : Boolean(opt.custom_payment_2_is_visible),
    })) : [];
    
    const minRubOption = pricing_options.length > 0 ? pricing_options.filter(o => o.is_rub_payment_visible).reduce((min, p) => p.price_rub < min ? p.price_rub : min, pricing_options.filter(o => o.is_rub_payment_visible)[0]?.price_rub ?? Infinity) : 0;
    const minGhOption = pricing_options.length > 0 ? pricing_options.filter(o => o.is_gh_payment_visible).reduce((min, p) => p.price_gh < min ? p.price_gh : min, pricing_options.filter(o => o.is_gh_payment_visible)[0]?.price_gh ?? Infinity) : 0;


    return {
      id: String(row.id).trim(), // Trimmed id (product slug)
      name: row.name,
      slug: String(row.slug).trim(), // Trimmed slug
      game_slug: String(row.game_slug).trim(), // Trimmed game_slug
      image_url: row.image_url ? String(row.image_url).trim() : null,
      imageUrl: (row.image_url || `https://placehold.co/600x400.png?text=${encodeURIComponent(row.name)}`).trim(),
      status: (row.status ? String(row.status).toLowerCase() : 'unknown') as Product['status'],
      status_text: row.status_text || 'Статус неизвестен',
      price: minRubOption === Infinity ? 0 : minRubOption, 
      min_price_rub: minRubOption === Infinity ? undefined : minRubOption,
      min_price_gh: minGhOption === Infinity ? undefined : minGhOption,
      price_text: row.price_text,
      short_description: row.short_description,
      long_description: row.long_description,
      data_ai_hint: row.data_ai_hint || `${String(row.name).toLowerCase()} product`,
      mode: row.mode,
      gallery_image_urls: row.gallery_image_urls ? String(row.gallery_image_urls).split(',').map((url: string) => url.trim()).filter(Boolean) : [],
      functions_aim_title: row.functions_aim_title,
      functions_aim: row.functions_aim ? String(row.functions_aim).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
      functions_aim_description: row.functions_aim_description,
      functions_esp_title: row.functions_esp_title,
      functions_wallhack: row.functions_wallhack ? String(row.functions_wallhack).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
      functions_esp_description: row.functions_esp_description,
      functions_misc_title: row.functions_misc_title,
      functions_misc: row.functions_misc ? String(row.functions_misc).split(',').map((fn: string) => fn.trim()).filter(Boolean) : [],
      functions_misc_description: row.functions_misc_description,
      system_os: row.system_os,
      system_build: row.system_build,
      system_gpu: row.system_gpu,
      system_cpu: row.system_cpu,
      pricing_options: pricing_options.length > 0 ? pricing_options : [], 
      retrieval_modal_intro_text: row.retrieval_modal_intro_text,
      retrieval_modal_antivirus_text: row.retrieval_modal_antivirus_text,
      retrieval_modal_antivirus_link_text: row.retrieval_modal_antivirus_link_text, 
      retrieval_modal_antivirus_link_url: row.retrieval_modal_antivirus_link_url,   
      retrieval_modal_launcher_text: row.retrieval_modal_launcher_text,
      retrieval_modal_launcher_link_text: row.retrieval_modal_launcher_link_text, 
      retrieval_modal_launcher_link_url: row.retrieval_modal_launcher_link_url,   
      retrieval_modal_key_paste_text: row.retrieval_modal_key_paste_text,
      retrieval_modal_support_text: row.retrieval_modal_support_text,
      retrieval_modal_support_link_text: row.retrieval_modal_support_link_text, 
      retrieval_modal_support_link_url: row.retrieval_modal_support_link_url,   
      retrieval_modal_how_to_run_link: row.retrieval_modal_how_to_run_link,
      created_at: row.created_at,
      updated_at: row.updated_at,
      gameName: row.gameName,
      gameLogoUrl: row.gameLogoUrl ? String(row.gameLogoUrl).trim() : null,
      gamePlatform: row.gamePlatform,
    };
  } catch (error) {
    console.error(`Error fetching product by slug ${slug}:`, error);
    return undefined;
  }
};

// Fetch products belonging to a specific game slug
export const getProductsByCategorySlug = async (gameSlug: string): Promise<Product[]> => {
  try {
    const results = await query(
      `SELECT 
         p.id, p.name, p.slug, p.game_slug, p.image_url, 
         p.status, p.status_text, 
         p.short_description, p.long_description, p.data_ai_hint,
         (SELECT MIN(ppo.price_rub) FROM product_pricing_options ppo WHERE ppo.product_id = p.id AND ppo.is_rub_payment_visible = TRUE) as min_price_rub,
         (SELECT MIN(ppo.price_gh) FROM product_pricing_options ppo WHERE ppo.product_id = p.id AND ppo.is_gh_payment_visible = TRUE) as min_price_gh,
         p.price_text,
         COALESCE(g.name, p.game_slug) as gameName,
         g.logo_url as gameLogoUrl,
         g.platform as gamePlatform 
       FROM products p
       LEFT JOIN games g ON p.game_slug = g.slug 
       WHERE p.game_slug = ?
       ORDER BY p.name ASC`,
      [gameSlug.trim()] // Trim gameSlug before query
    );
    return results.map((row: any) => ({
      id: String(row.id).trim(), // Trimmed id (product slug)
      name: row.name,
      slug: String(row.slug).trim(), // Trimmed slug
      game_slug: String(row.game_slug).trim(), // Trimmed game_slug
      image_url: row.image_url ? String(row.image_url).trim() : null,
      imageUrl: (row.image_url || `https://placehold.co/300x350.png?text=${encodeURIComponent(row.name)}`).trim(),
      status: (row.status ? String(row.status).toLowerCase() : 'unknown') as Product['status'],
      status_text: row.status_text || 'Статус неизвестен',
      price: parseFloat(row.min_price_rub || '0'),
      min_price_rub: row.min_price_rub ? parseFloat(row.min_price_rub) : undefined,
      min_price_gh: row.min_price_gh ? parseFloat(row.min_price_gh) : undefined,
      price_text: row.price_text,
      short_description: row.short_description,
      long_description: row.long_description,
      data_ai_hint: row.data_ai_hint || `${String(row.name).toLowerCase()} product`,
      gameName: row.gameName,
      gameLogoUrl: row.gameLogoUrl ? String(row.gameLogoUrl).trim() : null,
      gamePlatform: row.gamePlatform, 
    }));
  } catch (error) {
    console.error(`Error fetching products for game slug ${gameSlug}:`, error);
    return [];
  }
};

// --- Case Data Fetching ---
export const getCaseById = async (caseId: string): Promise<CaseItem | null> => {
  try {
    const caseResults = await query('SELECT * FROM cases WHERE id = ? AND is_active = TRUE', [caseId.trim()]); // Trim caseId
    if (caseResults.length === 0) {
      console.warn(`Case with ID ${caseId} not found or not active.`);
      return null;
    }
    const caseRow = caseResults[0];

    const prizeResults = await query('SELECT * FROM case_prizes WHERE case_id = ?', [caseId.trim()]); // Trim caseId
    const prizes: Prize[] = prizeResults.map((pRow: any) => ({
      id: String(pRow.id).trim(), // Trimmed prize id
      case_id: String(pRow.case_id).trim(), // Trimmed case_id in prize
      name: pRow.name,
      prize_type: pRow.prize_type,
      related_product_id: pRow.related_product_id ? String(pRow.related_product_id).trim() : null, // Trimmed related_product_id
      duration_days: pRow.duration_days ? parseInt(pRow.duration_days, 10) : null,
      days: pRow.duration_days ? parseInt(pRow.duration_days, 10) : null, 
      balance_gh_amount: pRow.balance_gh_amount ? parseFloat(pRow.balance_gh_amount) : undefined,
      image_url: pRow.image_url ? String(pRow.image_url).trim() : null,
      imageUrl: (pRow.image_url || `https://placehold.co/120x120.png?text=${encodeURIComponent(pRow.id)}`).trim(),
      chance: parseFloat(pRow.chance),
      sell_value_gh: pRow.sell_value_gh ? parseFloat(pRow.sell_value_gh) : undefined,
      data_ai_hint: pRow.data_ai_hint || `${String(pRow.name).toLowerCase()} prize`,
      mode_label: pRow.mode_label, 
    }));

    return {
      id: String(caseRow.id).trim(), // Trimmed case id
      name: caseRow.name,
      image_url: caseRow.image_url ? String(caseRow.image_url).trim() : null,
      imageUrl: (caseRow.image_url || `https://placehold.co/300x300.png?text=Case`).trim(), 
      prizes: prizes,
      base_price_gh: parseFloat(caseRow.base_price_gh),
      description: caseRow.description,
      data_ai_hint: caseRow.data_ai_hint || `${String(caseRow.name).toLowerCase()} case`,
      is_active: Boolean(caseRow.is_active),
      is_hot_offer: Boolean(caseRow.is_hot_offer),
      timer_enabled: Boolean(caseRow.timer_enabled),
      timer_ends_at: caseRow.timer_ends_at ? new Date(caseRow.timer_ends_at).toISOString() : null,
      created_at: caseRow.created_at,
    };
  } catch (error) {
    console.error(`Error fetching case by ID ${caseId}:`, error);
    return null;
  }
};

export const getPurchaseHistory = async (userId: number): Promise<Purchase[]> => {
  return []; 
};

export interface CaseOpeningRecord { 
  id: number;
  user_id: number;
  case_id: string;
  won_prize_id: string;
  opened_at?: string; 
  action_taken: 'kept' | 'sold' | 'pending';
  sold_value_gh?: number | null;
}

export const getCaseOpeningsHistory = async (userId: number): Promise<CaseOpeningRecord[]> => { 
 return []; 
};

export const getUserInventory = async (userId: number): Promise<InventoryItem[]> => {
  return []; 
};

export const getReferralData = async (userId: number): Promise<{ referrals: Referral[], totalEarned: number }> => {
  return { referrals: [], totalEarned: 0 }; 
};

export const getBalanceTransactions = async (userId: number): Promise<BalanceTransaction[]> => {
  return []; 
};
    
