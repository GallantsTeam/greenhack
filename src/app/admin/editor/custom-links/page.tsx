
// src/app/admin/editor/custom-links/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link as LinkIconLucide, Construction } from 'lucide-react';

export default function AdminCustomLinksPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
            <LinkIconLucide className="mr-2 h-5 w-5" />
            Дополнительные ссылки в футере
        </CardTitle>
        <CardDescription className="text-muted-foreground">Управление произвольными ссылками в подвале сайта.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center py-10">
        <Construction className="mx-auto h-16 w-16 text-primary/70 mb-4" />
        <p className="text-lg text-foreground">Раздел находится в разработке.</p>
        <p className="text-muted-foreground">Скоро здесь можно будет добавлять и редактировать кастомные ссылки для футера.</p>
      </CardContent>
    </Card>
  );
}
