"use client";

import { useState, useMemo, useEffect } from 'react';
import ProductList from '@/components/product/product-list';
import ProductFilters from '@/components/product/product-filters';
import AiProductSuggestions from '@/components/ai/ai-product-suggestions';
import { mockProducts, categories as allCategories } from '@/data/products';
import type { Product } from '@/types';
import { ShoppingCartDisplay } from '@/components/cart/shopping-cart-display'; // For the cart sheet
import { useCart } from '@/context/cart-context'; // For cart sheet control

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const [activeFilters, setActiveFilters] = useState<{ category: string; priceRange: [number, number] }>({
    category: 'all',
    priceRange: [0, 1000], // Initial broad range
  });
  const [viewedProductNames, setViewedProductNames] = useState<string[]>([]);
  const { isCartOpen, setIsCartOpen } = useCart();

  const priceRange = useMemo(() => {
    if (mockProducts.length === 0) return [0, 1000];
    const prices = mockProducts.map(p => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, []);

  useEffect(() => {
    setActiveFilters(prev => ({ ...prev, priceRange: priceRange }));
  }, [priceRange]);

  useEffect(() => {
    let tempProducts = [...products];

    if (activeFilters.category !== 'all') {
      tempProducts = tempProducts.filter(p => p.category === activeFilters.category);
    }

    tempProducts = tempProducts.filter(
      p => p.price >= activeFilters.priceRange[0] && p.price <= activeFilters.priceRange[1]
    );

    setFilteredProducts(tempProducts);
  }, [activeFilters, products]);

  const handleFilterChange = (filters: { category: string; priceRange: [number, number] }) => {
    setActiveFilters(filters);
  };

  const handleViewProduct = (productName: string) => {
    setViewedProductNames(prev => {
      const updatedHistory = [productName, ...prev.filter(name => name !== productName)];
      return updatedHistory.slice(0, 5); // Keep last 5 viewed items for suggestions
    });
  };

  return (
    <div className="space-y-12">
      <section aria-labelledby="welcome-heading">
        <div className="text-center py-8 bg-card rounded-lg shadow-md">
          <h1 id="welcome-heading" className="text-4xl md:text-5xl font-headline text-primary mb-2">Welcome to ShopWave!</h1>
          <p className="text-lg text-muted-foreground">Your one-stop shop for amazing products.</p>
        </div>
      </section>
      
      <section id="products" aria-labelledby="products-heading">
        <ProductFilters 
          categories={allCategories} 
          onFilterChange={handleFilterChange}
          minPrice={priceRange[0]}
          maxPrice={priceRange[1]}
        />
        <h2 id="products-heading" className="text-3xl font-headline text-foreground mb-6 sr-only">Product Catalog</h2>
        <ProductList products={filteredProducts} onViewProduct={handleViewProduct} />
      </section>

      <section aria-labelledby="ai-suggestions-heading">
         <h2 id="ai-suggestions-heading" className="text-3xl font-headline text-foreground mb-6 sr-only">AI Product Suggestions</h2>
        <AiProductSuggestions browsingHistory={viewedProductNames} />
      </section>

      <ShoppingCartDisplay isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
    </div>
  );
}
