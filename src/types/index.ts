
import type { LucideIcon } from "lucide-react";

// User Account Types
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  role: 'client' | 'booster' | 'admin';
  balance: number;
  referral_code?: string | null;
  referred_by_user_id?: number | null;
  referral_percentage?: number; // Процент вознаграждения за реферала (e.g., 5.00 for 5%)
  created_at?: string;
  updated_at?: string;
  telegram_id?: string | null;
  avatarUrl?: string;
  purchase_count?: number;
  referrer_username?: string | null;
  referred_users_count?: number;
}

export interface Category { // Represents 'games' table
  id: number;
  name: string;
  slug: string;
  description: string | null;
  min_price: number;
  imageUrl: string; // Main image for the category card, game page banner fallback
  logoUrl?: string | null; // Icon/logo for the category
  banner_url?: string | null; // Specific banner image for the game page hero
  platform?: string | null; // Added platform here
  tags?: string[];
  dataAiHint?: string;
  hero_bullet_points?: string[] | null; // For bullet points in hero section
  product_count?: number;
}

export interface ProductPricingOption {
  id?: number;
  product_id: string; // Corresponds to products.id (which is a VARCHAR slug)
  duration_days: number;
  price_rub: number;
  price_gh: number;
  is_rub_payment_visible?: boolean;
  is_gh_payment_visible?: boolean;
  custom_payment_1_label?: string | null;
  custom_payment_1_price_rub?: number | null;
  custom_payment_1_link?: string | null;
  custom_payment_1_is_visible?: boolean;
  custom_payment_2_label?: string | null;
  custom_payment_2_price_rub?: number | null;
  custom_payment_2_link?: string | null;
  custom_payment_2_is_visible?: boolean;
  mode_label?: string | null;
  payment_link?: string | null; // Old field, to be de-emphasized
  created_at?: string;
}

export interface ProductPricingOptionWithProductInfo extends ProductPricingOption {
  product_name?: string;
}

export interface Product {
  id: string; // This is the product slug
  name: string;
  slug: string;
  game_slug: string;
  image_url?: string | null;
  imageUrl: string;
  status: 'safe' | 'updating' | 'risky' | 'unknown';
  status_text?: string | null;
  price_text?: string | null;
  min_price_rub?: number;
  min_price_gh?: number;
  short_description?: string | null;
  long_description?: string | null;
  data_ai_hint?: string | null;
  created_at?: string;
  updated_at?: string;
  gameName?: string;
  gameLogoUrl?: string | null;
  gamePlatform?: string | null; // Added to store game's platform for product display
  statusIcon?: LucideIcon;
  glowColor?: 'primary' | 'orange' | 'red' | 'sky';
  mode?: 'PVE' | 'PVP' | 'BOTH' | null;
  gallery_image_urls?: string[] | null;

  functions_aim_title?: string | null;
  functions_aim?: string[] | null;
  functions_aim_description?: string | null;

  functions_esp_title?: string | null;
  functions_wallhack?: string[] | null;
  functions_esp_description?: string | null;

  functions_misc_title?: string | null;
  functions_misc?: string[] | null;
  functions_misc_description?: string | null;

  system_os?: string | null;
  system_build?: string | null;
  system_gpu?: string | null;
  system_cpu?: string | null;
  pricing_options?: ProductPricingOption[] | null;

  retrieval_modal_intro_text?: string | null;
  retrieval_modal_antivirus_text?: string | null;
  retrieval_modal_antivirus_link_text?: string | null;
  retrieval_modal_antivirus_link_url?: string | null;
  retrieval_modal_launcher_text?: string | null;
  retrieval_modal_launcher_link_text?: string | null;
  retrieval_modal_launcher_link_url?: string | null;
  retrieval_modal_key_paste_text?: string | null;
  retrieval_modal_support_text?: string | null;
  retrieval_modal_support_link_text?: string | null;
  retrieval_modal_support_link_url?: string | null;
  retrieval_modal_how_to_run_link?: string | null;

  // New fields for activation type
  activation_type?: 'key_request' | 'info_modal' | 'direct_key'; // direct_key is a future placeholder
  loader_download_url?: string | null;
  info_modal_content_html?: string | null;
  info_modal_support_link_text?: string | null;
  info_modal_support_link_url?: string | null;
}


export interface Cheat {
  id: string;
  title: string;
  description: string;
  content?: string;
  lastUpdated: string;
  gameId: string;
}


export interface SiteNavigationItem {
  id: number;
  label: string;
  href: string;
  icon_name?: string | null;
  item_order: number;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}


export interface NavItem {
  id?: number;
  label: string;
  href: string;
  icon?: LucideIcon;
  icon_name?: string | null;
  item_order?: number;
  is_visible?: boolean;
  match?: (pathname: string) => boolean;
}

export interface Prize {
  id: string; // This is from case_prizes.id (VARCHAR)
  case_id: string;
  name: string;
  prize_type: 'product_duration' | 'balance_gh' | 'physical_item';
  related_product_id?: string | null; // This is products.id (VARCHAR)
  duration_days?: number | null;
  days?: number; // Alias for duration_days
  balance_gh_amount?: number | null;
  image_url?: string | null;
  imageUrl: string;
  chance: number; // Stored as 0.0-1.0 in DB, handled as 0-100 in admin form
  effectiveChance?: number; // Calculated for roulette
  sell_value_gh?: number | null;
  data_ai_hint?: string | null;
  product_name?: string; // Joined for display convenience
  uniqueKey?: string; // For client-side list rendering in roulette
  product_pricing_option_id?: number | null; // if prize is a specific product variant
  mode_label?: string | null;
}


export interface CaseBoostOptionConfig {
  id?: number; // DB ID of the case_boost_options entry
  case_id: string;
  boost_ref_id: string; // e.g., 'boost10', 'boost50'
  label: string;
  is_active_for_case: boolean;
  override_cost_gh?: number | null;
  override_chance_multiplier?: number | null;
  override_description?: string | null;
}

export interface CaseItem {
  id: string; // case_id
  name: string;
  image_url?: string | null;
  imageUrl: string;
  prizes?: Prize[];
  base_price_gh: number;
  description?: string | null;
  data_ai_hint?: string | null;
  is_active?: boolean;
  is_hot_offer?: boolean;
  timer_enabled?: boolean;
  timer_ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
  prize_count?: number; // Calculated for admin list
  boost_options_config?: CaseBoostOptionConfig[] | null;
}

export interface BoostOption {
  id: string;
  label: string;
  cost: number;
  chanceMultiplier: number;
  description: string;
  isActiveByDefault?: boolean; // For admin panel default setup
}

export interface HomepageAdvantage {
  icon: string; // Lucide icon name
  text: string;
}

export interface SiteSettings {
    id?: number;
    site_name: string | null;
    site_description: string | null;
    logo_url: string | null;
    footer_text: string | null;
    contact_vk_label?: string | null;
    contact_vk_url?: string | null;
    contact_telegram_bot_label?: string | null;
    contact_telegram_bot_url?: string | null;
    contact_email_label?: string | null;
    contact_email_address?: string | null;
    footer_marketplace_text?: string | null;
    footer_marketplace_logo_url?: string | null;
    footer_marketplace_link_url?: string | null;
    footer_marketplace_is_visible?: boolean;
    faq_page_main_title?: string | null;
    faq_page_contact_prompt_text?: string | null;
    rules_page_content?: string | null;
    offer_page_content?: string | null;
    homepage_popular_categories_title?: string | null;
    homepage_advantages?: HomepageAdvantage[] | null;
    homepage_show_case_opening_block?: boolean;
    homepage_case_opening_title?: string | null;
    homepage_case_opening_subtitle?: string | null;
    updated_at?: string;
}

export interface SmtpSettings {
  id?: number;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password?: string | null;
  smtp_encryption: 'none' | 'ssl' | 'tls' | null;
  from_email: string | null;
  from_name: string | null;
  updated_at?: string;
}

export interface SiteNotificationSettings {
  id?: number;
  notify_on_registration: boolean;
  notify_on_balance_deposit: boolean;
  notify_on_product_purchase: boolean;
  notify_on_support_reply: boolean;
  notify_on_software_activation: boolean;
  notify_on_license_expiry_soon: boolean;
  notify_on_promotions: boolean;
  updated_at?: string;
}

export interface SiteTelegramSettings {
  id?: number;
  client_bot_token?: string | null;
  client_bot_chat_id?: string | null;
  admin_bot_token?: string | null;
  admin_bot_chat_ids?: string | null; // Comma-separated list of chat IDs
  key_bot_token?: string | null; // Added for key activation bot
  key_bot_admin_chat_ids?: string | null; // Added for key activation bot admin chats
  updated_at?: string;
}

export interface AdminTelegramNotificationPrefs {
  id?: number;
  notify_admin_on_balance_deposit: boolean;
  notify_admin_on_product_purchase: boolean;
  notify_admin_on_promo_code_creation: boolean;
  notify_admin_on_admin_login: boolean;
  notify_admin_on_key_activation_request?: boolean;
  updated_at?: string;
}

export interface SitePaymentGatewaySettings {
  id?: number;
  gateway_name?: string | null;
  yoomoney_shop_id?: string | null;
  yoomoney_secret_key?: string | null;
  yoomoney_webhook_url?: string | null;
  yoomoney_notify_payment_succeeded?: boolean;
  yoomoney_notify_payment_waiting_for_capture?: boolean;
  yoomoney_notify_payment_canceled?: boolean;
  yoomoney_notify_refund_succeeded?: boolean;
  is_test_mode_active?: boolean;
  updated_at?: string;
}

export interface Purchase {
  id: number;
  user_id: number;
  product_id: string;
  product_pricing_option_id?: number | null;
  purchase_date?: string;
  amount_paid_gh: number;
  amount_paid_rub?: number;
  payment_method?: 'gh_balance' | 'external';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description?: string;
  balance_transaction_id?: number | null;
}

export interface PurchaseHistoryItem extends Purchase {
  user_username?: string;
  product_name?: string;
  product_pricing_option_duration_days?: number | null;
  product_pricing_option_mode_label?: string | null; // Changed from is_pvp
  description?: string;
}


export interface CaseOpeningRecord {
  id: number;
  user_id: number;
  case_id: string;
  won_prize_id: string;
  opened_at?: string;
  action_taken: 'kept' | 'sold' | 'pending';
  sold_value_gh?: number | null;
  balance_transaction_id?: number | null;
}

export interface CaseOpeningRecordWithDetails extends CaseOpeningRecord {
  case_name?: string;
  prize_name?: string;
  prize_image_url?: string | null;
  prize_duration_days?: number | null; // From joined case_prizes
  prize_balance_gh_amount?: number | null; // From joined case_prizes
  prize_mode_label?: string | null; // From related pricing_option if applicable
}


export interface InventoryItem {
  id: number;
  user_id: number;
  case_prize_id?: string | null;
  related_product_id?: string | null;
  product_pricing_option_id?: number | null;
  product_name: string;
  product_image_url?: string | null;
  activation_code?: string | null;
  expires_at?: string | null;
  acquired_at?: string;
  is_used?: boolean;
  purchase_id?: number | null;
  case_opening_id?: number | null;
  activated_at?: string | null; // When the user activated it from inventory
  activation_status?: 'available' | 'pending_admin_approval' | 'active' | 'rejected' | 'expired';
}

export interface InventoryItemWithDetails extends InventoryItem {
    duration_days?: number | null;
    mode_label?: string | null;
}


export interface Referral {
  id: number;
  referrer_user_id: number;
  referred_user_id: number;
  status: 'pending_purchase' | 'completed' | 'expired';
  reward_amount_gh?: number | null;
  reward_description?: string | null;
  related_balance_transaction_id?: number | null;
  created_at?: string;
  reward_claimed_at?: string | null;
  referred_username?: string | null;
}

export interface BalanceTransaction {
  id: number;
  user_id: number;
  user_username?: string; // Joined for display
  transaction_type: 'deposit' | 'purchase_product' | 'open_case' | 'sell_prize' | 'referral_bonus' | 'admin_adjustment';
  amount_gh: number;
  description?: string | null;
  related_purchase_id?: number | null;
  related_case_opening_id?: number | null;
  related_referral_id?: number | null;
  related_payment_request_id?: number | null;
  created_at?: string;
}

export interface ReferralCodeCheckResponse {
  isValid: boolean;
  referrerName?: string;
  referrerId?: number;
  message?: string;
}

export interface ReferrerDetails {
  username: string;
}

export interface ReferredUsersCount {
  count: number;
}

export interface ActiveLicense {
  id: string;
  productName: string;
  purchaseDate: Date | string;
  activated_at: Date | string | null;
  expiryDate: string | null;
  productSlug: string;
  how_to_run_link?: string | null;
  mode_label?: string | null;
  activation_type?: 'key_request' | 'info_modal' | 'direct_key';
  loader_download_url?: string | null;
  info_modal_content_html?: string | null;
  info_modal_support_link_text?: string | null;
  info_modal_support_link_url?: string | null;
  related_product_id?: string; // For fetching product specific activation settings
}

export interface PromoCode {
  id?: number;
  code: string;
  type: 'balance_gh' | 'product';
  value_gh?: number | null;
  related_product_id?: string | null;
  product_pricing_option_id?: number | null;
  max_uses: number;
  current_uses: number;
  expires_at?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  product_name?: string;
  pricing_option_description?: string;
  pricing_option_mode_label?: string | null;
}

export interface PromoCodeActivator extends Pick<User, 'id' | 'username' | 'email'> {
    used_at: string;
}

export interface SiteBanner {
  id?: number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image_url: string;
  image_alt_text?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  item_order: number;
  is_active: boolean;
  hero_image_object_position?: string | null;
  hero_image_hint?: string | null;
  price_text?: string | null;
  game_slug?: string | null;
  game_name?: string; // Joined for display
  related_product_slug_1?: string | null;
  related_product_slug_2?: string | null;
  related_product_slug_3?: string | null;
  related_products_details?: Pick<Product, 'id' | 'slug' | 'name' | 'imageUrl' | 'image_url' | 'status' | 'price_text' | 'data_ai_hint' | 'gameName' | 'min_price_rub' | 'min_price_gh'>[];
  created_at?: string;
  updated_at?: string;
}

export interface PaymentRequest {
  id: number;
  user_id: number;
  username?: string; // Joined for display
  amount_gh: number;
  status: 'pending' | 'approved' | 'rejected' | 'pending_yoomoney';
  payment_method_details?: string;
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
  external_payment_id?: string | null;
  payment_gateway?: 'yoomoney' | 'manual_test' | string | null;
}

// For Admin Dashboard Statistics
export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  monthlySalesGh: number;
  openTickets: number;
}

export interface SoftwareRetrievalModalContent {
  intro_text?: string | null;
  antivirus_text?: string | null;
  antivirus_link_text?: string | null;
  antivirus_link_url?: string | null;
  launcher_text?: string | null;
  launcher_link_text?: string | null;
  launcher_link_url?: string | null;
  key_paste_text?: string | null;
  support_text?: string | null;
  support_link_text?: string | null;
  support_link_url?: string | null;
}

// Review System Types
export interface Review {
  id: number;
  user_id: number;
  username: string; // Joined from users table
  user_avatar_url?: string | null; // Joined from users table
  product_id: string; // products.id (VARCHAR)
  product_name: string; // Joined from products table
  product_image_url?: string | null; // Joined from products table
  product_slug?: string; // Joined from products table
  product_pricing_option_id?: number | null; // Optional: if review is for a specific duration/version
  duration_days?: number | null; // Optional: duration if linked to a specific option
  mode_label?: string | null; // Optional: mode_label if linked to a specific option
  rating: number; // 1-5
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
  approved_at?: string | null;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  item_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// New type for FAQ Sidebar Navigation Items
export interface FaqSidebarNavItem {
  id: number;
  title: string;
  href: string; // e.g., #anchor-link or /full/path
  image_url: string;
  image_alt_text?: string | null;
  data_ai_hint?: string | null;
  content?: string | null; // Added content field
  item_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
    
    
