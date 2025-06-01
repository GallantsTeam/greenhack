
// src/app/api/referral/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { User } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ message: 'Реферальный код обязателен.' }, { status: 400 });
  }

  try {
    const users = await query('SELECT id, username FROM users WHERE referral_code = ?', [code]);

    if (Array.isArray(users) && users.length > 0) {
      const referrer = users[0] as Pick<User, 'id' | 'username'>;
      return NextResponse.json({ isValid: true, referrerName: referrer.username, referrerId: referrer.id });
    } else {
      return NextResponse.json({ isValid: false, message: 'Реферальный код не найден.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('API Error checking referral code:', error);
    return NextResponse.json({ message: 'Ошибка при проверке реферального кода.', error: error.message }, { status: 500 });
  }
}
