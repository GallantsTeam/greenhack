
// src/app/api/user/[userId]/balance-transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { BalanceTransaction } from '@/types';

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
         id, 
         user_id, 
         transaction_type, 
         amount_gh, 
         description, 
         related_purchase_id,
         related_case_opening_id,
         related_referral_id,
         created_at
       FROM balance_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [parseInt(userId)]
    );

    const transactions: BalanceTransaction[] = results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      transaction_type: row.transaction_type,
      amount_gh: parseFloat(row.amount_gh),
      description: row.description,
      related_purchase_id: row.related_purchase_id,
      related_case_opening_id: row.related_case_opening_id,
      related_referral_id: row.related_referral_id,
      created_at: row.created_at,
    }));

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error(`API Error fetching balance transactions for user ${userId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
