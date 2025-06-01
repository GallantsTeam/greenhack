
// src/app/api/admin/site-navigation/[itemId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SiteNavigationItem } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

// GET single navigation item
export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const id = parseInt(params.itemId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid item ID' }, { status: 400 });
  }
  try {
    // TODO: Add admin authentication check
    const results = await query('SELECT * FROM site_navigation_items WHERE id = ?', [id]);
    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ message: 'Пункт меню не найден' }, { status: 404 });
    }
    const item: SiteNavigationItem = {
        ...results[0],
        is_visible: Boolean(results[0].is_visible),
    };
    return NextResponse.json(item);
  } catch (error: any) {
    console.error(`API Admin Site Navigation GET (ID: ${id}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}


// PUT update navigation item
export async function PUT(
  request: NextRequest,
  { params: routeParams }: { params: { itemId: string } }
) {
  const id = parseInt(routeParams.itemId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid item ID' }, { status: 400 });
  }

  try {
    // TODO: Add admin authentication check
    const body = await request.json();
    const { label, href, icon_name, item_order, is_visible } = body;

    if (!label || !href) {
      return NextResponse.json({ message: 'Label and Href are required.' }, { status: 400 });
    }

    const updateQuery = `
      UPDATE site_navigation_items SET
        label = ?, href = ?, icon_name = ?, item_order = ?, is_visible = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const queryParams = [
      label,
      href,
      icon_name || null,
      item_order !== undefined ? parseInt(item_order, 10) : 0,
      is_visible === undefined ? true : Boolean(is_visible),
      id,
    ];

    const result = await query(updateQuery, queryParams) as OkPacket | ResultSetHeader | any[];

    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) { 
        affectedRows = (result as OkPacket).affectedRows; 
    }

    if (affectedRows > 0) {
      const updatedItemResult = await query('SELECT * FROM site_navigation_items WHERE id = ?', [id]);
       const updatedItem: SiteNavigationItem = {
        ...updatedItemResult[0],
        is_visible: Boolean(updatedItemResult[0].is_visible)
      };
      return NextResponse.json({ message: 'Пункт меню успешно обновлен', item: updatedItem }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Пункт меню не найден или данные не были изменены.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Site Navigation PUT (ID: ${id}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// DELETE navigation item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const id = parseInt(params.itemId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid item ID' }, { status: 400 });
  }

  try {
    // TODO: Add admin authentication check
    const result = await query('DELETE FROM site_navigation_items WHERE id = ?', [id]) as OkPacket | ResultSetHeader | any[];
    
    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) {
        affectedRows = (result as OkPacket).affectedRows;
    }

    if (affectedRows > 0) {
      return NextResponse.json({ message: 'Пункт меню успешно удален' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Пункт меню не найден или уже был удален.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Site Navigation DELETE (ID: ${id}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    
