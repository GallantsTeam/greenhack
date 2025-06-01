
// src/app/api/admin/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { Review } from '@/types';
import type { OkPacket } from 'mysql2';

// GET all reviews for admin panel
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const results = await query(
      `SELECT 
         r.id, r.user_id, r.product_id, r.rating, r.text, r.status, r.created_at, r.updated_at, r.approved_at,
         u.username, u.avatar_url as user_avatar_url,
         p.name as product_name, p.image_url as product_image_url, p.slug as product_slug
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`
    );
    
    const reviews: Review[] = results.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      user_avatar_url: row.user_avatar_url,
      product_id: row.product_id,
      product_name: row.product_name,
      product_image_url: row.product_image_url,
      product_slug: row.product_slug,
      rating: row.rating,
      text: row.text,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      approved_at: row.approved_at,
    }));

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('API Admin Reviews GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// POST a new review (manually by admin)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json();
    const { user_id, product_id, rating, text, status = 'approved' } = body;

    if (!user_id || !product_id || !rating || !text) {
      return NextResponse.json({ message: 'User ID, Product ID, Rating, and Text are required.' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
        return NextResponse.json({ message: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    const approved_at = status === 'approved' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

    const insertQuery = `
      INSERT INTO reviews (user_id, product_id, rating, text, status, approved_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [user_id, product_id, rating, text, status, approved_at];

    const result = await query(insertQuery, params) as OkPacket;

    if (result.affectedRows > 0) {
      const newReviewResult = await query('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
      return NextResponse.json({ message: 'Отзыв успешно создан', review: newReviewResult[0] }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Не удалось создать отзыв.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API Admin Reviews POST Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
