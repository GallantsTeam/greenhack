
// src/app/api/admin/site-banners/[bannerId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { SiteBanner } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

// GET single banner
export async function GET(
  request: NextRequest,
  { params }: { params: { bannerId: string } }
) {
  // TODO: Add admin authentication
  const id = parseInt(params.bannerId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid banner ID' }, { status: 400 });
  }
  try {
    const results = await query(
      `SELECT 
         sb.*, 
         g.name as game_name 
       FROM site_banners sb
       LEFT JOIN games g ON sb.game_slug = g.slug
       WHERE sb.id = ?`, [id]);
    if (results.length === 0) {
      return NextResponse.json({ message: 'Баннер не найден' }, { status: 404 });
    }
     const banner: SiteBanner = {
        ...results[0],
        is_active: Boolean(results[0].is_active),
    };
    return NextResponse.json(banner);
  } catch (error: any) {
    console.error(`API Admin Banner GET (ID: ${id}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// PUT update banner
export async function PUT(
  request: NextRequest,
  { params: routeParams }: { params: { bannerId: string } }
) {
  // TODO: Add admin authentication
  const id = parseInt(routeParams.bannerId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid banner ID' }, { status: 400 });
  }

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
    
    const updateQuery = `
      UPDATE site_banners SET
        title = ?, subtitle = ?, description = ?, image_url = ?, image_alt_text = ?,
        button_text = ?, button_link = ?, item_order = ?, is_active = ?,
        hero_image_object_position = ?, hero_image_hint = ?, price_text = ?, game_slug = ?,
        related_product_slug_1 = ?, related_product_slug_2 = ?, related_product_slug_3 = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    const queryParams = [
      title, subtitle || null, description || null, image_url, image_alt_text || null,
      button_text || null, button_link || null, 
      item_order !== undefined ? parseInt(item_order, 10) : 0,
      is_active === undefined ? true : Boolean(is_active),
      hero_image_object_position || 'center center', hero_image_hint || null, price_text || null, game_slug || null,
      related_product_slug_1 || null, related_product_slug_2 || null, related_product_slug_3 || null,
      id
    ];

    const result = await query(updateQuery, queryParams) as OkPacket | ResultSetHeader | any[];
    
    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) { 
        affectedRows = (result as OkPacket).affectedRows; 
    }

    if (affectedRows > 0) {
      const updatedBannerResult = await query('SELECT * FROM site_banners WHERE id = ?', [id]);
      const updatedBanner: SiteBanner = {
        ...updatedBannerResult[0],
        is_active: Boolean(updatedBannerResult[0].is_active)
      };
      return NextResponse.json({ message: 'Баннер успешно обновлен', banner: updatedBanner }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Баннер не найден или данные не были изменены.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Banner PUT (ID: ${id}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// DELETE banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bannerId: string } }
) {
  // TODO: Add admin authentication
  const id = parseInt(params.bannerId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid banner ID' }, { status: 400 });
  }

  try {
    const result = await query('DELETE FROM site_banners WHERE id = ?', [id]) as OkPacket | ResultSetHeader | any[];
    
    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) {
        affectedRows = (result as OkPacket).affectedRows;
    }

    if (affectedRows > 0) {
      return NextResponse.json({ message: 'Баннер успешно удален' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Баннер не найден или уже был удален.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Banner DELETE (ID: ${id}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    
    
