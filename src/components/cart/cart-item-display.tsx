"use client";

import Image from 'next/image';
import type { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/cart-context';
import { X, Plus, Minus } from 'lucide-react';

interface CartItemDisplayProps {
  item: CartItem;
}

export default function CartItemDisplay({ item }: CartItemDisplayProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item.product.id, newQuantity);
  };

  return (
    <div className="flex items-center space-x-4 py-4 border-b last:border-b-0">
      <div className="relative w-20 h-20 rounded-md overflow-hidden shrink-0">
        <Image
          src={item.product.imageUrl}
          alt={item.product.name}
          layout="fill"
          objectFit="cover"
          data-ai-hint={item.product.dataAiHint || 'product image'}
        />
      </div>
      <div className="flex-grow">
        <h3 className="font-medium text-sm md:text-base">{item.product.name}</h3>
        <p className="text-primary font-semibold text-sm md:text-base">${item.product.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center space-x-2 shrink-0">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.quantity - 1)} aria-label="Decrease quantity">
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 0)}
          className="w-12 h-8 text-center px-1"
          min="0"
          aria-label="Item quantity"
        />
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.quantity + 1)} aria-label="Increase quantity">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => removeFromCart(item.product.id)} aria-label="Remove item">
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
