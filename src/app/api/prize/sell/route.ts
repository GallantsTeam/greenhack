
// src/app/api/prize/sell/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Prize, User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, caseOpeningId, prize } = await request.json() as { userId: number, caseOpeningId: number, prize: Prize };

    if (!userId || !caseOpeningId || !prize || !prize.id || typeof prize.sell_value_gh !== 'number') {
      return NextResponse.json({ message: 'Missing required fields or invalid prize data for selling' }, { status: 400 });
    }
    
    // Ensure prize type is not 'balance_gh' for selling, as those are auto-credited
    if (prize.prize_type === 'balance_gh') {
        return NextResponse.json({ message: 'Призы типа "Баланс GH" не могут быть проданы, они зачисляются автоматически.' }, { status: 400 });
    }

    const openingResults = await query(
      'SELECT * FROM case_openings_history WHERE id = ? AND user_id = ? AND action_taken = ?',
      [caseOpeningId, userId, 'pending']
    );

    if (openingResults.length === 0) {
      return NextResponse.json({ message: 'Invalid or already processed case opening.' }, { status: 400 });
    }

    const openingRecord = openingResults[0];
    if (openingRecord.won_prize_id !== prize.id) {
        return NextResponse.json({ message: 'Prize mismatch with opening record.' }, { status: 400 });
    }

    const usersFound = await query('SELECT id, balance FROM users WHERE id = ?', [userId]);
    if (usersFound.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const user: User = usersFound[0];
    let currentBalance = 0;
    if (typeof user.balance === 'string') {
        currentBalance = parseFloat(user.balance);
    } else if (typeof user.balance === 'number') {
        currentBalance = user.balance;
    }
    if(isNaN(currentBalance)) currentBalance = 0;

    const newBalance = currentBalance + prize.sell_value_gh;

    await query('UPDATE users SET balance = ? WHERE id = ?', [newBalance.toFixed(2), userId]);

    await query(
      'INSERT INTO balance_transactions (user_id, transaction_type, amount_gh, description, related_case_opening_id) VALUES (?, ?, ?, ?, ?)',
      [userId, 'sell_prize', prize.sell_value_gh, `Продажа приза из кейса: ${prize.name}`, caseOpeningId]
    );

    await query(
      'UPDATE case_openings_history SET action_taken = ?, sold_value_gh = ? WHERE id = ?',
      ['sold', prize.sell_value_gh, caseOpeningId]
    );
    
    const updatedUserResponse = await query('SELECT id, username, email, role, balance, referral_code, referred_by_user_id FROM users WHERE id = ?', [userId]);
    const updatedUser = updatedUserResponse[0];
    if(updatedUser && typeof updatedUser.balance === 'string') {
        updatedUser.balance = parseFloat(updatedUser.balance);
    } else if (updatedUser && typeof updatedUser.balance !== 'number') {
        updatedUser.balance = 0;
    }

    return NextResponse.json({ message: `${prize.name} успешно продан. ${prize.sell_value_gh} GH зачислено на баланс.`, updatedUser }, { status: 200 });

  } catch (error: any) {
    console.error('API Prize Sell Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
