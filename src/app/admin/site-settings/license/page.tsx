
// src/app/admin/site-settings/license/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, CheckCircle } from 'lucide-react';

export default function AdminLicensePage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center">
            <KeyRound className="mr-2 h-5 w-5" />
            Управление Лицензией Сайта
        </CardTitle>
        <CardDescription className="text-muted-foreground">Информация о лицензии вашей платформы Green Hack.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="licenseKey" className="text-foreground">Текущий ключ:</Label>
          <Input id="licenseKey" value="GALLANT_GREENHACK2025" readOnly className="bg-muted"/>
        </div>
         <div className="space-y-2">
          <Label htmlFor="licenseStatus" className="text-foreground">Статус:</Label>
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="h-5 w-5" />
            <span>Активно</span>
          </div>
        </div>
         <div className="space-y-2">
          <Label htmlFor="licenseExpiry" className="text-foreground">Истекает через:</Label>
          <p className="text-foreground">365 дней</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" disabled>Проверить обновления</Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" disabled>Проверить лицензию</Button>
        </div>
        <p className="text-xs text-muted-foreground">Функционал управления лицензией находится в разработке.</p>
      </CardContent>
    </Card>
  );
}
