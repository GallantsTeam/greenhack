
// src/app/api/user/[userId]/referred-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { ReferredUsersCount } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  if (!userId || isNaN(parseInt(userId))) {
    return NextResponse.json({ message: 'Valid User ID is required' }, { status: 400 });
  }

  try {
    // Option 1: Count directly from users table
    // const results = await query('SELECT COUNT(*) as count FROM users WHERE referred_by_user_id = ?', [parseInt(userId)]);
    
    // Option 2: Count from referrals table (might be more accurate if you track referral status there)
    const results = await query('SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ?', [parseInt(userId)]);


    if (Array.isArray(results) && results.length > 0) {
      const countData = results[0] as { count: number };
      const responseData: ReferredUsersCount = { count: countData.count };
      return NextResponse.json(responseData);
    } else {
      // Should not happen if COUNT(*) is used, it always returns a row.
      // This means the query itself failed or returned unexpected structure.
      return NextResponse.json({ count: 0 }); // Default to 0 if no records or error
    }
  } catch (error: any) {
    console.error(`API Error fetching referred count for user ${userId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
