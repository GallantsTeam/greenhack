
// src/app/api/admin/site-banners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SiteBanner } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

// GET all active banners, ordered by item_order
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check if this endpoint is only for admin use
    // If it's for public site display, no auth check needed here.
    const results = await query(
      `SELECT 
         sb.*, 
         g.name as game_name 
       FROM site_banners sb
       LEFT JOIN games g ON sb.game_slug = g.slug
       WHERE sb.is_active = TRUE
       ORDER BY sb.item_order ASC, sb.id DESC`
    );
    const banners: SiteBanner[] = results.map((row: any) => ({
      ...row,
      is_active: Boolean(row.is_active),
      game_name: row.game_name, // Ensure game_name is included
    }));
    return NextResponse.json(banners);
  } catch (error: any) {
    console.error('API Admin Banners GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// POST new banner
export async function POST(request: NextRequest) {
  // TODO: Add admin authentication
  try {
    const body = await request.json();
    const {
      title, subtitle, description, image_url, image_alt_text,
      button_text, button_link, item_order, is_active,
      hero_image_object_position, hero_image_hint, price_text, game_slug,
      related_product_slug_1, related_product_slug_2, related_product_slug_3
    } = body;

    if (!title || !image_url) {
      return NextResponse.json({ message: 'Title and Image URL are required.' }, { status: 400 });
    }

    const insertQuery = `
      INSERT INTO site_banners (
        title, subtitle, description, image_url, image_alt_text,
        button_text, button_link, item_order, is_active,
        hero_image_object_position, hero_image_hint, price_text, game_slug,
        related_product_slug_1, related_product_slug_2, related_product_slug_3,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
      title, subtitle || null, description || null, image_url, image_alt_text || null,
      button_text || null, button_link || null,
      item_order !== undefined ? parseInt(item_order, 10) : 0,
      is_active === undefined ? true : Boolean(is_active),
      hero_image_object_position || 'center center', hero_image_hint || null, price_text || null, game_slug || null,
      related_product_slug_1 || null, related_product_slug_2 || null, related_product_slug_3 || null
    ];

    const result = await query(insertQuery, params) as OkPacket | ResultSetHeader | any[];
    
    let insertId;
    if (Array.isArray(result) && result.length > 0 && 'insertId' in result[0]) {
        insertId = result[0].insertId;
    } else if (result && 'insertId' in result) { 
        insertId = (result as OkPacket).insertId; 
    }

    if (insertId) {
      const newBannerResult = await query('SELECT * FROM site_banners WHERE id = ?', [insertId]);
      const newBanner: SiteBanner = {
        ...newBannerResult[0],
        is_active: Boolean(newBannerResult[0].is_active)
      };
      return NextResponse.json({ message: 'Баннер успешно создан', banner: newBanner }, { status: 201 });
    } else {
      console.error('Banner creation in DB failed:', result);
      return NextResponse.json({ message: 'Не удалось создать баннер в базе данных.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API Admin Banners POST Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    
    
