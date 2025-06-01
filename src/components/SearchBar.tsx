
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      // Keep it open after search, or setIsOpen(false); 
    }
  };

  const toggleSearchVisibility = () => {
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen && searchTerm.trim() === '') { // Only close if empty
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchTerm]);

  return (
    <div ref={containerRef} className="flex items-center relative">
      <form onSubmit={handleSearchSubmit} className={cn("flex items-center transition-all duration-300 ease-in-out", isOpen ? "w-48 md:w-56" : "w-0")}>
        {isOpen && (
          <Input
            ref={inputRef}
            type="search"
            placeholder="Поиск игр..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 text-sm bg-card border-border focus:border-primary w-full"
          />
        )}
      </form>
      <Button
        variant="ghost"
        size="icon"
        className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full p-2 ml-1"
        onClick={() => {
            if (isOpen && searchTerm.trim()) {
                handleSearchSubmit();
            } else {
                toggleSearchVisibility();
            }
        }}
        aria-label={isOpen && searchTerm.trim() ? "Submit search" : "Toggle search"}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">{isOpen && searchTerm.trim() ? "Submit search" : "Toggle search"}</span>
      </Button>
    </div>
  );
};

export default SearchBar;
