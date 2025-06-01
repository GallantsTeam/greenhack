
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserCog, Mail, Lock, Bot } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary tracking-tight">Настройки Аккаунта</h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <Mail className="mr-2 h-6 w-6"/>
            Email
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Измените ваш адрес электронной почты.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="current-email" className="text-foreground">Текущий Email</Label>
            <Input type="email" id="current-email" value="demo@example.com" readOnly className="mt-1 bg-muted"/>
          </div>
          <div>
            <Label htmlFor="new-email" className="text-foreground">Новый Email</Label>
            <Input type="email" id="new-email" placeholder="new.email@example.com" className="mt-1"/>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Сохранить Email</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <Lock className="mr-2 h-6 w-6"/>
            Пароль
          </CardTitle>
           <CardDescription className="text-muted-foreground">
            Измените ваш пароль.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="current-password"className="text-foreground">Текущий пароль</Label>
            <Input type="password" id="current-password" placeholder="••••••••" className="mt-1"/>
          </div>
          <div>
            <Label htmlFor="new-password" className="text-foreground">Новый пароль</Label>
            <Input type="password" id="new-password" placeholder="••••••••" className="mt-1"/>
          </div>
          <div>
            <Label htmlFor="confirm-new-password" className="text-foreground">Подтвердите новый пароль</Label>
            <Input type="password" id="confirm-new-password" placeholder="••••••••" className="mt-1"/>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Изменить пароль</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center">
            <Bot className="mr-2 h-6 w-6"/>
            Telegram
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Привяжите ваш аккаунт Telegram для получения уведомлений и других возможностей.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: Add Telegram linking logic */}
          <p className="text-muted-foreground mb-3">Текущий статус: <span className="text-destructive-foreground font-semibold">Не привязан</span></p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Привязать Telegram</Button>
        </CardContent>
      </Card>
    </div>
  );
}
