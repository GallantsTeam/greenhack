
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import bcrypt from 'bcryptjs';
import type { OkPacket, ResultSetHeader } from 'mysql2'; 
import type { User, SiteNotificationSettings } from '@/types';
import { sendRegistrationWelcomeEmail } from '@/lib/email'; 

const SETTINGS_ROW_ID = 1; 

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, referralCode: providedReferralCode } = await request.json();

    if (!email || !username || !password) {
      return NextResponse.json({ message: 'Missing required fields (email, username, password)' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    try {
      const existingUserByEmail = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (Array.isArray(existingUserByEmail) && existingUserByEmail.length > 0) {
        return NextResponse.json({ message: 'Пользователь с таким email уже существует.' }, { status: 409 });
      }
      const existingUserByUsername = await query('SELECT id FROM users WHERE username = ?', [username]);
       if (Array.isArray(existingUserByUsername) && existingUserByUsername.length > 0) {
        return NextResponse.json({ message: 'Пользователь с таким логином уже существует.' }, { status: 409 });
      }
    } catch (checkError: any) {
        console.error('API Error checking existing user:', checkError);
        return NextResponse.json({ message: `Database error during user check: ${checkError.message}` }, { status: 500 });
    }
    
    let referredByUserId: number | null = null;
    if (providedReferralCode) {
      const referrerResult = await query('SELECT id FROM users WHERE referral_code = ?', [providedReferralCode]);
      if (Array.isArray(referrerResult) && referrerResult.length > 0) {
        referredByUserId = referrerResult[0].id;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newReferralCode = `GH-${username.toUpperCase().slice(0,5)}${Date.now().toString().slice(-4)}`;
    const userBalance = 0.00;
    const defaultReferralPercentage = 5.00; // Default referral percentage for new users

    const result = await query(
      'INSERT INTO users (email, username, password_hash, role, balance, referral_code, referred_by_user_id, referral_percentage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email, username, hashedPassword, 'client', userBalance, newReferralCode, referredByUserId, defaultReferralPercentage] 
    );
    
    const insertResult = result as OkPacket | ResultSetHeader | any[];

    let insertId;
    if (Array.isArray(insertResult) && insertResult.length > 0 && 'insertId' in insertResult[0]) {
        insertId = insertResult[0].insertId;
    } else if (insertResult && 'insertId' in insertResult) { 
        insertId = (insertResult as OkPacket).insertId; 
    }

    if (insertId) {
      const newUser: Partial<User> = { 
        id: insertId, 
        email, 
        username, 
        role: 'client', 
        balance: userBalance, 
        referral_code: newReferralCode,
        referred_by_user_id: referredByUserId,
        referral_percentage: defaultReferralPercentage 
      };
      
      if (referredByUserId) {
        await query(
          'INSERT INTO referrals (referrer_user_id, referred_user_id, status) VALUES (?, ?, ?)',
          [referredByUserId, insertId, 'pending_purchase']
        );
      }

      try {
        const notificationSettingsResults = await query('SELECT notify_on_registration FROM site_notification_settings WHERE id = ? LIMIT 1', [SETTINGS_ROW_ID]);
        if (notificationSettingsResults.length > 0 && Boolean(notificationSettingsResults[0].notify_on_registration)) {
          await sendRegistrationWelcomeEmail(email, username);
        }
      } catch (emailError) {
        console.error("Failed to send registration email:", emailError);
      }

      return NextResponse.json({ message: 'User registered successfully', user: newUser }, { status: 201 });
    } else {
      console.error('User registration in DB failed, no insertId:', result);
      return NextResponse.json({ message: 'Failed to register user in DB.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Error processing registration request:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
