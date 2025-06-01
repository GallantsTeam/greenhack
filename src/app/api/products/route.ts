
// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/data';

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('API Error fetching products:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}


    