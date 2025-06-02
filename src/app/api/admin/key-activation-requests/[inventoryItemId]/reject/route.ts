
// src/app/api/admin/key-activation-requests/[inventoryItemId]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { OkPacket } from 'mysql2';

export async function PUT(
  request: NextRequest,
  { params }: { params: { inventoryItemId: string } }
) {
  // TODO: Add admin authentication check
  const inventoryItemId = parseInt(params.inventoryItemId, 10);
  if (isNaN(inventoryItemId)) {
    return NextResponse.json({ message: 'Invalid inventory item ID' }, { status: 400 });
  }

  try {
    const { rejection_reason } = await request.json().catch(() => ({ rejection_reason: 'Отклонено администратором без указания причины.' }));

    const result = await query(
      'UPDATE user_inventory SET activation_status = ?, activation_status_reason = ?, updated_at = NOW() WHERE id = ? AND activation_status = ?',
      ['rejected', rejection_reason, inventoryItemId, 'pending_admin_approval']
    ) as OkPacket;

    if (result.affectedRows > 0) {
      // TODO: Send notification to user
      return NextResponse.json({ message: 'Запрос на активацию ключа успешно отклонен.' });
    } else {
      return NextResponse.json({ message: 'Запрос не найден в статусе ожидания или уже обработан.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Reject Key Activation (ID: ${inventoryItemId}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
