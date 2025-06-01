"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

interface ProductFiltersProps {
  categories: string[];
  onFilterChange: (filters: { category: string; priceRange: [number, number] }) => void;
  minPrice: number;
  maxPrice: number;
}

export default function ProductFilters({ categories, onFilterChange, minPrice, maxPrice }: ProductFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  const [tempMinPrice, setTempMinPrice] = useState<string>(minPrice.toString());
  const [tempMaxPrice, setTempMaxPrice] = useState<string>(maxPrice.toString());

  useEffect(() => {
    setCurrentPriceRange([minPrice, maxPrice]);
    setTempMinPrice(minPrice.toString());
    setTempMaxPrice(maxPrice.toString());
  }, [minPrice, maxPrice]);
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onFilterChange({ category, priceRange: currentPriceRange });
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    setCurrentPriceRange(value);
    setTempMinPrice(value[0].toString());
    setTempMaxPrice(value[1].toString());
    onFilterChange({ category: selectedCategory, priceRange: value });
  };

  const handleMinPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempMinPrice(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue <= currentPriceRange[1] && numValue >= minPrice) {
      handlePriceRangeChange([numValue, currentPriceRange[1]]);
    }
  };

  const handleMaxPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempMaxPrice(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= currentPriceRange[0] && numValue <= maxPrice) {
      handlePriceRangeChange([currentPriceRange[0], numValue]);
    }
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setCurrentPriceRange([minPrice, maxPrice]);
    setTempMinPrice(minPrice.toString());
    setTempMaxPrice(maxPrice.toString());
    onFilterChange({ category: 'all', priceRange: [minPrice, maxPrice] });
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Filter className="mr-2 h-6 w-6 text-primary" />
          Filter Products
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="category-select" className="text-base font-medium mb-2 block">Category</Label>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger id="category-select" className="w-full md:w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base font-medium mb-2 block">Price Range</Label>
          <Slider
            value={currentPriceRange}
            onValueChange={handlePriceRangeChange}
            min={minPrice}
            max={maxPrice}
            step={1}
            className="my-4"
            aria-label="Price range slider"
          />
          <div className="flex justify-between items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="min-price" className="text-sm">Min Price</Label>
              <Input 
                id="min-price"
                type="number" 
                value={tempMinPrice} 
                onChange={handleMinPriceInputChange}
                min={minPrice}
                max={currentPriceRange[1]}
                className="mt-1"
              />
            </div>
            <span className="text-muted-foreground pt-5">-</span>
            <div className="flex-1">
              <Label htmlFor="max-price" className="text-sm">Max Price</Label>
              <Input 
                id="max-price"
                type="number" 
                value={tempMaxPrice} 
                onChange={handleMaxPriceInputChange}
                min={currentPriceRange[0]}
                max={maxPrice}
                className="mt-1"
              />
            </div>
          </div>
           <p className="text-center mt-2 text-sm text-muted-foreground">
            Selected range: ${currentPriceRange[0]} - ${currentPriceRange[1]}
          </p>
        </div>
        
        <Button onClick={resetFilters} variant="outline" className="w-full md:w-auto">
          <X className="mr-2 h-4 w-4" /> Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
}
