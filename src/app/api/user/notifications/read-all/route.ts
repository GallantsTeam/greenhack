
// src/app/api/user/notifications/read-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { OkPacket } from 'mysql2';

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ message: 'Valid User ID is required in the request body.' }, { status: 400 });
    }

    // TODO: Add authentication to ensure the requesting user matches userId or is an admin

    const result = await query(
      'UPDATE user_notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [parseInt(userId)]
    ) as OkPacket;

    // affectedRows will be 0 if no unread messages, which is a success case.
    // If the query fails, it will throw an error caught by the catch block.
    return NextResponse.json({ message: 'All unread notifications marked as read.' });

  } catch (error: any) {
    console.error('API Mark All Notifications Read Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
