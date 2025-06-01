
// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Review } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') as 'positive' | 'negative' | null;
  const productId = searchParams.get('productId'); // For product-specific reviews

  try {
    let baseQuery = `
      SELECT 
         r.id, r.user_id, r.product_id, r.rating, r.text, r.status, r.created_at, r.updated_at, r.approved_at,
         u.username, u.avatar_url as user_avatar_url,
         p.name as product_name, p.slug as product_slug, p.image_url as product_image_url,
         ppo.duration_days
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       LEFT JOIN product_pricing_options ppo ON r.product_pricing_option_id = ppo.id
       WHERE r.status = 'approved'
    `;
    const queryParams: any[] = [];

    if (productId) {
      baseQuery += ' AND r.product_id = ?';
      queryParams.push(productId);
    }

    if (filter === 'positive') {
      baseQuery += ' AND r.rating >= 4';
    } else if (filter === 'negative') {
      baseQuery += ' AND r.rating <= 3'; // Assuming 3 is also included in negative/neutral by user's definition
    }
    
    baseQuery += ' ORDER BY r.approved_at DESC, r.created_at DESC';

    const results = await query(baseQuery, queryParams);
    
    const reviews: Review[] = results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      user_avatar_url: row.user_avatar_url || `https://placehold.co/40x40.png?text=${row.username ? row.username[0].toUpperCase() : 'U'}`,
      product_id: row.product_id,
      product_name: row.product_name,
      product_slug: row.product_slug,
      product_image_url: row.product_image_url,
      rating: row.rating,
      text: row.text,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      approved_at: row.approved_at,
      product_pricing_option_id: row.product_pricing_option_id,
      duration_days: row.duration_days ? parseInt(row.duration_days, 10) : null,
    }));

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('API Public Reviews GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
