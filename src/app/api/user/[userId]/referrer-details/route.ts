
// src/app/api/user/[userId]/referrer-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { User, ReferrerDetails } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId; // This userId IS the ID of the user who referred the current logged-in user.

  if (!userId || isNaN(parseInt(userId))) {
    return NextResponse.json({ message: 'Valid User ID (referrer_user_id) is required' }, { status: 400 });
  }

  try {
    // Fetch the username of the user whose ID is params.userId (the referrer)
    const results = await query(
      `SELECT username FROM users WHERE id = ?`,
      [parseInt(userId)]
    );

    if (Array.isArray(results) && results.length > 0) {
      const referrerData = results[0] as Pick<User, 'username'>;
      const responseData: ReferrerDetails = { username: referrerData.username };
      return NextResponse.json(responseData);
    } else {
      // This means the referrer's user ID was not found in the users table.
      return NextResponse.json({ message: `Referrer user with ID ${userId} not found.` }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Error fetching referrer details for referrer ID ${userId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error while fetching referrer details.', error: error.message }, { status: 500 });
  }
}

