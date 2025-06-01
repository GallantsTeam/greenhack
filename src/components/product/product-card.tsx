"use client";

import Image from 'next/image';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewProduct?: (productName: string) => void;
}

export default function ProductCard({ product, onViewProduct }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleViewProduct = () => {
    if (onViewProduct) {
      onViewProduct(product.name);
    }
    // In a real app, you might navigate to a product detail page here
    // For now, just log it or add to a simple "viewed" list
    console.log(`Viewed: ${product.name}`);
  };

  return (
    <Card className="flex flex-col overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <CardHeader className="p-0">
        <div className="aspect-square relative cursor-pointer" onClick={handleViewProduct}>
          <Image
            src={product.imageUrl}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={product.dataAiHint || 'product image'}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle 
          className="text-lg font-headline mb-1 cursor-pointer hover:text-primary"
          onClick={handleViewProduct}
        >
          {product.name}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 line-clamp-3">{product.description}</CardDescription>
        <p className="text-xl font-semibold text-primary">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={() => addToCart(product)} 
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
