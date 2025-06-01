
// src/components/FaqSidebarNav.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NavItem {
  title: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
  dataAiHint: string;
}

const navigationItems: NavItem[] = [
  {
    title: 'КАК ЭКОНОМИТЬ 15% НА КАЖДОЙ ПОКУПКЕ?',
    href: '#', // Placeholder, replace with actual link or FAQ section ID
    imageUrl: 'https://placehold.co/300x100.png?text=Economy',
    imageAlt: 'Экономия на покупках',
    dataAiHint: 'discount savings'
  },
  {
    title: 'ПОДГОТОВКА ПК К ЗАПУСКУ ЧИТА',
    href: '#',
    imageUrl: 'https://placehold.co/300x100.png?text=PC+Setup',
    imageAlt: 'Подготовка ПК',
    dataAiHint: 'computer setup guide'
  },
  {
    title: 'ЧТО ДЕЛАТЬ ПОСЛЕ ОПЛАТЫ',
    href: '#',
    imageUrl: 'https://placehold.co/300x100.png?text=After+Payment',
    imageAlt: 'После оплаты',
    dataAiHint: 'payment confirmation'
  },
  {
    title: 'ГАРАНТИИ',
    href: '#',
    imageUrl: 'https://placehold.co/300x100.png?text=Guarantees',
    imageAlt: 'Гарантии',
    dataAiHint: 'security guarantee'
  },
];

const FaqSidebarNav: React.FC = () => {
  return (
    <Card className="shadow-lg bg-card border-border/50">
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-semibold text-primary text-center uppercase tracking-wider">
          Простая Навигация
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {navigationItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="block rounded-lg overflow-hidden shadow-md hover:shadow-primary/30 transition-shadow transform hover:scale-[1.02]"
          >
            <div className="relative w-full aspect-[3/1]">
              <Image
                src={item.imageUrl}
                alt={item.imageAlt}
                layout="fill"
                objectFit="cover"
                data-ai-hint={item.dataAiHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2.5">
                <h4 className="text-white text-xs font-semibold uppercase tracking-wide leading-tight">
                  {item.title}
                </h4>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default FaqSidebarNav;

