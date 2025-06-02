
// src/app/api/admin/key-activation-requests/pending-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const results = await query(
      "SELECT COUNT(*) as count FROM user_inventory WHERE activation_status = 'pending_admin_approval'"
    );
    const count = results[0]?.count || 0;
    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('API Admin Pending Key Activation Requests Count GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
