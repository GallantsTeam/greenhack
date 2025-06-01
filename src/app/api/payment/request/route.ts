
// src/app/api/payment/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { User } from '@/types';
import type { OkPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { userId, amountGh } = await request.json();

    if (!userId || typeof amountGh !== 'number' || amountGh <= 0) {
      return NextResponse.json({ message: 'Неверный ID пользователя или сумма.' }, { status: 400 });
    }

    const usersFound = await query('SELECT id, username FROM users WHERE id = ?', [userId]);
    if (usersFound.length === 0) {
      return NextResponse.json({ message: 'Пользователь не найден.' }, { status: 404 });
    }
    const user: User = usersFound[0];

    const result = await query(
      'INSERT INTO payment_requests (user_id, username, amount_gh, status, payment_method_details) VALUES (?, ?, ?, ?, ?)',
      [userId, user.username, amountGh, 'pending', 'Тестовый платеж (Card)']
    ) as OkPacket;

    if (result.affectedRows > 0) {
      return NextResponse.json({ message: 'Заявка на пополнение успешно создана.', requestId: result.insertId }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Не удалось создать заявку на пополнение.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Payment Request Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}
