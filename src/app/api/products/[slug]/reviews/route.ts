
// src/app/api/products/[slug]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Review } from '@/types';
import type { OkPacket } from 'mysql2';

// GET approved reviews for a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const productSlug = params.slug;

  if (!productSlug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }

  try {
    // Fetch product ID from slug first
    const productResults = await query('SELECT id FROM products WHERE slug = ?', [productSlug]);
    if (productResults.length === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    const productId = productResults[0].id;

    const results = await query(
      `SELECT 
         r.id, r.user_id, r.product_id, r.rating, r.text, r.status, r.created_at, r.updated_at, r.approved_at,
         r.product_pricing_option_id,
         u.username, u.avatar_url as user_avatar_url,
         p.name as product_name, p.slug as product_slug, p.image_url as product_image_url,
         ppo.duration_days
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       LEFT JOIN product_pricing_options ppo ON r.product_pricing_option_id = ppo.id
       WHERE r.product_id = ? AND r.status = 'approved'
       ORDER BY r.approved_at DESC, r.created_at DESC`,
      [productId]
    );
    
    const reviews: Review[] = results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      user_avatar_url: row.user_avatar_url || `https://placehold.co/40x40.png?text=${row.username ? row.username[0].toUpperCase() : 'U'}`,
      product_id: row.product_id,
      product_name: row.product_name,
      product_slug: row.product_slug,
      product_image_url: row.product_image_url,
      product_pricing_option_id: row.product_pricing_option_id,
      duration_days: row.duration_days ? parseInt(row.duration_days, 10) : null,
      rating: row.rating,
      text: row.text,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      approved_at: row.approved_at,
    }));

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error(`API Product Reviews GET Error (Slug: ${productSlug}):`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// POST a new review for a specific product
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const productSlug = params.slug;

  if (!productSlug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }
  
  try {
    const body = await request.json();
    const { userId, rating, text, productPricingOptionId } = body;

    if (!userId || !rating || !text) {
      return NextResponse.json({ message: 'User ID, Rating, and Text are required.' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
        return NextResponse.json({ message: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    // Fetch product ID from slug first
    const productResults = await query('SELECT id FROM products WHERE slug = ?', [productSlug]);
    if (productResults.length === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    const productId = productResults[0].id;

    // TODO: Add check if user has purchased this product or specific pricing option to allow review
    // For now, allow any logged-in user to review any product

    const insertQuery = `
      INSERT INTO reviews (user_id, product_id, product_pricing_option_id, rating, text, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())
    `;
    const queryParams = [userId, productId, productPricingOptionId || null, rating, text];

    const result = await query(insertQuery, queryParams) as OkPacket;

    if (result.affectedRows > 0) {
      return NextResponse.json({ message: 'Отзыв успешно отправлен на модерацию.' }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Не удалось сохранить отзыв.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`API Product Reviews POST Error (Slug: ${productSlug}):`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
