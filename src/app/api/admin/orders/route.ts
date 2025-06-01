
// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { PurchaseHistoryItem } from '@/types'; 

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication and authorization to ensure only admins can access
    
    const results = await query(
      `SELECT 
         p.id, 
         p.user_id, 
         p.product_id, 
         p.product_pricing_option_id, 
         p.purchase_date, 
         p.amount_paid_gh, 
         p.status,
         u.username as user_username,
         prod.name as product_name,
         ppo.duration_days as product_pricing_option_duration_days,
         ppo.mode_label as product_pricing_option_mode_label, 
         bt.description as purchase_description 
       FROM purchases p
       JOIN users u ON p.user_id = u.id
       JOIN products prod ON p.product_id = prod.id
       LEFT JOIN product_pricing_options ppo ON p.product_pricing_option_id = ppo.id
       LEFT JOIN balance_transactions bt ON p.balance_transaction_id = bt.id 
       ORDER BY p.purchase_date DESC`
    );

    const orders: PurchaseHistoryItem[] = results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      product_pricing_option_id: row.product_pricing_option_id,
      purchase_date: row.purchase_date,
      amount_paid_gh: parseFloat(row.amount_paid_gh),
      status: row.status,
      user_username: row.user_username,
      product_name: row.product_name,
      product_pricing_option_duration_days: row.product_pricing_option_duration_days,
      product_pricing_option_mode_label: row.product_pricing_option_mode_label, 
      description: row.purchase_description,
    }));

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('API Admin Orders GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
