
// src/app/api/admin/payment-requests/[requestId]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { OkPacket } from 'mysql2';

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  // TODO: Add admin authentication
  const requestId = parseInt(params.requestId, 10);
  if (isNaN(requestId)) {
    return NextResponse.json({ message: 'Invalid request ID' }, { status: 400 });
  }

  try {
    const { admin_notes } = await request.json().catch(() => ({ admin_notes: 'Отклонено администратором' }));

    const result = await query(
      'UPDATE payment_requests SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ? AND status = ?',
      ['rejected', admin_notes || 'Отклонено администратором', requestId, 'pending']
    ) as OkPacket;

    if (result.affectedRows > 0) {
      // TODO: Optionally send a notification to the user that their request was rejected
      return NextResponse.json({ message: `Заявка #${requestId} успешно отклонена.` });
    } else {
      return NextResponse.json({ message: 'Заявка не найдена или уже обработана.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('API Reject Payment Request Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}
