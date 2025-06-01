
// src/app/api/site-navigation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SiteNavigationItem } from '@/types';

// GET all VISIBLE navigation items, ordered by item_order
export async function GET(request: NextRequest) {
  try {
    const results = await query(
      'SELECT id, label, href, icon_name, item_order, is_visible FROM site_navigation_items WHERE is_visible = TRUE ORDER BY item_order ASC, id ASC'
    );
    
    const items: SiteNavigationItem[] = results.map((item: any) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        icon_name: item.icon_name,
        item_order: item.item_order,
        is_visible: Boolean(item.is_visible), // Ensure boolean
    }));
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('API Public Site Navigation GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
