"use client";

import { useCart } from '@/context/cart-context';
import CartItemDisplay from '@/components/cart/cart-item-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function CartPage() {
  const { cartItems, getCartTotal, getCartItemCount, clearCart } = useCart();
  const { toast } = useToast();
  const total = getCartTotal();
  const itemCount = getCartItemCount();

  const handleCheckout = () => {
    // Placeholder for checkout logic
    toast({
      title: "Checkout Initiated",
      description: "This is a demo. No real transaction will occur.",
    });
    // Potentially clear cart after successful "checkout"
    // clearCart();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-headline text-primary mb-8 text-center">Your Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-2xl font-semibold text-muted-foreground">Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Add some products to get started!</p>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/#products">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Items ({itemCount})</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {cartItems.map((item) => (
                  <CartItemDisplay key={item.product.id} item={item} />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle className="text-2xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                <Button 
                  onClick={handleCheckout} 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Proceed to Checkout
                </Button>
                <Button 
                  onClick={clearCart} 
                  variant="outline" 
                  className="w-full text-destructive hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
