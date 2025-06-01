
// src/app/api/admin/faq-sidebar-items/[itemId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { FaqSidebarNavItem } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

// GET single FAQ sidebar item (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  // TODO: Admin auth check
  const id = parseInt(params.itemId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid item ID' }, { status: 400 });
  }

  try {
    const results = await query('SELECT * FROM faq_sidebar_nav_items WHERE id = ?', [id]);
    if (!Array.isArray(results) || results.length === 0) {
        return NextResponse.json({ message: 'FAQ Sidebar Item not found' }, { status: 404 });
    }
    const item: FaqSidebarNavItem = {
        ...results[0],
        is_active: Boolean(results[0].is_active),
    };
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('API Admin FAQ Sidebar GET (single) Error:', error);
    return NextResponse.json({ message: `Failed to fetch FAQ sidebar item: ${error.message}` }, { status: 500 });
  }
}

// PUT update FAQ sidebar item (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  // TODO: Admin auth check
  const id = parseInt(params.itemId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid item ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { 
      title, href, image_url, image_alt_text, data_ai_hint, 
      item_order, is_active 
    } = body as Partial<Omit<FaqSidebarNavItem, 'id' | 'created_at' | 'updated_at'>>;

    if (!title || !href || !image_url) {
      return NextResponse.json({ message: 'Title, Href, and Image URL are required' }, { status: 400 });
    }
    
    const updateQuery = `
      UPDATE faq_sidebar_nav_items SET 
        title = ?, href = ?, image_url = ?, image_alt_text = ?, data_ai_hint = ?,
        item_order = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const queryParams = [
        title, href, image_url, image_alt_text || null, data_ai_hint || null,
        Number(item_order), Boolean(is_active), id
    ];
    
    const result = await query(updateQuery, queryParams) as OkPacket;

    if (result.affectedRows > 0) {
      const updatedItem = await query('SELECT * FROM faq_sidebar_nav_items WHERE id = ?', [id]);
      const itemToReturn: FaqSidebarNavItem = {
        ...updatedItem[0],
        is_active: Boolean(updatedItem[0].is_active),
      };
      return NextResponse.json({ message: 'FAQ sidebar item updated successfully', item: itemToReturn });
    } else {
      const currentItem = await query('SELECT * FROM faq_sidebar_nav_items WHERE id = ?', [id]);
      if (currentItem.length === 0) {
        return NextResponse.json({ message: 'FAQ sidebar item not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'No changes made to the FAQ sidebar item.', item: currentItem[0] });
    }
  } catch (error: any) {
    console.error('API Admin FAQ Sidebar PUT Error:', error);
    return NextResponse.json({ message: `Failed to update FAQ sidebar item: ${error.message}` }, { status: 500 });
  }
}

// DELETE FAQ sidebar item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  // TODO: Admin auth check
  const id = parseInt(params.itemId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid item ID' }, { status: 400 });
  }

  try {
    const result = await query('DELETE FROM faq_sidebar_nav_items WHERE id = ?', [id]) as OkPacket;
    if (result.affectedRows > 0) {
      return NextResponse.json({ message: 'FAQ sidebar item deleted successfully' });
    } else {
      return NextResponse.json({ message: 'FAQ sidebar item not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('API Admin FAQ Sidebar DELETE Error:', error);
    return NextResponse.json({ message: `Failed to delete FAQ sidebar item: ${error.message}` }, { status: 500 });
  }
}
