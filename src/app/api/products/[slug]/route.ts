
// src/app/api/products/[slug]/route.ts
// This file remains a Server Component

import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/data'; 

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;

  if (!slug) {
    return NextResponse.json({ message: 'Product slug is required' }, { status: 400 });
  }

  try {
    const product = await getProductBySlug(slug); 
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    // Ensure pricing_options is always an array, even if empty
    const productWithGuaranteedPricingOptions = {
      ...product,
      pricing_options: (product.pricing_options || []).map(opt => ({
        ...opt,
        is_rub_payment_visible: opt.is_rub_payment_visible === undefined ? true : opt.is_rub_payment_visible,
        is_gh_payment_visible: opt.is_gh_payment_visible === undefined ? true : opt.is_gh_payment_visible,
        custom_payment_1_is_visible: opt.custom_payment_1_is_visible === undefined ? false : opt.custom_payment_1_is_visible,
        custom_payment_2_is_visible: opt.custom_payment_2_is_visible === undefined ? false : opt.custom_payment_2_is_visible,
      }))
    };
    return NextResponse.json(productWithGuaranteedPricingOptions);
  } catch (error: any) {
    console.error(`API Error fetching product ${slug}:`, error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// Ensure there's a newline at the very end of the file content.

    
