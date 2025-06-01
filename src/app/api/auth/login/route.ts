
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import bcrypt from 'bcryptjs';
import type { User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { emailOrLogin, password } = await request.json();

    if (!emailOrLogin || !password) {
      return NextResponse.json({ message: 'Missing email/login or password' }, { status: 400 });
    }

    // Changed 'login' to 'username' in the SQL query
    const usersFound = await query(
      'SELECT id, email, username, password_hash, role, balance, referral_code, referred_by_user_id FROM users WHERE email = ? OR username = ?',
      [emailOrLogin, emailOrLogin]
    );
    
    if (!Array.isArray(usersFound) || usersFound.length === 0) {
      return NextResponse.json({ message: 'Неверный email/логин или пароль.' }, { status: 401 });
    }

    const userFromDb = usersFound[0] as User & { password_hash?: string }; 

    const passwordMatch = await bcrypt.compare(password, userFromDb.password_hash || '');

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Неверный email/логин или пароль.' }, { status: 401 });
    }

    const { password_hash: _, ...userToReturn } = userFromDb;

    return NextResponse.json({ message: 'Login successful', user: userToReturn }, { status: 200 });

  } catch (error: any) {
    console.error('API Login Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

