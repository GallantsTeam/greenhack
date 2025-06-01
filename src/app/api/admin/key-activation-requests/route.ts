
// src/app/api/admin/key-activation-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { InventoryItemWithDetails, User, Product, ProductPricingOption, CasePrize } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const results = await query(
      `SELECT
         ui.id as inventory_item_id,
         ui.user_id,
         u.username as user_username,
         ui.related_product_id,
         p.name as product_direct_name,
         ui.product_name as inventory_item_product_name,
         ui.activation_code,
         ui.updated_at as request_date,
         COALESCE(ppo.duration_days, cp.duration_days) as duration_days,
         ppo.mode_label
       FROM user_inventory ui
       JOIN users u ON ui.user_id = u.id
       LEFT JOIN products p ON ui.related_product_id = p.id
       LEFT JOIN product_pricing_options ppo ON ui.product_pricing_option_id = ppo.id
       LEFT JOIN case_prizes cp ON ui.case_prize_id = cp.id
       WHERE ui.activation_status = 'pending_admin_approval'
       ORDER BY ui.updated_at DESC`
    );

    const requests = results.map((row: any) => ({
      inventory_item_id: row.inventory_item_id,
      user_id: row.user_id,
      user_username: row.user_username,
      product_display_name: row.product_direct_name || row.inventory_item_product_name || 'Неизвестный товар',
      activation_code: row.activation_code,
      request_date: new Date(row.request_date).toISOString(),
      duration_days: row.duration_days ? parseInt(row.duration_days, 10) : null,
      mode_label: row.mode_label || null,
    }));

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('API Admin Key Activation Requests GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
