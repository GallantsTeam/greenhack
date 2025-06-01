
// src/app/api/user/[userId]/has-purchased/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; productId: string } }
) {
  const userId = params.userId;
  const productId = params.productId; // This is actually the product slug

  if (!userId || isNaN(parseInt(userId))) {
    return NextResponse.json({ message: 'Valid User ID is required' }, { status: 400 });
  }
  if (!productId) {
    return NextResponse.json({ message: 'Product ID (slug) is required' }, { status: 400 });
  }

  try {
    // Ensure the product_id in purchases table matches the type of products.id (which is slug/VARCHAR)
    const purchases = await query(
      'SELECT COUNT(*) as purchase_count FROM purchases WHERE user_id = ? AND product_id = ? AND status = ?',
      [parseInt(userId), productId, 'completed']
    );

    const hasPurchased = purchases[0].purchase_count > 0;

    return NextResponse.json({ hasPurchased });
  } catch (error: any) {
    console.error(`API Error checking purchase for user ${userId}, product ${productId}:`, error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message, hasPurchased: false }, { status: 500 });
  }
}
