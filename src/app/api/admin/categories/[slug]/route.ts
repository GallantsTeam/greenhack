
// src/app/api/admin/categories/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Category } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic'; // Ensure fresh data

// GET single category by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!slug) {
    return NextResponse.json({ message: 'Category slug is required' }, { status: 400 });
  }
  try {
    const results = await query('SELECT * FROM games WHERE slug = ?', [slug]);
    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ message: 'Категория не найдена' }, { status: 404 });
    }
    const categoryData = results[0];
    const category: Category = {
      id: categoryData.id,
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
      min_price: parseFloat(categoryData.min_price) || 0,
      imageUrl: categoryData.image_url || '',
      logoUrl: categoryData.logo_url || '',
      banner_url: categoryData.banner_url || '',
      platform: categoryData.platform,
      tags: typeof categoryData.tags === 'string' ? categoryData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
      dataAiHint: categoryData.data_ai_hint,
      hero_bullet_points: typeof categoryData.hero_bullet_points === 'string' ? categoryData.hero_bullet_points.split('\n').map((bp: string) => bp.trim()).filter(Boolean) : [],
      product_count: 0 
    };
    return NextResponse.json(category);
  } catch (error: any) {
    console.error(`API Admin Category GET (slug: ${slug}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// PUT update category
export async function PUT(
  request: NextRequest,
  { params: routeParams }: { params: { slug: string } }
) {
  const currentSlug = routeParams.slug; 
  if (!currentSlug) {
    return NextResponse.json({ message: 'Category slug is required in URL' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      name,
      slug: newSlug, 
      description,
      min_price,
      image_url,
      logo_url,
      banner_url,
      platform,
      tags,
      data_ai_hint,
      hero_bullet_points, // Expecting a string from the form, potentially newline separated
    } = body;

    if (!name || !newSlug) {
      return NextResponse.json({ message: 'Название и slug обязательны.' }, { status: 400 });
    }

    const existingCategory = await query('SELECT id FROM games WHERE slug = ?', [currentSlug]);
    if (!Array.isArray(existingCategory) || existingCategory.length === 0) {
        return NextResponse.json({ message: `Категория со slug '${currentSlug}' не найдена.` }, { status: 404 });
    }
    const categoryIdToUpdate = existingCategory[0].id;

    if (newSlug !== currentSlug) {
      const conflictingCategory = await query('SELECT id FROM games WHERE slug = ? AND id != ?', [newSlug, categoryIdToUpdate]);
      if (Array.isArray(conflictingCategory) && conflictingCategory.length > 0) {
        return NextResponse.json({ message: `Категория с новым slug '${newSlug}' уже существует.` }, { status: 409 });
      }
    }
    
    const updateQuery = `
      UPDATE games SET
        name = ?, slug = ?, description = ?, min_price = ?, image_url = ?, logo_url = ?, banner_url = ?,
        platform = ?, tags = ?, data_ai_hint = ?, hero_bullet_points = ?, updated_at = NOW()
      WHERE id = ? 
    `;
    const queryParams = [
      name,
      newSlug,
      description || null,
      min_price !== undefined ? parseFloat(min_price) : 0.00,
      image_url || null,
      logo_url || null,
      banner_url || null,
      platform || null,
      tags || null,
      data_ai_hint || null,
      hero_bullet_points || null, // Store as string (form sends it as string)
      categoryIdToUpdate
    ];

    const result = await query(updateQuery, queryParams) as OkPacket | ResultSetHeader | any[];

    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) { 
        affectedRows = (result as OkPacket).affectedRows; 
    }

    if (affectedRows > 0) {
      const updatedCategoryResult = await query('SELECT * FROM games WHERE id = ?', [categoryIdToUpdate]);
      const categoryToReturn: Category = {
        ...updatedCategoryResult[0],
        hero_bullet_points: typeof updatedCategoryResult[0].hero_bullet_points === 'string' ? updatedCategoryResult[0].hero_bullet_points.split('\n').map((bp: string) => bp.trim()).filter(Boolean) : [],
      };
      return NextResponse.json({ message: 'Категория успешно обновлена', category: categoryToReturn }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Категория не найдена или данные не были изменены.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Category PUT (slug: ${currentSlug}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// DELETE category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!slug) {
    return NextResponse.json({ message: 'Category slug is required' }, { status: 400 });
  }

  try {
    const productsInCategory = await query('SELECT COUNT(*) as count FROM products WHERE game_slug = ?', [slug]);
    if (productsInCategory[0].count > 0) {
      return NextResponse.json({ message: `Нельзя удалить категорию "${slug}", так как в ней есть товары. Сначала удалите или переместите товары.` }, { status: 409 });
    }

    const result = await query('DELETE FROM games WHERE slug = ?', [slug]) as OkPacket | ResultSetHeader | any[];
    
    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) {
        affectedRows = (result as OkPacket).affectedRows;
    }

    if (affectedRows > 0) {
      return NextResponse.json({ message: `Категория "${slug}" успешно удалена.` }, { status: 200 });
    } else {
      return NextResponse.json({ message: `Категория "${slug}" не найдена.` }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin Category DELETE (slug: ${slug}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

