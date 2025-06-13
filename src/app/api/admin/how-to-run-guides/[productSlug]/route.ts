
// src/app/api/admin/how-to-run-guides/[productSlug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { HowToRunGuide } from '@/types';
import type { OkPacket, ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

// GET specific how-to-run guide by product_slug
export async function GET(
  request: NextRequest,
  { params }: { params: { productSlug: string } }
) {
  // TODO: Add admin authentication check
  const productSlug = params.productSlug;
  if (!productSlug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }

  try {
    const results = await query(
      `SELECT 
         htrg.product_slug, 
         htrg.title, 
         htrg.content,
         htrg.created_at,
         htrg.updated_at,
         p.name as product_name
       FROM how_to_run_guides htrg
       JOIN products p ON htrg.product_slug = p.slug
       WHERE htrg.product_slug = ?`, 
      [productSlug]
    );

    if (results.length === 0) {
      return NextResponse.json({ message: 'Инструкция для этого товара не найдена.' }, { status: 404 });
    }
    
    const guide: HowToRunGuide = {
      product_slug: results[0].product_slug,
      title: results[0].title,
      content: results[0].content,
      product_name: results[0].product_name,
      created_at: results[0].created_at,
      updated_at: results[0].updated_at,
    };

    return NextResponse.json(guide);
  } catch (error: any) {
    console.error(`API Admin HowToRunGuide GET (Slug: ${productSlug}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// PUT (Create or Update) how-to-run guide by product_slug
export async function PUT(
  request: NextRequest,
  { params }: { params: { productSlug: string } }
) {
  // TODO: Add admin authentication check
  const productSlug = params.productSlug;
  if (!productSlug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, content } = body as Partial<Omit<HowToRunGuide, 'product_slug'>>;

    if (!title || !content) {
      return NextResponse.json({ message: 'Title and Content are required.' }, { status: 400 });
    }

    // Check if product exists
    const productExists = await query('SELECT id FROM products WHERE slug = ?', [productSlug]);
    if (productExists.length === 0) {
        return NextResponse.json({ message: `Товар с slug '${productSlug}' не найден. Инструкция не может быть создана/обновлена.` }, { status: 404 });
    }

    const existingGuide = await query('SELECT product_slug FROM how_to_run_guides WHERE product_slug = ?', [productSlug]);

    let result;
    let messageAction: string;

    if (existingGuide.length > 0) {
      // Update existing guide
      result = await query(
        'UPDATE how_to_run_guides SET title = ?, content = ?, updated_at = NOW() WHERE product_slug = ?',
        [title, content, productSlug]
      ) as OkPacket | ResultSetHeader | any[];
      messageAction = 'обновлена';
    } else {
      // Insert new guide
      result = await query(
        'INSERT INTO how_to_run_guides (product_slug, title, content, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [productSlug, title, content]
      ) as OkPacket | ResultSetHeader | any[];
      messageAction = 'создана';
    }

    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) { 
        affectedRows = (result as OkPacket).affectedRows; 
    } else if (result && 'insertId' in result) { // For insert, check insertId
        affectedRows = (result as OkPacket).insertId ? 1 : 0;
    }

    if (affectedRows > 0) {
      const updatedGuideResult = await query('SELECT * FROM how_to_run_guides WHERE product_slug = ?', [productSlug]);
      return NextResponse.json({ message: `Инструкция успешно ${messageAction}.`, guide: updatedGuideResult[0] }, { status: 200 });
    } else {
      return NextResponse.json({ message: `Не удалось ${messageAction === 'обновлена' ? 'обновить' : 'создать'} инструкцию.` }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`API Admin HowToRunGuide PUT (Slug: ${productSlug}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// DELETE how-to-run guide by product_slug
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productSlug: string } }
) {
  // TODO: Add admin authentication check
  const productSlug = params.productSlug;
  if (!productSlug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }

  try {
    const result = await query('DELETE FROM how_to_run_guides WHERE product_slug = ?', [productSlug]) as OkPacket | ResultSetHeader | any[];
    
    let affectedRows = 0;
    if (Array.isArray(result) && result.length > 0 && 'affectedRows' in result[0]) {
        affectedRows = result[0].affectedRows;
    } else if (result && 'affectedRows' in result) {
        affectedRows = (result as OkPacket).affectedRows;
    }

    if (affectedRows > 0) {
      return NextResponse.json({ message: 'Инструкция успешно удалена.' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Инструкция не найдена или уже была удалена.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API Admin HowToRunGuide DELETE (Slug: ${productSlug}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    
