
// src/app/api/admin/reviews/[reviewId]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { OkPacket } from 'mysql2';

export async function PUT(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  const reviewId = parseInt(params.reviewId, 10);
  if (isNaN(reviewId)) {
    return NextResponse.json({ message: 'Invalid review ID' }, { status: 400 });
  }

  try {
    // TODO: Add admin authentication check
    const approved_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const result = await query(
      'UPDATE reviews SET status = ?, approved_at = ?, updated_at = NOW() WHERE id = ?',
      ['approved', approved_at, reviewId]
    ) as OkPacket;

    if (result.affectedRows > 0) {
      return NextResponse.json({ message: 'Отзыв успешно одобрен.' });
    } else {
      return NextResponse.json({ message: 'Отзыв не найден или уже одобрен.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Approve Review (ID: ${reviewId}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
