
// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/data'; // This function will now derive categories from products

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('API Error fetching categories (derived):', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

