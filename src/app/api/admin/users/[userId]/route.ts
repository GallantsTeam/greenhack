
// src/app/api/admin/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { User } from '@/types';
import bcrypt from 'bcryptjs';
import type { OkPacket, ResultSetHeader } from 'mysql2';

const PROTECTED_USER_ID = 4;

// Helper function to get user by ID
async function getUserById(userId: number): Promise<User | null> {
  const users = await query('SELECT id, username, email, role, balance, referral_code, referred_by_user_id, referral_percentage, created_at, updated_at, telegram_id FROM users WHERE id = ?', [userId]);
  if (Array.isArray(users) && users.length > 0) {
    const user = users[0] as User;
    user.balance = parseFloat(user.balance as any || '0');
    user.referral_percentage = user.referral_percentage ? parseFloat(user.referral_percentage as any) : 5.00; // Default if null
    return user;
  }
  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = parseInt(params.userId);
  if (isNaN(userId)) {
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }

  if (userId === PROTECTED_USER_ID) {
    return NextResponse.json({ message: 'Этого пользователя нельзя редактировать.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { username, email, password, role, balance, referral_percentage } = body;

    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const updateFields: string[] = [];
    const queryParams: any[] = [];

    if (username && username !== existingUser.username) {
      const existingUserByUsername = await query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
      if (Array.isArray(existingUserByUsername) && existingUserByUsername.length > 0) {
        return NextResponse.json({ message: 'Пользователь с таким логином уже существует.' }, { status: 409 });
      }
      updateFields.push('username = ?');
      queryParams.push(username);
    }

    if (email && email !== existingUser.email) {
      const existingUserByEmail = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (Array.isArray(existingUserByEmail) && existingUserByEmail.length > 0) {
        return NextResponse.json({ message: 'Пользователь с таким email уже существует.' }, { status: 409 });
      }
      updateFields.push('email = ?');
      queryParams.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      queryParams.push(hashedPassword);
    }

    if (role && role !== existingUser.role) {
      updateFields.push('role = ?');
      queryParams.push(role);
    }
    
    if (balance !== undefined && typeof balance === 'number' && balance !== existingUser.balance) {
        updateFields.push('balance = ?');
        queryParams.push(parseFloat(balance as any).toFixed(2));
    }

    if (referral_percentage !== undefined && typeof referral_percentage === 'number' && referral_percentage !== existingUser.referral_percentage) {
        updateFields.push('referral_percentage = ?');
        queryParams.push(parseFloat(referral_percentage as any).toFixed(2));
    }


    if (updateFields.length === 0) {
      return NextResponse.json({ message: 'No fields to update', user: existingUser }, { status: 200 });
    }

    const sqlQuery = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    queryParams.push(userId);

    const result = await query(sqlQuery, queryParams) as OkPacket | ResultSetHeader | any[];
    
    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) {
        affectedRows = (result as OkPacket).affectedRows;
    }

    if (affectedRows > 0) {
      const updatedUser = await getUserById(userId);
      return NextResponse.json({ message: 'User updated successfully', user: updatedUser }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'User not updated or no changes provided', user: existingUser }, { status: 200 });
    }

  } catch (error: any) {
    console.error(`API Admin User PUT (ID: ${userId}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = parseInt(params.userId);
  if (isNaN(userId)) {
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }

  if (userId === PROTECTED_USER_ID) {
    return NextResponse.json({ message: 'Этого пользователя нельзя удалять.' }, { status: 403 });
  }

  try {
    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Handle foreign key constraints before deleting the user
    // Set referred_by_user_id to NULL for users who were referred by the user being deleted
    await query('UPDATE users SET referred_by_user_id = NULL WHERE referred_by_user_id = ?', [userId]);
    
    // Delete entries from referrals table where this user is either referrer or referred
    await query('DELETE FROM referrals WHERE referrer_user_id = ? OR referred_user_id = ?', [userId, userId]);
    
    // Delete related balance transactions
    await query('DELETE FROM balance_transactions WHERE user_id = ?', [userId]);
    
    // Delete related purchases
    await query('DELETE FROM purchases WHERE user_id = ?', [userId]);
    
    // Delete related case openings history
    await query('DELETE FROM case_openings_history WHERE user_id = ?', [userId]);
    
    // Delete related inventory items
    await query('DELETE FROM user_inventory WHERE user_id = ?', [userId]);
    
    // Delete from user_promo_code_uses
    await query('DELETE FROM user_promo_code_uses WHERE user_id = ?', [userId]);

    // Finally, delete the user
    const result = await query('DELETE FROM users WHERE id = ?', [userId]) as OkPacket | ResultSetHeader | any[];
    
    let affectedRows = 0;
     if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) {
        affectedRows = (result as OkPacket).affectedRows;
    }


    if (affectedRows > 0) {
      return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'User not found or already deleted' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin User DELETE (ID: ${userId}) Error:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.message.includes('foreign key constraint fails')) {
        return NextResponse.json({ message: `Cannot delete user: This user is referenced in other records that could not be automatically cleared. Error: ${error.message}` }, { status: 409 });
    }
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
