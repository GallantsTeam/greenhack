
// src/app/admin/site-settings/boosters/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminBoostersPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Управление Бустерами
        </CardTitle>
        <CardDescription className="text-muted-foreground">Добавление, редактирование и управление аккаунтами бустеров.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">Раздел управления бустерами находится в разработке.</p>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <PlusCircle className="mr-2 h-4 w-4"/> Добавить нового бустера
        </Button>
        {/* Placeholder for boosters list and management tools */}
      </CardContent>
    </Card>
  );
}
