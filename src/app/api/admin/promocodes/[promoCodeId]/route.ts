
// src/app/api/admin/promocodes/[promoCodeId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { PromoCode } from '@/types';
import { OkPacket, ResultSetHeader } from 'mysql2';

export async function GET(
  request: NextRequest,
  { params }: { params: { promoCodeId: string } }
) {
  const id = parseInt(params.promoCodeId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid promo code ID' }, { status: 400 });
  }

  try {
    const results = await query(
      `SELECT 
         pc.*,
         p.name as product_name,
         ppo.duration_days,
         ppo.price_rub,
         ppo.price_gh as option_price_gh,
         ppo.is_pvp
       FROM promo_codes pc
       LEFT JOIN products p ON pc.related_product_id = p.id
       LEFT JOIN product_pricing_options ppo ON pc.product_pricing_option_id = ppo.id
       WHERE pc.id = ?`,
      [id]
    );

    if (results.length === 0) {
      return NextResponse.json({ message: 'Promo code not found' }, { status: 404 });
    }
    const row = results[0];
    const promoCode: PromoCode = {
        id: row.id,
        code: row.code,
        type: row.type,
        value_gh: row.value_gh ? parseFloat(row.value_gh) : null,
        related_product_id: row.related_product_id,
        product_pricing_option_id: row.product_pricing_option_id,
        max_uses: row.max_uses,
        current_uses: row.current_uses,
        expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null,
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at,
        product_name: row.product_name,
        pricing_option_description: row.duration_days ? `${row.duration_days} дн. (${row.is_pvp ? 'PVP' : 'PVE'})` : undefined,
    };
    return NextResponse.json(promoCode);
  } catch (error: any) {
    console.error(`API Admin PromoCode GET (ID: ${id}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params: routeParams }: { params: { promoCodeId: string } }
) {
  const id = parseInt(routeParams.promoCodeId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid promo code ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      // code, // Usually, code is not editable after creation
      type,
      value_gh,
      related_product_id,
      product_pricing_option_id,
      max_uses,
      expires_at,
      is_active,
    } = body;

    if (!type || typeof max_uses !== 'number') {
      return NextResponse.json({ message: 'Тип и макс. использования обязательны.' }, { status: 400 });
    }
    if (type === 'balance_gh' && (value_gh === null || value_gh === undefined || value_gh <= 0)) {
      return NextResponse.json({ message: 'Для типа "Баланс GH" сумма должна быть больше 0.' }, { status: 400 });
    }
    if (type === 'product' && (!related_product_id || product_pricing_option_id === null || product_pricing_option_id === undefined)) {
      return NextResponse.json({ message: 'Для типа "Товар" необходимо выбрать товар и вариант цены.' }, { status: 400 });
    }

    let dbExpiresAt: string | null = null;
    if (expires_at) {
        try {
            dbExpiresAt = new Date(expires_at).toISOString().slice(0, 19).replace('T', ' ');
        } catch (e) {
            return NextResponse.json({ message: 'Неверный формат даты истечения.' }, { status: 400 });
        }
    }

    const updateQuery = `
      UPDATE promo_codes SET
        type = ?, 
        value_gh = ?, 
        related_product_id = ?, 
        product_pricing_option_id = ?,
        max_uses = ?, 
        expires_at = ?, 
        is_active = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    const queryParams = [
      type,
      type === 'balance_gh' ? value_gh : null,
      type === 'product' ? related_product_id : null,
      type === 'product' ? product_pricing_option_id : null,
      max_uses,
      dbExpiresAt,
      is_active === undefined ? true : Boolean(is_active),
      id,
    ];

    const result = await query(updateQuery, queryParams) as OkPacket | ResultSetHeader | any[];

    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) { 
        affectedRows = (result as OkPacket).affectedRows; 
    }

    if (affectedRows > 0) {
      const updatedPromoCodeResults = await query('SELECT * FROM promo_codes WHERE id = ?', [id]);
      return NextResponse.json({ message: 'Промокод успешно обновлен', promoCode: updatedPromoCodeResults[0] }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Промокод не найден или данные не были изменены.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin PromoCode PUT (ID: ${id}) Error:`, error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}

// Placeholder for DELETE if needed later
// export async function DELETE(request: NextRequest, { params }: { params: { promoCodeId: string } }) {}
