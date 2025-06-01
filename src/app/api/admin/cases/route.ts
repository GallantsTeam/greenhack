
// src/app/api/admin/cases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { CaseItem } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic'; // Ensure fresh data for admin list

export async function GET(request: NextRequest) {
  try {
    const results = await query(
      `SELECT
         c.id,
         c.name,
         c.image_url,
         c.base_price_gh,
         c.description,
         c.data_ai_hint,
         c.is_active,
         c.is_hot_offer,
         c.timer_enabled,
         c.timer_ends_at,
         c.created_at,
         (SELECT COUNT(*) FROM case_prizes cp WHERE cp.case_id = c.id) as prize_count
       FROM cases c
       ORDER BY c.name ASC`
    );

    if (!Array.isArray(results)) {
      console.error('API Admin Cases GET Error: Expected an array from database query, received:', results);
      return NextResponse.json({ message: 'Failed to retrieve cases: unexpected database response format.' }, { status: 500 });
    }

    const cases: CaseItem[] = results.map((row: any) => ({
      id: row.id,
      name: row.name,
      image_url: row.image_url ? String(row.image_url).trim() : null,
      imageUrl: (row.image_url ? String(row.image_url).trim() : `https://placehold.co/300x200.png?text=${encodeURIComponent(row.name)}`),
      base_price_gh: row.base_price_gh !== null && !isNaN(parseFloat(String(row.base_price_gh))) ? parseFloat(String(row.base_price_gh)) : 0,
      description: row.description ? String(row.description) : null,
      data_ai_hint: row.data_ai_hint ? String(row.data_ai_hint) : null,
      is_active: Boolean(row.is_active),
      is_hot_offer: Boolean(row.is_hot_offer),
      timer_enabled: Boolean(row.timer_enabled),
      timer_ends_at: row.timer_ends_at ? new Date(row.timer_ends_at).toISOString() : null,
      created_at: row.created_at,
      prize_count: row.prize_count !== null && !isNaN(parseInt(String(row.prize_count))) ? parseInt(String(row.prize_count)) : 0,
    }));

    return NextResponse.json(cases);
  } catch (error: any) {
    console.error('API Admin Cases GET Error (Full Error Object):', error);
    const errorMessage = error.message || 'An unknown error occurred on the server.';
    return NextResponse.json({ message: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      image_url,
      base_price_gh,
      description,
      data_ai_hint,
      is_active,
      is_hot_offer,
      timer_enabled,
      timer_ends_at
    } = body;

    if (!id || !name || typeof base_price_gh !== 'number') {
      return NextResponse.json({ message: 'ID, Название и Базовая цена обязательны.' }, { status: 400 });
    }

    const existingCase = await query('SELECT id FROM cases WHERE id = ?', [id]);
    if (Array.isArray(existingCase) && existingCase.length > 0) {
      return NextResponse.json({ message: 'Кейс с таким ID уже существует.' }, { status: 409 });
    }

    let dbTimerEndsAt: string | null = null;
    if (timer_enabled && timer_ends_at) {
        try {
            dbTimerEndsAt = new Date(timer_ends_at).toISOString().slice(0, 19).replace('T', ' ');
        } catch (e) {
            console.warn("Invalid date format for timer_ends_at on create:", timer_ends_at);
            // Keep it null or return error, depending on desired strictness
        }
    }


    const insertQuery = `
      INSERT INTO cases (
        id, name, image_url, base_price_gh, description, data_ai_hint, 
        is_active, is_hot_offer, timer_enabled, timer_ends_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [
      id,
      name,
      image_url || null,
      base_price_gh,
      description || null,
      data_ai_hint || null,
      is_active === undefined ? true : Boolean(is_active),
      is_hot_offer === undefined ? false : Boolean(is_hot_offer),
      timer_enabled === undefined ? false : Boolean(timer_enabled),
      dbTimerEndsAt,
    ];

    const result = await query(insertQuery, params) as OkPacket | ResultSetHeader | any[];
    
    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) { 
        affectedRows = (result as OkPacket).affectedRows; 
    }


    if (affectedRows > 0) {
      const newCaseDataResult = await query('SELECT * FROM cases WHERE id = ?', [id]);
      // Process the newCaseData to match CaseItem structure if needed, especially booleans and dates
      const newCaseItem: CaseItem = {
        ...newCaseDataResult[0],
        is_active: Boolean(newCaseDataResult[0].is_active),
        is_hot_offer: Boolean(newCaseDataResult[0].is_hot_offer),
        timer_enabled: Boolean(newCaseDataResult[0].timer_enabled),
        timer_ends_at: newCaseDataResult[0].timer_ends_at ? new Date(newCaseDataResult[0].timer_ends_at).toISOString() : null,
        prize_count: 0, // New cases have 0 prizes initially
      };
      return NextResponse.json({ message: 'Кейс успешно создан', caseItem: newCaseItem }, { status: 201 });
    } else {
      console.error('Case creation in DB failed:', result);
      return NextResponse.json({ message: 'Не удалось создать кейс в базе данных.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Admin Cases POST Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}

    
