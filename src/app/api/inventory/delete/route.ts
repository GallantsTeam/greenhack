
// src/app/api/inventory/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { OkPacket } from 'mysql2';

export async function DELETE(request: NextRequest) {
  try {
    const { userId, inventoryItemId } = await request.json();
    console.log('[API Delete] Received request:', { userId, inventoryItemId });

    if (!userId || !inventoryItemId) {
      console.log('[API Delete] Missing userId or inventoryItemId');
      return NextResponse.json({ message: 'Missing userId or inventoryItemId' }, { status: 400 });
    }
    
    const result = await query(
      'DELETE FROM user_inventory WHERE id = ? AND user_id = ?',
      [inventoryItemId, userId]
    ) as OkPacket;

    if (result.affectedRows > 0) {
      console.log(`[API Delete] Item ${inventoryItemId} for user ${userId} deleted successfully.`);
      return NextResponse.json({ message: 'Предмет успешно удален из инвентаря.' }, { status: 200 });
    } else {
      console.log(`[API Delete] Item ${inventoryItemId} not found or not owned by user ${userId}.`);
      return NextResponse.json({ message: 'Предмет не найден или не принадлежит вам.' }, { status: 404 });
    }

  } catch (error: any) {
    console.error('[API Inventory Delete Error]:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

    