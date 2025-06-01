
// src/app/api/user/[userId]/inventory-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { InventoryItemWithDetails } from '@/types';

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
         ui.user_id, 
         ui.case_prize_id, 
         ui.related_product_id, 
         ui.product_pricing_option_id, 
         ui.product_name, 
         ui.product_image_url, 
         ui.activation_code, 
         ui.expires_at, 
         ui.acquired_at, 
         ui.is_used,
         ui.purchase_id,
         ui.case_opening_id,
         COALESCE(ppo.duration_days, cp.duration_days) as duration_days, 
         ppo.mode_label, -- Changed from is_pvp
         ui.activated_at, -- Added activated_at
         ui.activation_status -- Added activation_status
       FROM user_inventory ui
       LEFT JOIN product_pricing_options ppo ON ui.product_pricing_option_id = ppo.id
       LEFT JOIN case_prizes cp ON ui.case_prize_id = cp.id 
       WHERE ui.user_id = ?
       ORDER BY ui.acquired_at DESC`,
      [parseInt(userId)]
    );

    const inventoryItems: InventoryItemWithDetails[] = results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      case_prize_id: row.case_prize_id,
      related_product_id: row.related_product_id,
      product_pricing_option_id: row.product_pricing_option_id,
      product_name: row.product_name,
      product_image_url: row.product_image_url,
      activation_code: row.activation_code,
      expires_at: row.expires_at,
      acquired_at: row.acquired_at,
      is_used: Boolean(row.is_used),
      purchase_id: row.purchase_id,
      case_opening_id: row.case_opening_id,
      duration_days: row.duration_days ? parseInt(row.duration_days, 10) : null,
      mode_label: row.mode_label || null, // Use mode_label
      activated_at: row.activated_at,
      activation_status: row.activation_status || 'available',
    }));

    return NextResponse.json(inventoryItems);
  } catch (error: any) {
    console.error(`API Error fetching inventory items for user ${userId}:`, error);
    // Provide a more specific error message in the JSON payload
    const errorMessage = error.message || 'An unexpected error occurred on the server while fetching inventory.';
    return NextResponse.json({ message: `Failed to retrieve inventory. Server error: ${errorMessage}` }, { status: 500 });
  }
}

