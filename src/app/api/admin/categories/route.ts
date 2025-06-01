
// src/app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Category } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic'; // Ensure fresh data for admin list

export async function GET(request: NextRequest) {
  try {
    const results = await query(
      `SELECT
         g.id as id, 
         g.slug as slug,
         g.name as name, 
         g.description as description,
         g.min_price as min_price,
         g.image_url as imageUrl, 
         g.logo_url as logoUrl, 
         g.banner_url as banner_url,
         g.platform as platform,
         g.tags as tags,
         g.data_ai_hint as dataAiHint,
         g.hero_bullet_points as hero_bullet_points,
         (SELECT COUNT(*) FROM products p WHERE p.game_slug = g.slug) as product_count 
       FROM games g
       ORDER BY g.name ASC`
    );
    
    const categories: Category[] = results.map((row: any) => ({
      id: row.id, 
      name: row.name,
      slug: row.slug,
      description: row.description,
      min_price: parseFloat(row.min_price) || 0,
      imageUrl: (row.imageUrl || `https://placehold.co/800x400.png?text=${encodeURIComponent(row.name)}`).trim(),
      logoUrl: (row.logoUrl || `https://placehold.co/150x150.png?text=${encodeURIComponent(row.name.substring(0,3))}`).trim(),
      banner_url: row.banner_url ? row.banner_url.trim() : null,
      platform: row.platform,
      tags: typeof row.tags === 'string' ? row.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
      dataAiHint: `${row.dataAiHint || row.name.toLowerCase()} game icon`,
      hero_bullet_points: typeof row.hero_bullet_points === 'string' ? row.hero_bullet_points.split('\n').map((bp: string) => bp.trim()).filter(Boolean) : [],
      product_count: parseInt(row.product_count) || 0,
    }));
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('API Error fetching categories:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      min_price,
      image_url,
      logo_url,
      banner_url,
      platform,
      tags,
      data_ai_hint,
      hero_bullet_points, // string with newlines from form
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ message: 'Название и slug обязательны.' }, { status: 400 });
    }

    const existingBySlug = await query('SELECT id FROM games WHERE slug = ?', [slug]);
    if (Array.isArray(existingBySlug) && existingBySlug.length > 0) {
      return NextResponse.json({ message: 'Категория с таким slug уже существует.' }, { status: 409 });
    }
    const existingByName = await query('SELECT id FROM games WHERE name = ?', [name]);
    if (Array.isArray(existingByName) && existingByName.length > 0) {
      return NextResponse.json({ message: 'Категория с таким названием уже существует.' }, { status: 409 });
    }

    const insertQuery = `
      INSERT INTO games (
        name, slug, description, min_price, image_url, logo_url, banner_url, platform, tags, data_ai_hint, hero_bullet_points, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
      name,
      slug,
      description || null,
      min_price !== undefined ? parseFloat(min_price) : 0.00,
      image_url || null,
      logo_url || null,
      banner_url || null,
      platform || null,
      tags || null,
      data_ai_hint || null,
      hero_bullet_points || null, // Store as string
    ];

    const result = await query(insertQuery, params) as OkPacket | ResultSetHeader | any[];

    let insertId;
    if (Array.isArray(result) && result.length > 0 && 'insertId' in result[0]) {
        insertId = result[0].insertId;
    } else if (result && 'insertId' in result) { 
        insertId = (result as OkPacket).insertId; 
    }

    if (insertId) {
      const newCategoryData = await query('SELECT * FROM games WHERE id = ?', [insertId]);
      const categoryToReturn: Category = {
        ...newCategoryData[0],
        hero_bullet_points: typeof newCategoryData[0].hero_bullet_points === 'string' ? newCategoryData[0].hero_bullet_points.split('\n').map((bp: string) => bp.trim()).filter(Boolean) : [],
      };
      return NextResponse.json({ message: 'Категория успешно создана', category: categoryToReturn }, { status: 201 });
    } else {
      console.error('Category creation in DB failed, no insertId:', result);
      return NextResponse.json({ message: 'Не удалось создать категорию в базе данных.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Admin Categories POST Error:', error);
    return NextResponse.json({ message: `Внутренняя ошибка сервера: ${error.message}` }, { status: 500 });
  }
}

