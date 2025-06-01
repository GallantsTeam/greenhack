
// src/app/admin/editor/offer-editor/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Construction } from 'lucide-react';

export default function AdminOfferEditorPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5" />
            Редактор страницы Оферты
        </CardTitle>
        <CardDescription className="text-muted-foreground">Редактирование текста публичной оферты.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center py-10">
        <Construction className="mx-auto h-16 w-16 text-primary/70 mb-4" />
        <p className="text-lg text-foreground">Раздел находится в разработке.</p>
        <p className="text-muted-foreground">Скоро здесь можно будет редактировать содержимое страницы оферты.</p>
      </CardContent>
    </Card>
  );
}
