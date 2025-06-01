
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Star, HelpCircle, FileText, BarChart3, UserCircle, LogOut, Key, Search as SearchIcon, Home, type LucideIcon, PlusCircle, Menu as MenuIcon } from 'lucide-react';
import type { NavItem as CustomNavItemType, SiteSettings } from '@/types';
import SearchBar from '@/components/SearchBar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';
import BalanceDepositModal from '@/components/BalanceDepositModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const iconMap: { [key: string]: LucideIcon } = {
  Home,
  LayoutGrid,
  Star,
  HelpCircle,
  FileText,
  BarChart3,
};

const staticDefaultNavItems: CustomNavItemType[] = [
  { id: -1, label: 'Главная', href: '/', icon_name: 'Home', item_order: 0, is_visible: true },
  { id: -2, label: 'Каталог игр', href: '/games', icon_name: 'LayoutGrid', item_order: 1, is_visible: true },
  { id: -3, label: 'Отзывы', href: '/reviews', icon_name: 'Star', item_order: 2, is_visible: true },
  { id: -4, label: 'FAQ', href: '/faq', icon_name: 'HelpCircle', item_order: 3, is_visible: true }, // Added FAQ
  { id: -6, label: 'Статусы', href: '/statuses', icon_name: 'BarChart3', item_order: 5, is_visible: true },
];

const Logo = ({ siteName, logoUrl }: { siteName?: string | null, logoUrl?: string | null }) => {
  const effectiveSiteName = siteName || "GreenHacks";
  const siteNameParts = effectiveSiteName.split(' ');
  const siteNameFirstPart = siteNameParts[0];
  const siteNameSecondPart = siteNameParts.length > 1 ? siteNameParts.slice(1).join(' ') : '';

  return (
    <Link href="/" className="flex items-center gap-1 text-2xl font-bold">
      <span className="text-primary">{siteNameFirstPart}</span>
      <span className="text-icon-color">{siteNameSecondPart}</span>
    </Link>
  );
};


const Header = () => {
  const { currentUser, logout, loading: authLoading, fetchUserDetails } = useAuth();
  const router = useRouter();
  const [navItems, setNavItems] = useState<CustomNavItemType[]>(staticDefaultNavItems);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const fetchNavItems = useCallback(async () => {
    console.log("[Header] Attempting to fetch nav items...");
    try {
      const response = await fetch('/api/site-navigation');
      if (!response.ok) {
        let errorMsg = 'Failed to fetch nav items';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || `HTTP error ${response.status}`;
        } catch (jsonError) {
          errorMsg = `HTTP error ${response.status}: ${response.statusText}`;
        }
        console.error(`[Header] API Error: ${errorMsg}`);
        throw new Error(errorMsg); 
      }
      const data: CustomNavItemType[] = await response.json();
      console.log("[Header] Nav items fetched successfully:", data);

      if (data && data.length > 0) {
        let combinedItems: CustomNavItemType[] = [...staticDefaultNavItems];
        const apiHrefs = new Set(data.map(item => item.href));
        const defaultHrefs = new Set(staticDefaultNavItems.map(item => item.href));

        data.forEach(apiItem => {
          if (apiItem.is_visible) {
            if (!defaultHrefs.has(apiItem.href)) {
              combinedItems.push(apiItem);
            } else {
              const defaultItemIndex = combinedItems.findIndex(item => item.href === apiItem.href);
              if (defaultItemIndex !== -1) {
                combinedItems[defaultItemIndex] = { ...combinedItems[defaultItemIndex], ...apiItem };
              }
            }
          }
        });
        setNavItems(combinedItems.sort((a, b) => (a.item_order || 0) - (b.item_order || 0)));
      } else {
        console.warn("[Header] API for navigation items returned empty or invalid data. Using static defaults.");
        setNavItems(staticDefaultNavItems.sort((a, b) => (a.item_order || 0) - (b.item_order || 0)));
      }
    } catch (error: any) {
      console.error("[Header] Error in fetchNavItems catch block:", error.message);
      toast({
        title: "Ошибка загрузки навигации",
        description: "Не удалось загрузить пункты меню. Используются стандартные.",
        variant: "destructive",
        duration: 7000,
      });
      setNavItems(staticDefaultNavItems.sort((a, b) => (a.item_order || 0) - (b.item_order || 0))); // Fallback
    }
  }, [toast]);


  useEffect(() => {
    fetchNavItems();
  }, [fetchNavItems]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const formatBalance = (balance: number | undefined | null): string => {
    if (typeof balance !== 'number' || balance === null || isNaN(balance)) {
      return '0';
    }
    return Math.floor(balance).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const onBalanceUpdated = () => {
    if (currentUser?.id) {
      fetchUserDetails(currentUser.id);
    }
  };
  
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const MobileNavContent = () => (
    <nav className="flex flex-col h-full">
      <div className="flex-grow px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const IconComponent = item.icon_name ? iconMap[item.icon_name] : null;
          return (
            <Button key={item.id || item.label} asChild variant="ghost" className="w-full justify-start text-foreground/80 hover:text-primary hover:bg-primary/10" onClick={closeMobileMenu}>
              <Link href={item.href} className="flex items-center gap-2.5 text-sm">
                {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>
      {currentUser && (
        <div className="p-4 border-t border-border space-y-3">
           <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border text-sm">
              <div>
                <span className="font-semibold text-foreground">{formatBalance(currentUser.balance)}</span>
                <span className="text-gradient-gh font-bold ml-1">GH</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 p-0 text-primary hover:text-primary/80" onClick={() => {setIsDepositModalOpen(true); closeMobileMenu();}}>
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only">Пополнить баланс</span>
              </Button>
            </div>
           <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10" onClick={closeMobileMenu}>
              <Link href="/account">
                <UserCircle className="mr-2 h-5 w-5" />
                Личный кабинет
              </Link>
            </Button>
          <Button onClick={handleLogout} variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2 h-5 w-5" />
            Выйти
          </Button>
        </div>
      )}
      {!currentUser && (
        <div className="p-4 border-t border-border">
          <Button asChild variant="default" className="w-full bg-primary text-primary-foreground" onClick={closeMobileMenu}>
            <Link href="/auth/login">
              <Key className="mr-2 h-5 w-5" />
              Войти / Регистрация
            </Link>
          </Button>
        </div>
      )}
    </nav>
  );


  return (
    <>
      <header className="bg-card/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-2 sm:px-4 py-2.5 flex items-center justify-between">
          {/* Mobile Burger Menu */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Открыть меню</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs p-0 bg-card text-card-foreground border-r border-border flex flex-col">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle><Logo siteName={siteSettings?.site_name} logoUrl={siteSettings?.logo_url} /></SheetTitle>
                </SheetHeader>
                <MobileNavContent />
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Logo (hidden on mobile), Mobile Logo (visible on mobile, centered) */}
          <div className="hidden lg:flex">
            <Logo siteName={siteSettings?.site_name} logoUrl={siteSettings?.logo_url} />
          </div>
          <div className="lg:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <Logo siteName={siteSettings?.site_name} logoUrl={siteSettings?.logo_url} />
          </div>


          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const IconComponent = item.icon_name ? iconMap[item.icon_name] : null;
              return (
                <Button key={item.id || item.label} asChild variant="ghost" className="text-icon-color hover:text-primary hover:bg-primary/10 px-2.5 py-1.5 h-auto">
                  <Link href={item.href} className="flex items-center gap-1.5 text-xs xl:text-sm">
                    {IconComponent && <IconComponent className="h-4 w-4 text-primary" />}
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Right side: Search and Auth/User block */}
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="hidden sm:flex"> 
                <SearchBar />
            </div>
            {authLoading ? (
              <div className="h-9 w-24 md:w-36 bg-muted rounded-md animate-pulse"></div>
            ) : currentUser ? (
              <div className="hidden lg:flex items-center space-x-1"> 
                <div className="flex items-center space-x-1 px-2 py-1.5 rounded-md bg-muted/50 border border-border text-xs">
                  <span className="font-semibold text-foreground">{formatBalance(currentUser.balance)}</span>
                  <span className="text-gradient-gh font-bold ml-1">GH</span>
                   <Button variant="ghost" size="icon" className="h-5 w-5 p-0 ml-1 text-primary hover:text-primary/80" onClick={() => setIsDepositModalOpen(true)}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only">Пополнить баланс</span>
                  </Button>
                </div>
                <Button asChild variant="ghost" className="text-icon-color hover:text-primary hover:bg-primary/10 px-2 py-1.5 h-auto">
                  <Link href="/account" className="flex items-center gap-1.5 text-xs xl:text-sm">
                    <UserCircle className="h-4 w-4 text-primary" />
                    {currentUser.username}
                  </Link>
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full p-1.5 h-8 w-8 sm:h-9 sm:w-9" aria-label="Выйти">
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            ) : (
              <Button asChild variant="ghost" size="icon" className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full p-1.5 h-8 w-8 sm:h-9 sm:w-9">
                <Link href="/auth/login" aria-label="Авторизация">
                    <Key className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            )}
             <div className="sm:hidden"> 
                <SearchBar />
            </div>
          </div>
        </div>
      </header>
      {currentUser && (
        <BalanceDepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          onBalanceUpdated={onBalanceUpdated}
        />
      )}
    </>
  );
};

export default Header;
