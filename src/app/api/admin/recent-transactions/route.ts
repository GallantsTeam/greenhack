
// src/app/api/admin/recent-transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { BalanceTransaction } from '@/types';

export async function GET(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const results = await query(
      `SELECT 
         bt.id, 
         bt.user_id, 
         u.username as user_username, 
         bt.transaction_type, 
         bt.amount_gh, 
         bt.description, 
         bt.created_at
       FROM balance_transactions bt
       JOIN users u ON bt.user_id = u.id
       WHERE bt.transaction_type IN ('deposit', 'referral_bonus') -- Deposits and promo code balance additions
       ORDER BY bt.created_at DESC
       LIMIT 10` // Fetch last 10 relevant transactions
    );

    const transactions: BalanceTransaction[] = results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      user_username: row.user_username, // Added from JOIN
      transaction_type: row.transaction_type,
      amount_gh: parseFloat(row.amount_gh),
      description: row.description,
      created_at: row.created_at,
    }));

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error('API Admin Recent Transactions GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
