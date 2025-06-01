
// src/app/api/user/[userId]/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { UserNotification } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get('countOnly') === 'true';
  const statusFilter = searchParams.get('status'); // e.g., 'unread'

  if (!userId || isNaN(parseInt(userId))) {
    return NextResponse.json({ message: 'Valid User ID is required' }, { status: 400 });
  }

  try {
    if (countOnly && statusFilter === 'unread') {
      const countResults = await query(
        'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = FALSE',
        [parseInt(userId)]
      );
      const count = countResults[0]?.count || 0;
      return NextResponse.json({ count });
    }

    const results = await query(
      'SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [parseInt(userId)]
    );

    const notifications: UserNotification[] = results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      message: row.message,
      link_url: row.link_url,
      is_read: Boolean(row.is_read),
      created_at: row.created_at,
    }));
    
    // Always return an array, even if it's empty, with a 200 OK status.
    return NextResponse.json(notifications, { status: 200 });

  } catch (error: any) {
    console.error(`API Error fetching notifications for user ${userId}:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
