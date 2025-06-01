
// src/app/api/admin/promocodes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { PromoCode } from '@/types';
import { OkPacket, ResultSetHeader } from 'mysql2';
import { notifyAdminOnPromoCodeCreation } from '@/lib/telegram'; 

export async function POST(request: NextRequest) {
  try {
    const body: Partial<PromoCode> = await request.json();
    const {
      code,
      type,
      value_gh,
      related_product_id,
      product_pricing_option_id,
      max_uses,
      expires_at,
      is_active,
    } = body;

    if (!code || !type || max_uses === undefined) {
      return NextResponse.json({ message: 'Код, тип и макс. использования обязательны.' }, { status: 400 });
    }

    if (type === 'balance_gh' && (value_gh === null || value_gh === undefined || value_gh <= 0)) {
      return NextResponse.json({ message: 'Для типа "Баланс GH" сумма должна быть больше 0.' }, { status: 400 });
    }
    if (type === 'product' && (!related_product_id || product_pricing_option_id === null || product_pricing_option_id === undefined)) {
      return NextResponse.json({ message: 'Для типа "Товар" необходимо выбрать товар и вариант цены.' }, { status: 400 });
    }

    const existingCode = await query('SELECT id FROM promo_codes WHERE code = ?', [code]);
    if (Array.isArray(existingCode) && existingCode.length > 0) {
      return NextResponse.json({ message: 'Промокод с таким кодом уже существует.' }, { status: 409 });
    }

    const insertQuery = `
      INSERT INTO promo_codes (
        code, type, value_gh, related_product_id, product_pricing_option_id,
        max_uses, expires_at, is_active, current_uses, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
    `;
    const params = [
      code,
      type,
      type === 'balance_gh' ? value_gh : null,
      type === 'product' ? related_product_id : null,
      type === 'product' ? product_pricing_option_id : null,
      max_uses,
      expires_at ? new Date(expires_at).toISOString().slice(0, 19).replace('T', ' ') : null,
      is_active === undefined ? true : Boolean(is_active),
    ];

    const result = await query(insertQuery, params) as OkPacket | ResultSetHeader | any[];
    
    let insertId: number | undefined;
    if (Array.isArray(result) && result.length > 0 && 'insertId' in result[0]) {
        insertId = result[0].insertId;
    } else if (result && 'insertId' in result) { 
        insertId = (result as OkPacket).insertId; 
    }

    if (insertId) {
      const newPromoCodeResult = await query(
        `SELECT pc.*, p.name as product_name, ppo.duration_days, ppo.mode_label 
         FROM promo_codes pc 
         LEFT JOIN products p ON pc.related_product_id = p.id 
         LEFT JOIN product_pricing_options ppo ON pc.product_pricing_option_id = ppo.id 
         WHERE pc.id = ?`, 
        [insertId]
      );
      const newPromoCodeData = newPromoCodeResult[0];
      
      try {
        await notifyAdminOnPromoCodeCreation(null, { 
            code: newPromoCodeData.code,
            type: newPromoCodeData.type,
            value_gh: newPromoCodeData.value_gh ? parseFloat(newPromoCodeData.value_gh) : null,
            product_name: newPromoCodeData.product_name,
            duration_days: newPromoCodeData.duration_days,
            mode_label: newPromoCodeData.mode_label, 
            max_uses: newPromoCodeData.max_uses,
            expires_at: newPromoCodeData.expires_at,
        });
      } catch (telegramError) {
        console.error("Failed to send Telegram admin notification for promo code creation:", telegramError);
      }

      return NextResponse.json({ message: 'Промокод успешно создан', promoCode: newPromoCodeData }, { status: 201 });
    } else {
      console.error('Promo code creation in DB failed, no insertId:', result);
      return NextResponse.json({ message: 'Не удалось создать промокод в базе данных.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API Admin PromoCodes POST Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const promoCodesData = await query(
      `SELECT 
         pc.*,
         p.name as product_name,
         ppo.duration_days,
         ppo.price_rub,
         ppo.price_gh as option_price_gh,
         ppo.mode_label as pricing_option_mode_label 
       FROM promo_codes pc
       LEFT JOIN products p ON pc.related_product_id = p.id
       LEFT JOIN product_pricing_options ppo ON pc.product_pricing_option_id = ppo.id
       ORDER BY pc.created_at DESC`
    );

    const now = new Date();
    const activePromoCodes: PromoCode[] = [];
    const usedOrExpiredPromoCodes: PromoCode[] = [];

    promoCodesData.forEach((row: any) => {
      const code: PromoCode = {
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
        pricing_option_description: row.duration_days 
          ? `${row.duration_days} дн.` 
          : undefined, 
        pricing_option_mode_label: row.pricing_option_mode_label,
      };

      const isExpired = code.expires_at ? new Date(code.expires_at) < now : false;
      const isUsesExhausted = code.current_uses >= code.max_uses;

      if (code.is_active && !isExpired && !isUsesExhausted) {
        activePromoCodes.push(code);
      } else {
        usedOrExpiredPromoCodes.push(code);
      }
    });

    return NextResponse.json({ activePromoCodes, usedOrExpiredPromoCodes });
  } catch (error: any) {
    console.error('API Admin PromoCodes GET Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}

    
