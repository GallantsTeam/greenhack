
// src/components/CategoryScroller.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';

interface CategoryScrollerProps {
  categories: Category[];
  currentSlug?: string;
  className?: string;
}

const CategoryScroller: React.FC<CategoryScrollerProps> = ({ categories, currentSlug, className }) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className={cn("py-3 md:py-4 bg-card/50 border-y border-border/20", className)}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="container mx-auto px-4">
          <div className="flex space-x-3 md:space-x-4">
            {categories.map((category) => (
              <Button
                key={category.slug}
                asChild
                variant="ghost"
                size="lg" // Made button larger to accommodate larger image and text
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2 h-auto rounded-lg transition-all duration-200 ease-in-out group", // Increased gap and padding
                  "hover:bg-primary/10 hover:text-primary hover:shadow-md",
                  currentSlug === category.slug
                    ? "bg-primary/15 text-primary font-semibold border border-primary/50 shadow-sm"
                    : "text-muted-foreground border border-transparent"
                )}
              >
                <Link href={`/games/${category.slug}`}>
                  {category.logoUrl && (
                    <div className="relative w-7 h-7 md:w-8 md:h-8 shrink-0"> {/* Increased logo size */}
                      <Image
                        src={category.logoUrl}
                        alt={`${category.name} logo`}
                        layout="fill"
                        objectFit="contain" // 'contain' is usually better for logos
                        className={cn(
                            "transition-transform duration-300 ease-out",
                            currentSlug === category.slug ? "filter-none" : "filter brightness-75 group-hover:filter-none group-hover:brightness-100" 
                            // Removed direct invert for better color handling if original logo is light
                        )}
                      />
                    </div>
                  )}
                  <span className="text-sm md:text-base font-medium">{category.name}</span> {/* Font size adjusted */}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" className="h-2 mt-2" />
      </ScrollArea>
    </div>
  );
};

export default CategoryScroller;


    