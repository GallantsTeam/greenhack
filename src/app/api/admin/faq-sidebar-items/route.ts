
// src/app/api/admin/faq-sidebar-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { FaqSidebarNavItem } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

// GET all FAQ sidebar items (admin or public, depending on auth logic)
export async function GET(request: NextRequest) {
  // TODO: Add admin authentication check if this is admin-only
  try {
    const results = await query('SELECT * FROM faq_sidebar_nav_items ORDER BY item_order ASC, id ASC');
    const items: FaqSidebarNavItem[] = results.map((item: any) => ({
      ...item,
      is_active: Boolean(item.is_active),
      content: item.content || null, // Ensure content is included
    }));
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('API Admin FAQ Sidebar GET Error:', error);
    return NextResponse.json({ message: `Failed to fetch FAQ sidebar items: ${error.message}` }, { status: 500 });
  }
}

// POST new FAQ sidebar item (admin only)
export async function POST(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const body = await request.json();
    const {
      title, href, image_url, image_alt_text, data_ai_hint,
      content, // Added content
      item_order = 0, is_active = true
    } = body as Partial<Omit<FaqSidebarNavItem, 'id' | 'created_at' | 'updated_at'>>;

    if (!title || !href || !image_url) {
      return NextResponse.json({ message: 'Title, Href, and Image URL are required' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO faq_sidebar_nav_items (title, href, image_url, image_alt_text, data_ai_hint, content, item_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, href, image_url, image_alt_text || null, data_ai_hint || null, content || null, item_order, is_active]
    ) as OkPacket;

    if (result.insertId) {
      const newItem: FaqSidebarNavItem = {
        id: result.insertId,
        title, href, image_url, image_alt_text: image_alt_text || null, data_ai_hint: data_ai_hint || null,
        content: content || null,
        item_order, is_active,
        created_at: new Date().toISOString(), // Approximate
      };
      return NextResponse.json({ message: 'FAQ sidebar item created successfully', item: newItem }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Failed to create FAQ sidebar item' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API Admin FAQ Sidebar POST Error:', error);
    return NextResponse.json({ message: `Failed to create FAQ sidebar item: ${error.message}` }, { status: 500 });
  }
}

