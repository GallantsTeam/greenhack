
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Product } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ message: 'Search query (q) is required' }, { status: 400 });
  }

  try {
    const searchTerm = `%${q}%`;
    // Updated query to reflect the new products table structure and hypothetical games table join
    const productsData = await query(
      `SELECT 
         p.id, p.name, p.slug, p.game_slug, p.image_url, 
         p.status, p.status_text, p.price_text, p.base_price_gh,
         p.short_description, p.long_description, p.data_ai_hint,
         COALESCE(g.name, p.game_slug) as gameName 
       FROM products p 
       LEFT JOIN games g ON p.game_slug = g.slug -- Join with a hypothetical games table
       WHERE p.name LIKE ? OR p.short_description LIKE ? OR p.long_description LIKE ? OR COALESCE(g.name, p.game_slug) LIKE ?
       ORDER BY p.name ASC`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    const formattedProducts: Product[] = productsData.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      game_slug: row.game_slug,
      description: row.short_description || row.long_description, // Combine descriptions
      price: row.base_price_gh ? parseFloat(row.base_price_gh) : 0,
      image_url: row.image_url,
      imageUrl: row.image_url || `https://picsum.photos/seed/${encodeURIComponent(row.slug)}/300/350`,
      gameName: row.gameName,
      status: row.status || 'unknown',
      statusText: row.status_text || 'Статус неизвестен',
      price_text: row.price_text,
      base_price_gh: row.base_price_gh ? parseFloat(row.base_price_gh) : undefined,
      dataAiHint: row.data_ai_hint || `${row.name.toLowerCase()} product icon`,
    }));

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error('API Search Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
