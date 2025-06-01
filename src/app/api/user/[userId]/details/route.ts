
// src/app/api/user/[userId]/details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { User } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  if (!userId || isNaN(parseInt(userId))) {
    return NextResponse.json({ message: 'Valid User ID is required' }, { status: 400 });
  }

  // In a real app, you would validate that the requesting user is authorized
  // to fetch these details (e.g., they are the user themselves, or an admin).
  // For this example, we'll assume authorization is handled elsewhere or not strictly needed.

  try {
    const usersFound = await query(
      'SELECT id, email, username, role, balance, referral_code, referred_by_user_id, created_at, updated_at, telegram_id FROM users WHERE id = ?',
      [parseInt(userId)]
    );
    
    if (!Array.isArray(usersFound) || usersFound.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userFromDb = usersFound[0] as User; 

    // Ensure balance is a number
    const processedUser: User = {
        ...userFromDb,
        balance: typeof userFromDb.balance === 'string' ? parseFloat(userFromDb.balance) : (typeof userFromDb.balance === 'number' ? userFromDb.balance : 0),
    };


    return NextResponse.json({ user: processedUser }, { status: 200 });

  } catch (error: any) {
    console.error(`API Error fetching details for user ${userId}:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
