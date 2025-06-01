
// src/app/api/admin/reviews/pending-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET(request: NextRequest) {
  try {
    // TODO: Добавить проверку аутентификации администратора
    const results = await query("SELECT COUNT(*) as count FROM reviews WHERE status = 'pending'");
    const count = results[0]?.count || 0;
    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('API Admin Pending Reviews Count GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
