
// src/app/api/user/[userId]/purchase-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Purchase } from '@/types'; 

interface PurchaseHistoryItem extends Purchase {
  product_name?: string;
  product_pricing_option_duration_days?: number | null; 
  product_pricing_option_mode_label?: string | null; // Changed from is_pvp
  description?: string; 
}

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
         p.id, 
         p.user_id, 
         p.product_id, 
         p.product_pricing_option_id, 
         p.purchase_date, 
         p.amount_paid_gh, 
         p.status,
         prod.name as product_name,
         ppo.duration_days as product_pricing_option_duration_days,
         ppo.mode_label as product_pricing_option_mode_label, 
         bt.description
       FROM purchases p
       LEFT JOIN products prod ON p.product_id = prod.id 
       LEFT JOIN product_pricing_options ppo ON p.product_pricing_option_id = ppo.id
       LEFT JOIN balance_transactions bt ON p.balance_transaction_id = bt.id 
       WHERE p.user_id = ?
       ORDER BY p.purchase_date DESC`,
      [parseInt(userId)]
    );

    const purchaseHistory: PurchaseHistoryItem[] = results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      product_pricing_option_id: row.product_pricing_option_id,
      purchase_date: row.purchase_date,
      amount_paid_gh: parseFloat(row.amount_paid_gh),
      status: row.status,
      product_name: row.product_name,
      product_pricing_option_duration_days: row.product_pricing_option_duration_days,
      product_pricing_option_mode_label: row.product_pricing_option_mode_label, 
      description: row.description, 
    }));

    return NextResponse.json(purchaseHistory);
  } catch (error: any) {
    console.error(`API Error fetching purchase history for user ${userId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
