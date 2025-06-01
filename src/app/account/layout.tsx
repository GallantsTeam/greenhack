
'use client';

import { SidebarProvider, Sidebar, SidebarMenuButton } from "@/components/ui/sidebar"; 
import Link from "next/link";
import { Home, ShoppingBag, Box, Gem, Users, UserCog, CreditCard, LogOut, Menu as MenuIcon, Copyright, ShieldCheck } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react"; 
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"; 
import Footer from "@/components/layout/Footer"; 


const accountNavItems = [
  { href: "/account", label: "Обзор", icon: Home },
  { href: "/account/purchase-history", label: "История покупок", icon: ShoppingBag },
  { href: "/account/case-history", label: "История кейсов", icon: Box },
  { href: "/account/inventory", label: "Инвентарь", icon: Gem },
  { href: "/account/balance", label: "Баланс", icon: CreditCard },
  { href: "/account/referrals", label: "Рефералы", icon: Users },
  { href: "/account/settings", label: "Настройки", icon: UserCog },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, loading, router]);

  const handleLogout = () => {
    logout();
    setIsMobileSheetOpen(false); 
  };
  
  const handleLinkClick = () => {
    setIsMobileSheetOpen(false); 
  };


  if (loading) {
    return <div className="flex justify-center items-center flex-1 min-h-screen"><p>Загрузка...</p></div>;
  }
  if (!currentUser) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback:
    return <div className="flex justify-center items-center flex-1 min-h-screen"><p>Пожалуйста, войдите для доступа к этой странице.</p></div>;
  }
  
  const MobileNavMenu = () => (
    <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden fixed top-16 right-4 z-50 bg-card text-primary border-primary hover:bg-primary/10">
          <MenuIcon className="h-6 w-6" />
          <span className="sr-only">Открыть меню</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-xs p-0 bg-card text-card-foreground border-r border-border flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-xl font-semibold text-primary">Личный Кабинет</SheetTitle>
        </SheetHeader>
        <nav className="flex-grow px-2 py-4 space-y-1 overflow-y-auto">
          {accountNavItems.map((item) => (
            <Link href={item.href} key={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                variant="ghost"
                className="w-full justify-start text-foreground/80 hover:text-primary hover:bg-primary/10"
                onClick={handleLinkClick}
              >
                <item.icon className="h-5 w-5 mr-3 text-primary" />
                {item.label}
              </SidebarMenuButton>
            </Link>
          ))}
          {currentUser?.role === 'admin' && (
            <Link href="/admin" legacyBehavior passHref>
              <SidebarMenuButton
                variant="ghost"
                className="w-full justify-start text-foreground/80 hover:text-primary hover:bg-primary/10"
                onClick={handleLinkClick}
              >
                <ShieldCheck className="h-5 w-5 mr-3 text-primary" />
                Админ Панель
              </SidebarMenuButton>
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-border mt-auto">
           <Button 
              variant="outline" 
              className="w-full border-icon-color text-icon-color hover:bg-icon-color/10 hover:text-icon-color/90"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Выйти
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );


  return (
    <SidebarProvider defaultOpen>
      <div className="flex flex-col flex-1 min-h-screen">
         <MobileNavMenu /> 
        <div className="flex flex-1 overflow-hidden pt-16 md:pt-0"> 
          <Sidebar side="left" className="border-r border-border bg-card text-card-foreground w-64 hidden md:flex flex-col">
            <div className="p-4">
              <h2 className="text-xl font-bold text-primary">Личный Кабинет</h2>
            </div>
            <nav className="flex-grow px-2 py-4 space-y-1">
              {accountNavItems.map((item) => (
                <Link href={item.href} key={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      variant="ghost"
                      className="w-full justify-start text-foreground/80 hover:text-primary hover:bg-primary/10"
                    >
                      <item.icon className="h-5 w-5 mr-3 text-primary" />
                      {item.label}
                    </SidebarMenuButton>
                  </Link>
              ))}
              {currentUser?.role === 'admin' && (
                 <Link href="/admin" legacyBehavior passHref>
                    <SidebarMenuButton
                      variant="ghost"
                      className="w-full justify-start text-foreground/80 hover:text-primary hover:bg-primary/10"
                    >
                      <ShieldCheck className="h-5 w-5 mr-3 text-primary" />
                      Админ Панель
                    </SidebarMenuButton>
                  </Link>
              )}
            </nav>
            <div className="p-4 border-t border-border mt-auto">
               <Button 
                  variant="outline" 
                  className="w-full border-icon-color text-icon-color hover:bg-icon-color/10 hover:text-icon-color/90"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Выйти
              </Button>
            </div>
          </Sidebar>
          <main className="flex-1 px-6 pb-6 md:px-10 md:pb-10 bg-background overflow-auto flex flex-col"> 
            <div className="flex-grow">
              {children}
            </div>
             <Footer simplified />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
