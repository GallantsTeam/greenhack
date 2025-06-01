
// src/app/api/admin/promocodes/[promoCodeId]/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { PromoCodeActivator } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { promoCodeId: string } }
) {
  const id = parseInt(params.promoCodeId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid promo code ID' }, { status: 400 });
  }

  try {
    // SQL to fetch users who have used this promo code
    const results = await query(
      `SELECT 
         u.id, 
         u.username, 
         u.email,
         upcu.used_at
       FROM user_promo_code_uses upcu
       JOIN users u ON upcu.user_id = u.id
       WHERE upcu.promo_code_id = ?
       ORDER BY upcu.used_at DESC`,
      [id]
    );

    const activators: PromoCodeActivator[] = results.map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      used_at: row.used_at,
    }));

    return NextResponse.json(activators);
  } catch (error: any) {
    console.error(`API Admin PromoCode Users GET (ID: ${id}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
