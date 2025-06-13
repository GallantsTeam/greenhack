
// src/app/api/how-to-run-guides/[productSlug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { HowToRunGuide } from '@/types';

export const dynamic = 'force-dynamic';

// GET public how-to-run guide by product_slug
export async function GET(
  request: NextRequest,
  { params }: { params: { productSlug: string } }
) {
  const productSlug = params.productSlug;
  if (!productSlug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }

  try {
    const results = await query(
      `SELECT 
         htrg.title, 
         htrg.content,
         p.name as product_name 
       FROM how_to_run_guides htrg
       JOIN products p ON htrg.product_slug = p.slug 
       WHERE htrg.product_slug = ?`, 
      [productSlug]
    );

    if (results.length === 0) {
      return NextResponse.json({ message: 'Инструкция для этого товара не найдена.' }, { status: 404 });
    }
    
    const guide: Pick<HowToRunGuide, 'title' | 'content' | 'product_name'> = {
      title: results[0].title,
      content: results[0].content,
      product_name: results[0].product_name,
    };

    return NextResponse.json(guide);
  } catch (error: any) {
    console.error(`API Public HowToRunGuide GET (Slug: ${productSlug}) Error:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
    
