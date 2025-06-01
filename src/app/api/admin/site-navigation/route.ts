
// src/app/api/admin/site-navigation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SiteNavigationItem } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

// GET all navigation items
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const results = await query('SELECT * FROM site_navigation_items ORDER BY item_order ASC, id ASC');
    const items: SiteNavigationItem[] = results.map((item: any) => ({
        ...item,
        is_visible: Boolean(item.is_visible),
    }));
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('API Admin Site Navigation GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// POST new navigation item
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json();
    const { label, href, icon_name, item_order, is_visible } = body;

    if (!label || !href) {
      return NextResponse.json({ message: 'Label and Href are required.' }, { status: 400 });
    }
    
    let order = 0;
    if (item_order !== undefined && !isNaN(parseInt(item_order, 10))) {
      order = parseInt(item_order, 10);
    } else {
      const maxOrderResult = await query('SELECT MAX(item_order) as max_order FROM site_navigation_items');
      if (maxOrderResult.length > 0 && maxOrderResult[0].max_order !== null) {
        order = maxOrderResult[0].max_order + 1;
      }
    }

    const insertQuery = `
      INSERT INTO site_navigation_items (label, href, icon_name, item_order, is_visible)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      label,
      href,
      icon_name || null,
      order,
      is_visible === undefined ? true : Boolean(is_visible),
    ];

    const result = await query(insertQuery, params) as OkPacket | ResultSetHeader | any[];
    
    let insertId;
    if (Array.isArray(result) && result.length > 0 && 'insertId' in result[0]) {
        insertId = result[0].insertId;
    } else if (result && 'insertId' in result) { 
        insertId = (result as OkPacket).insertId; 
    }

    if (insertId) {
      const newItemResult = await query('SELECT * FROM site_navigation_items WHERE id = ?', [insertId]);
      const newItem: SiteNavigationItem = {
        ...newItemResult[0],
        is_visible: Boolean(newItemResult[0].is_visible)
      };
      return NextResponse.json({ message: 'Пункт меню успешно создан', item: newItem }, { status: 201 });
    } else {
      console.error('Nav item creation in DB failed, no insertId:', result);
      return NextResponse.json({ message: 'Не удалось создать пункт меню в базе данных.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API Admin Site Navigation POST Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    
