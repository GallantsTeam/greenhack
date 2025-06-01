
'use client'; 

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PencilRuler, MessageCircle, FileText, PlusSquare, Link as LinkIconLucide, ShoppingBag, LayoutDashboard, LayoutGrid, Star, HelpCircle, ShieldCheck, ListFilter } from 'lucide-react'; 
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';

const editorNavItems = [
  { href: '/admin/editor/homepage-settings', label: 'Настройки Главной', icon: LayoutDashboard, baseRoute: '/admin/editor/homepage-settings' },
  { href: '/admin/editor/catalog-page-settings', label: 'Настройки Каталога', icon: LayoutGrid, baseRoute: '/admin/editor/catalog-page-settings' },
  { href: '/admin/editor/reviews-page-settings', label: 'Настройки Отзывов', icon: Star, baseRoute: '/admin/editor/reviews-page-settings' },
  { href: '/admin/editor/faq-editor', label: 'Редактор FAQ (Вопросы)', icon: HelpCircle, baseRoute: '/admin/editor/faq-editor' },
  { href: '/admin/editor/faq-sidebar-editor', label: 'Редактор FAQ (Сайдбар)', icon: ListFilter, baseRoute: '/admin/editor/faq-sidebar-editor' },
  { href: '/admin/editor/rules-editor', label: 'Редактор Правил', icon: FileText, baseRoute: '/admin/editor/rules-editor' },
  { href: '/admin/editor/offer-editor', label: 'Редактор Оферты', icon: ShieldCheck, baseRoute: '/admin/editor/offer-editor' },
  { href: '/admin/editor/footer-contacts', label: 'Контакты в футере', icon: MessageCircle, baseRoute: '/admin/editor/footer-contacts' },
  { href: '/admin/editor/footer-marketplace', label: 'Marketplace в футере', icon: ShoppingBag, baseRoute: '/admin/editor/footer-marketplace' },
  { href: '/admin/editor/custom-links', label: 'Доп. ссылки в футере', icon: LinkIconLucide, baseRoute: '/admin/editor/custom-links' },
];

export default function EditorLayout({ children }: { children: ReactNode }) {
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
            <PencilRuler className="mr-2 h-6 w-6" />
            Редактор Сайта
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Управление контентом и структурой некоторых разделов сайта.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <nav className="space-y-1">
            {editorNavItems.map((item) => {
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
