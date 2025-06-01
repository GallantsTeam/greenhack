
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Layers3 } from "lucide-react";

export default function CaseHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary tracking-tight">История Открытия Кейсов</h1>
      <Card className="shadow-lg">
        <CardHeader>
           <CardTitle className="text-xl text-primary flex items-center">
            <Layers3 className="mr-2 h-6 w-6"/>
            Результаты открытия
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Здесь будет отображаться история всех открытых вами кейсов и полученных призов.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">Вы еще не открывали кейсы.</p>
          </div>
          {/* TODO: Add table or list of case openings */}
        </CardContent>
      </Card>
    </div>
  );
}
