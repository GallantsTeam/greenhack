
// src/app/api/admin/key-activation-requests/[inventoryItemId]/approve/route.ts
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
    // Fetch duration_days for the item
    const itemDetailsResults = await query(
      `SELECT 
         COALESCE(ppo.duration_days, cp.duration_days) as duration_days
       FROM user_inventory ui
       LEFT JOIN product_pricing_options ppo ON ui.product_pricing_option_id = ppo.id
       LEFT JOIN case_prizes cp ON ui.case_prize_id = cp.id
       WHERE ui.id = ?`,
      [inventoryItemId]
    );

    if (itemDetailsResults.length === 0) {
      return NextResponse.json({ message: 'Предмет инвентаря не найден.' }, { status: 404 });
    }
    const itemDetails = itemDetailsResults[0];
    const durationDays = itemDetails.duration_days ? parseInt(itemDetails.duration_days, 10) : null;

    const activatedAt = new Date();
    let expiresAt: string | null = null;

    if (durationDays && durationDays > 0) {
      const expiryDate = new Date(activatedAt);
      expiryDate.setDate(expiryDate.getDate() + durationDays);
      expiresAt = expiryDate.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    console.log(`Approving item ${inventoryItemId}. Duration: ${durationDays}, Calculated Expires At: ${expiresAt}`);

    const result = await query(
      'UPDATE user_inventory SET activation_status = ?, is_used = TRUE, activated_at = ?, expires_at = ?, updated_at = NOW() WHERE id = ? AND activation_status = ?',
      ['active', activatedAt.toISOString().slice(0, 19).replace('T', ' '), expiresAt, inventoryItemId, 'pending_admin_approval']
    ) as OkPacket;

    if (result.affectedRows > 0) {
      // TODO: Send notification to user
      return NextResponse.json({ message: 'Запрос на активацию ключа успешно одобрен.' });
    } else {
      return NextResponse.json({ message: 'Запрос не найден в статусе ожидания или уже обработан.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Approve Key Activation (ID: ${inventoryItemId}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
