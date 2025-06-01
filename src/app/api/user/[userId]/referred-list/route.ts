// src/app/api/user/[userId]/referred-list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Referral } from '@/types';

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
      `SELECT r.id, r.referrer_user_id, r.referred_user_id, r.status, r.reward_amount_gh, r.created_at, r.reward_claimed_at, r.reward_description, u_referred.username as referred_username
       FROM referrals r
       LEFT JOIN users u_referred ON r.referred_user_id = u_referred.id -- Changed to LEFT JOIN
       WHERE r.referrer_user_id = ?
       ORDER BY r.created_at DESC`,
      [parseInt(userId)]
    );

    const referrals: Referral[] = results.map((row: any) => ({
      id: row.id,
      referrer_user_id: row.referrer_user_id,
      referred_user_id: row.referred_user_id,
      status: row.status,
      reward_amount_gh: row.reward_amount_gh ? parseFloat(row.reward_amount_gh) : null,
      created_at: row.created_at,
      reward_claimed_at: row.reward_claimed_at,
      reward_description: row.reward_description,
      referred_username: row.referred_username,
    }));

    return NextResponse.json(referrals);
  } catch (error: any) {
    console.error(`API Error fetching referred list for user ${userId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}