
// src/app/api/admin/users/[userId]/case-openings-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { CaseOpeningRecordWithDetails } from '@/types';

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
         coh.id, 
         coh.user_id, 
         coh.case_id, 
         coh.won_prize_id, 
         coh.opened_at, 
         coh.action_taken, 
         coh.sold_value_gh,
         c.name as case_name,
         cp.name as prize_name,
         cp.image_url as prize_image_url,
         cp.duration_days as prize_duration_days,
         cp.balance_gh_amount as prize_balance_gh_amount
       FROM case_openings_history coh
       JOIN cases c ON coh.case_id = c.id
       JOIN case_prizes cp ON coh.won_prize_id = cp.id
       WHERE coh.user_id = ?
       ORDER BY coh.opened_at DESC`,
      [parseInt(userId)]
    );

    const caseHistory: CaseOpeningRecordWithDetails[] = results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      case_id: row.case_id,
      won_prize_id: row.won_prize_id,
      opened_at: row.opened_at,
      action_taken: row.action_taken,
      sold_value_gh: row.sold_value_gh ? parseFloat(row.sold_value_gh) : null,
      balance_transaction_id: row.balance_transaction_id, // Assuming this column exists from previous schema
      case_name: row.case_name,
      prize_name: row.prize_name,
      prize_image_url: row.prize_image_url,
      prize_duration_days: row.prize_duration_days,
      prize_balance_gh_amount: row.prize_balance_gh_amount ? parseFloat(row.prize_balance_gh_amount) : null,
    }));

    return NextResponse.json(caseHistory);
  } catch (error: any) {
    console.error(`API Error fetching case history for user ${userId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
