
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const addUserSchema = z.object({
  username: z.string().min(3, { message: "Имя пользователя должно быть не менее 3 символов." }),
  email: z.string().email({ message: "Неверный формат email." }),
  password: z.string().min(6, { message: "Пароль должен быть не менее 6 символов." }),
  role: z.enum(['client', 'admin', 'booster'], { required_error: "Роль обязательна."}),
  balance: z.coerce.number().min(0, { message: "Баланс не может быть отрицательным." }).optional().default(0),
  referral_percentage: z.coerce.number().min(0, "Процент не может быть отрицательным.").max(100, "Процент не может быть больше 100.").optional().default(5.00),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'client',
      balance: 0,
      referral_percentage: 5.00,
    },
  });

  const onSubmit = async (data: AddUserFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Не удалось добавить пользователя.');
      }

      toast({
        title: "Пользователь добавлен",
        description: `Пользователь ${data.username} успешно создан.`,
      });
      onUserAdded(); 
      form.reset();
      onClose(); 
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при добавлении пользователя.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) { form.reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">Добавить нового пользователя</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-3 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="username-add" className="text-foreground">Логин</Label>
            <Input id="username-add" {...form.register("username")} placeholder="super_user" className="mt-1" disabled={isLoading} />
            {form.formState.errors.username && <p className="text-xs text-destructive mt-1">{form.formState.errors.username.message}</p>}
          </div>
          <div>
            <Label htmlFor="email-add" className="text-foreground">Email</Label>
            <Input id="email-add" type="email" {...form.register("email")} placeholder="user@example.com" className="mt-1" disabled={isLoading} />
            {form.formState.errors.email && <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password-add" className="text-foreground">Пароль</Label>
            <Input id="password-add" type="password" {...form.register("password")} placeholder="••••••••" className="mt-1" disabled={isLoading} />
            {form.formState.errors.password && <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="role-add" className="text-foreground">Роль</Label>
            <Select 
              onValueChange={(value) => form.setValue('role', value as 'client' | 'admin' | 'booster')} 
              defaultValue={form.getValues('role')}
              disabled={isLoading}
            >
              <SelectTrigger id="role-add" className="w-full mt-1">
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Клиент</SelectItem>
                <SelectItem value="admin">Администратор</SelectItem>
                <SelectItem value="booster">Бустер</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && <p className="text-xs text-destructive mt-1">{form.formState.errors.role.message}</p>}
          </div>
          <div>
            <Label htmlFor="balance-add" className="text-foreground">Баланс (GH)</Label>
            <Input id="balance-add" type="number" step="0.01" {...form.register("balance")} placeholder="0.00" className="mt-1" disabled={isLoading} />
            {form.formState.errors.balance && <p className="text-xs text-destructive mt-1">{form.formState.errors.balance.message}</p>}
          </div>
           <div>
            <Label htmlFor="referral_percentage-add" className="text-foreground">Реферальный процент (%)</Label>
            <Input id="referral_percentage-add" type="number" step="0.01" {...form.register("referral_percentage")} placeholder="5.00" className="mt-1" disabled={isLoading} />
            {form.formState.errors.referral_percentage && <p className="text-xs text-destructive mt-1">{form.formState.errors.referral_percentage.message}</p>}
          </div>

          <DialogFooter className="mt-5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => { form.reset(); onClose();}} disabled={isLoading}>Отмена</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Добавление...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
