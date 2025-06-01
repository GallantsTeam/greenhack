
'use client'; 

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Image as ImageIconLucide, Mail, Bot, CreditCard, KeyRound, Users, Menu as MenuIconLucide, Palette, BellRing } from 'lucide-react'; // Added BellRing
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';

const settingsNavItems = [
  { href: '/admin/site-settings/general', label: 'Общие', icon: Settings, baseRoute: '/admin/site-settings/general' },
  { href: '/admin/site-settings/banners', label: 'Баннеры', icon: ImageIconLucide, baseRoute: '/admin/site-settings/banners' },
  { href: '/admin/site-settings/notifications', label: 'Уведомления', icon: BellRing, baseRoute: '/admin/site-settings/notifications' }, // Added Notifications
  { href: '/admin/site-settings/smtp', label: 'SMTP', icon: Mail, baseRoute: '/admin/site-settings/smtp' },
  { href: '/admin/site-settings/telegram', label: 'Telegram', icon: Bot, baseRoute: '/admin/site-settings/telegram' },
  { href: '/admin/site-settings/payment', label: 'Платежный шлюз', icon: CreditCard, baseRoute: '/admin/site-settings/payment' },
  { href: '/admin/site-settings/license', label: 'Лицензия', icon: KeyRound, baseRoute: '/admin/site-settings/license' },
  { href: '/admin/site-settings/boosters', label: 'Бустеры', icon: Users, baseRoute: '/admin/site-settings/boosters' }, 
];

export default function SiteSettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (itemHref: string, itemBaseRoute?: string) => {
    if (itemBaseRoute) {
      return pathname === itemBaseRoute || (pathname.startsWith(itemBaseRoute) && pathname.length > itemBaseRoute.length && pathname.charAt(itemBaseRoute.length) === '/');
    }
    return pathname === itemHref;
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <Settings className="mr-2 h-6 w-6" />
            Настройки Сайта
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Управление глобальными настройками и конфигурациями сайта.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <nav className="space-y-1">
            {settingsNavItems.map((item) => {
              const active = isActive(item.href, item.baseRoute);
              return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className="mr-2 h-5 w-5" />
                {item.label}
              </Link>
            )})}
          </nav>
        </aside>
        <main className="md:col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
}
    
    

    