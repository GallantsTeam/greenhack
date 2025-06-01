
// src/app/api/admin/reviews/[reviewId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { OkPacket } from 'mysql2';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  const reviewId = parseInt(params.reviewId, 10);
  if (isNaN(reviewId)) {
    return NextResponse.json({ message: 'Invalid review ID' }, { status: 400 });
  }

  try {
    // TODO: Add admin authentication check
    const result = await query('DELETE FROM reviews WHERE id = ?', [reviewId]) as OkPacket;

    if (result.affectedRows > 0) {
      return NextResponse.json({ message: 'Отзыв успешно удален.' });
    } else {
      return NextResponse.json({ message: 'Отзыв не найден или уже был удален.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Delete Review (ID: ${reviewId}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
