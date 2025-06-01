"use client";

import { useCart } from '@/context/cart-context';
import CartItemDisplay from './cart-item-display';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ShoppingCartDisplayProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ShoppingCartDisplay({ isOpen, onOpenChange }: ShoppingCartDisplayProps) {
  const { cartItems, getCartTotal, getCartItemCount, clearCart } = useCart();
  const total = getCartTotal();
  const itemCount = getCartItemCount();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-2xl font-headline flex items-center">
            <ShoppingCart className="mr-3 h-7 w-7 text-primary" />
            Your Shopping Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>
        <Separator />
        {cartItems.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-medium text-muted-foreground">Your cart is empty.</p>
            <p className="text-sm text-muted-foreground mt-1">Looks like you haven't added anything yet.</p>
            <SheetClose asChild>
              <Button variant="link" className="mt-4 text-primary" asChild>
                <Link href="/#products">Start Shopping</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-grow px-6 overflow-y-auto">
              <div className="py-2">
                {cartItems.map((item) => (
                  <CartItemDisplay key={item.product.id} item={item} />
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <SheetFooter className="px-6 py-6 space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Subtotal:</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
              <Button 
                onClick={clearCart} 
                variant="outline" 
                className="w-full text-destructive hover:border-destructive hover:text-destructive"
                disabled={cartItems.length === 0}
                aria-label="Clear cart"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
              </Button>
              <SheetClose asChild>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
                  asChild
                  disabled={cartItems.length === 0}
                >
                  <Link href="/cart">Proceed to Checkout</Link>
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
