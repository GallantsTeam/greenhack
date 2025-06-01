
// src/app/admin/tickets/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket } from 'lucide-react';

export default function AdminTicketsPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center">
            <Ticket className="mr-2 h-6 w-6" />
            Управление Тикетами
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Обработка запросов поддержки от пользователей. (Временно не доступно)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Раздел управления тикетами находится в разработке.</p>
          {/* Placeholder for tickets system */}
        </CardContent>
      </Card>
    </div>
  );
}
