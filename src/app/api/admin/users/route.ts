
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { User } from '@/types';
import bcrypt from 'bcryptjs';
import type { OkPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const usersData = await query(
      'SELECT id, username, email, role, balance, created_at, referral_code, referred_by_user_id, referral_percentage FROM users ORDER BY created_at DESC'
    );

    const users: User[] = usersData.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      balance: parseFloat(user.balance) || 0,
      created_at: user.created_at,
      referral_code: user.referral_code,
      referred_by_user_id: user.referred_by_user_id,
      referral_percentage: user.referral_percentage ? parseFloat(user.referral_percentage) : 5.00, // Default if null
    }));

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('API Admin Users GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, role, balance, referral_percentage } = await request.json();

    if (!username || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingUserByEmail = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (Array.isArray(existingUserByEmail) && existingUserByEmail.length > 0) {
      return NextResponse.json({ message: 'Пользователь с таким email уже существует.' }, { status: 409 });
    }
    const existingUserByUsername = await query('SELECT id FROM users WHERE username = ?', [username]);
     if (Array.isArray(existingUserByUsername) && existingUserByUsername.length > 0) {
      return NextResponse.json({ message: 'Пользователь с таким логином уже существует.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newReferralCode = `GH-${username.toUpperCase().slice(0,5)}${Date.now().toString().slice(-4)}`;
    const userBalance = balance !== undefined ? parseFloat(balance) : 0.00;
    const userReferralPercentage = referral_percentage !== undefined ? parseFloat(referral_percentage) : 5.00;

    const result = await query(
      'INSERT INTO users (username, email, password_hash, role, balance, referral_code, referral_percentage) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, userBalance, newReferralCode, userReferralPercentage.toFixed(2)]
    ) as OkPacket | ResultSetHeader | any[];

    let insertId;
    if (Array.isArray(result) && result.length > 0 && 'insertId' in result[0]) {
        insertId = result[0].insertId;
    } else if (result && 'insertId' in result) { 
        insertId = (result as OkPacket).insertId; 
    }

    if (insertId) {
      const newUser: Partial<User> = { 
          id: insertId, 
          username, 
          email, 
          role, 
          balance: userBalance, 
          referral_code: newReferralCode,
          referral_percentage: userReferralPercentage 
        };
      return NextResponse.json({ message: 'User created successfully', user: newUser }, { status: 201 });
    } else {
      console.error('User creation in DB failed, no insertId:', result);
      return NextResponse.json({ message: 'Failed to create user in DB.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Admin Users POST Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
