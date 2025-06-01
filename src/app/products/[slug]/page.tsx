
// src/app/products/[slug]/page.tsx
// This file remains a Server Component

import { getProductBySlug, getCategoryBySlug, getAllProducts } from '@/lib/data'; 
import type { Product, Category } from '@/types';
import { notFound } from 'next/navigation';
import { AuthProviderClient } from '@/contexts/AuthContext';
import ProductClientContent from './ProductClientContent';

export async function generateStaticParams() {
  const products = await getAllProducts(); // Assuming getAllProducts fetches all products including their slugs
  return products.map(product => ({ slug: product.slug }));
}

// This is the main async Server Component
export default async function ProductDetailPageWrapper({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const allProducts = await getAllProducts();
  const relatedProducts = allProducts
    .filter(p => p.game_slug === product.game_slug && p.id !== product.id) // Use p.id for comparison
    .slice(0, 3); 

  const category = product.game_slug ? await getCategoryBySlug(product.game_slug) : undefined;

  return (
    <AuthProviderClient> {/* Ensures AuthContext is available for client components */}
      <ProductClientContent 
        product={product} 
        category={category} 
        relatedProducts={relatedProducts} 
      />
    </AuthProviderClient>
  );
}
