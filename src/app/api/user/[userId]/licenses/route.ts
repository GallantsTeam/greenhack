
// src/app/api/user/[userId]/licenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { ActiveLicense, InventoryItem } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  if (!userId || isNaN(parseInt(userId))) {
    return NextResponse.json({ message: 'Valid User ID is required' }, { status: 400 });
  }

  try {
    const results = await query(
      `SELECT 
         ui.id as inventory_item_id, -- Use ui.id as inventory_item_id
         ui.related_product_id, -- Need this for product specific details
         ui.product_name as productName, 
         ui.acquired_at as purchaseDate, 
         ui.activated_at, 
         ui.expires_at as preCalculatedExpiry, 
         COALESCE(ppo.duration_days, cp.duration_days) as duration_days, 
         ppo.mode_label,
         p.slug as productSlug,
         p.retrieval_modal_how_to_run_link,
         p.activation_type, -- Fetch from products
         p.loader_download_url,
         p.info_modal_content_html,
         p.info_modal_support_link_text,
         p.info_modal_support_link_url,
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
         ui.activation_status -- Fetch activation_status from user_inventory
       FROM user_inventory ui
       LEFT JOIN products p ON ui.related_product_id = p.id
       LEFT JOIN product_pricing_options ppo ON ui.product_pricing_option_id = ppo.id
       LEFT JOIN case_prizes cp ON ui.case_prize_id = cp.id
       WHERE ui.user_id = ? 
         AND ui.related_product_id IS NOT NULL -- Only product-based inventory items are licenses
         AND (
              (ui.is_used = TRUE AND (ui.expires_at IS NULL OR ui.expires_at > NOW())) -- Already active and not expired
              OR 
              (ui.is_used = FALSE AND p.activation_type = 'key_request' AND ui.activation_status IN ('available', 'rejected', 'pending_admin_approval')) -- Not yet used but requires key request
            )
       ORDER BY ui.activated_at DESC, ui.acquired_at DESC`,
      [parseInt(userId)]
    );

    const licenses: ActiveLicense[] = results.map((row: any) => {
      let expiryDate: string | null = null;
      if (row.activation_status === 'active' && row.preCalculatedExpiry) { // Only show expiry if active
        expiryDate = new Date(row.preCalculatedExpiry).toISOString();
      } else if (row.activation_status === 'active' && row.activated_at && row.duration_days) {
        const activated = new Date(row.activated_at);
        expiryDate = new Date(activated.setDate(activated.getDate() + parseInt(row.duration_days, 10))).toISOString();
      }

      return {
        id: String(row.inventory_item_id), // Ensure this is a string if your ActiveLicense type expects string
        productName: row.productName,
        productSlug: row.productSlug,
        inventory_item_id: row.inventory_item_id, // Added this field
        purchaseDate: row.purchaseDate, 
        activated_at: row.activated_at ? new Date(row.activated_at).toISOString() : null,
        expiryDate: expiryDate,
        how_to_run_link: row.retrieval_modal_how_to_run_link || null,
        mode_label: row.mode_label || null,
        activation_type: row.activation_type || 'info_modal',
        loader_download_url: row.loader_download_url,
        info_modal_content_html: row.info_modal_content_html,
        info_modal_support_link_text: row.info_modal_support_link_text,
        info_modal_support_link_url: row.info_modal_support_link_url,
        related_product_id: row.related_product_id,
        activation_status: row.activation_status || 'available',
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
      };
    });

    return NextResponse.json(licenses);
  } catch (error: any) {
    console.error(`API Error fetching licenses for user ${userId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
