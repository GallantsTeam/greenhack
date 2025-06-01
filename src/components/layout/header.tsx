"use client";

import Link from 'next/link';
import { ShoppingCart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

export default function Header() {
  const { getCartItemCount, setIsCartOpen } = useCart();
  const cartItemCount = getCartItemCount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/#products', label: 'Products' },
    { href: '/cart', label: 'Cart Page' },
  ];

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-3xl font-headline text-primary">
          ShopWave
        </Link>
        <nav className="hidden md:flex space-x-6 items-center">
          {navLinks.map(link => (
             <Link key={link.href} href={link.href} className="text-foreground hover:text-primary transition-colors font-medium">
                {link.label}
             </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" aria-label="Open Cart" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart className="h-6 w-6 text-primary" />
            {cartItemCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {cartItemCount}
              </Badge>
            )}
          </Button>
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col space-y-4 mt-8">
                {navLinks.map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-foreground hover:text-primary transition-colors">
                      {link.label}
                  </Link>
                ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
