
// src/app/api/admin/how-to-run-guides/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql';
import type { HowToRunGuide } from '@/types';

export const dynamic = 'force-dynamic';

// GET all how-to-run guides with product names
export async function GET(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const results = await query(
      `SELECT 
         htrg.product_slug, 
         htrg.title, 
         htrg.updated_at,
         p.name as product_name
       FROM how_to_run_guides htrg
       JOIN products p ON htrg.product_slug = p.slug
       ORDER BY p.name ASC, htrg.updated_at DESC`
    );
    
    const guides: Partial<HowToRunGuide>[] = results.map((row: any) => ({
      product_slug: row.product_slug,
      title: row.title,
      product_name: row.product_name,
      updated_at: row.updated_at,
    }));

    return NextResponse.json(guides);
  } catch (error: any) {
    console.error('API Admin HowToRunGuides GET Error:', error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// Note: POST for creating a new guide will be handled by the [productSlug] route with PUT (upsert logic)
// This route is primarily for listing all guides.
    
