
// src/app/api/user/[userId]/licenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { ActiveLicense } from '@/types';

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
         ui.id, 
         ui.product_name as productName, 
         ui.acquired_at as purchaseDate, 
         ui.activated_at, 
         ui.expires_at as preCalculatedExpiry, 
         COALESCE(ppo.duration_days, cp.duration_days) as duration_days, 
         ppo.mode_label, -- Fetch mode_label
         p.slug as productSlug,
         p.retrieval_modal_how_to_run_link -- Fetch how_to_run_link from products
       FROM user_inventory ui
       LEFT JOIN products p ON ui.related_product_id = p.id
       LEFT JOIN product_pricing_options ppo ON ui.product_pricing_option_id = ppo.id
       LEFT JOIN case_prizes cp ON ui.case_prize_id = cp.id
       WHERE ui.user_id = ? 
         AND ui.is_used = TRUE 
         AND ui.related_product_id IS NOT NULL 
         AND (ui.expires_at IS NULL OR ui.expires_at > NOW()) 
       ORDER BY ui.activated_at DESC, ui.acquired_at DESC`,
      [parseInt(userId)]
    );

    const licenses: ActiveLicense[] = results.map((row: any) => {
      let expiryDate: string | null = null;
      if (row.preCalculatedExpiry) {
        expiryDate = new Date(row.preCalculatedExpiry).toISOString();
      } else if (row.activated_at && row.duration_days) {
        const activated = new Date(row.activated_at);
        expiryDate = new Date(activated.setDate(activated.getDate() + parseInt(row.duration_days, 10))).toISOString();
      }

      return {
        id: String(row.id), 
        productName: row.productName,
        purchaseDate: row.purchaseDate, 
        activated_at: row.activated_at ? new Date(row.activated_at).toISOString() : null,
        expiryDate: expiryDate,
        productSlug: row.productSlug,
        mode_label: row.mode_label || null, // Add mode_label
        how_to_run_link: row.retrieval_modal_how_to_run_link || null,
      };
    });

    return NextResponse.json(licenses);
  } catch (error: any) {
    console.error(`API Error fetching licenses for user ${userId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
