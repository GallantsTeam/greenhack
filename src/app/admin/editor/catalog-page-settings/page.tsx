
// src/app/admin/editor/catalog-page-settings/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutGrid, Construction } from 'lucide-react';

export default function AdminCatalogPageSettingsPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
            <LayoutGrid className="mr-2 h-5 w-5" />
            Настройки страницы Каталога
        </CardTitle>
        <CardDescription className="text-muted-foreground">Управление отображением и фильтрами на странице каталога игр.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center py-10">
        <Construction className="mx-auto h-16 w-16 text-primary/70 mb-4" />
        <p className="text-lg text-foreground">Раздел находится в разработке.</p>
        <p className="text-muted-foreground">Скоро здесь можно будет настраивать страницу каталога.</p>
      </CardContent>
    </Card>
  );
}
