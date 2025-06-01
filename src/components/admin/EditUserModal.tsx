
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form'; // Added Controller here
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types';

const editUserSchema = z.object({
  username: z.string().min(3, { message: "Имя пользователя должно быть не менее 3 символов." }),
  email: z.string().email({ message: "Неверный формат email." }),
  password: z.string().min(6, { message: "Новый пароль должен быть не менее 6 символов." }).optional().or(z.literal('')),
  role: z.enum(['client', 'admin', 'booster'], { required_error: "Роль обязательна."}),
  balance: z.coerce.number().min(0, { message: "Баланс не может быть отрицательным." }).default(0),
  referral_percentage: z.coerce.number().min(0, "Процент не может быть отрицательным.").max(100, "Процент не может быть больше 100.").optional().default(5.00),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUserUpdated }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'client',
      balance: 0,
      referral_percentage: 5.00,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
        balance: user.balance || 0,
        referral_percentage: user.referral_percentage === undefined ? 5.00 : Number(user.referral_percentage),
      });
    }
  }, [user, form]);

  const onSubmit = async (data: EditUserFormValues) => {
    if (!user) return;
    setIsLoading(true);
    
    const payload: Partial<EditUserFormValues> & { id?: number } = { ...data };
    if (!data.password || data.password.trim() === '') { 
      delete payload.password;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Не удалось обновить пользователя.');
      }

      toast({
        title: "Пользователь обновлен",
        description: `Данные пользователя ${data.username} были успешно обновлены.`,
      });
      onUserUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Ошибка обновления",
        description: error.message || "Произошла ошибка при обновлении пользователя.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) { form.reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">Редактировать: {user.username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-3 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="edit-username" className="text-foreground">Логин</Label>
            <Input id="edit-username" {...form.register("username")} className="mt-1" disabled={isLoading} />
            {form.formState.errors.username && <p className="text-xs text-destructive mt-1">{form.formState.errors.username.message}</p>}
          </div>
          <div>
            <Label htmlFor="edit-email" className="text-foreground">Email</Label>
            <Input id="edit-email" type="email" {...form.register("email")} className="mt-1" disabled={isLoading} />
            {form.formState.errors.email && <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="edit-password" className="text-foreground">Новый пароль (не менять - пусто)</Label>
            <Input id="edit-password" type="password" {...form.register("password")} placeholder="••••••••" className="mt-1" disabled={isLoading} />
            {form.formState.errors.password && <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="edit-role" className="text-foreground">Роль</Label>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                 <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Клиент</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="booster">Бустер</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.role && <p className="text-xs text-destructive mt-1">{form.formState.errors.role.message}</p>}
          </div>
          <div>
            <Label htmlFor="edit-balance" className="text-foreground">Баланс (GH)</Label>
            <Input id="edit-balance" type="number" step="0.01" {...form.register("balance")} className="mt-1" disabled={isLoading} />
            {form.formState.errors.balance && <p className="text-xs text-destructive mt-1">{form.formState.errors.balance.message}</p>}
          </div>
           <div>
            <Label htmlFor="edit-referral_percentage" className="text-foreground">Реферальный процент (%)</Label>
            <Input id="edit-referral_percentage" type="number" step="0.01" {...form.register("referral_percentage")} placeholder="5.00" className="mt-1" disabled={isLoading} />
            {form.formState.errors.referral_percentage && <p className="text-xs text-destructive mt-1">{form.formState.errors.referral_percentage.message}</p>}
          </div>

          <DialogFooter className="mt-5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => { form.reset(); onClose(); }} disabled={isLoading}>Отмена</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
