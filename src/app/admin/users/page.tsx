
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Edit, Trash2, Eye, PlusCircle, Search, Loader2, AlertTriangle } from 'lucide-react';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import AddUserModal from '@/components/admin/AddUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

const PROTECTED_USER_ID = 4; // Define the protected user ID

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false); 
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
        throw new Error(errorData.message);
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Ошибка загрузки пользователей",
        description: error.message || "Не удалось получить список пользователей.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    if (user.id === PROTECTED_USER_ID) {
      toast({
        title: "Действие запрещено",
        description: "Этого пользователя нельзя редактировать через админ-панель.",
        variant: "destructive",
      });
      return;
    }
    setSelectedUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleDeleteUserClick = (user: User) => {
    if (user.id === PROTECTED_USER_ID) {
      toast({
        title: "Действие запрещено",
        description: "Этого пользователя нельзя удалять через админ-панель.",
        variant: "destructive",
      });
      return;
    }
    setUserToDelete(user);
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete || userToDelete.id === PROTECTED_USER_ID) return;

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Не удалось удалить пользователя.');
      }
      toast({
        title: "Пользователь удален",
        description: result.message || `Пользователь ${userToDelete.username} был успешно удален.`,
      });
      fetchUsers(); 
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error.message || "Произошла ошибка при удалении пользователя.",
        variant: "destructive",
      });
    }
    setUserToDelete(null); 
  };

  const handleViewDetails = (userId: number) => {
    if (userId === PROTECTED_USER_ID) {
       // Optionally, allow viewing but not editing/deleting on the detail page itself
       // For now, consistent behavior: if edit/delete is blocked here, detail page might also be restricted if it has edit/delete actions.
       // However, for a pure "view" page, it might be okay. Let's assume viewing is fine.
    }
    router.push(`/admin/users/${userId}/view`);
  };
  
  const formatRole = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'booster': return 'Бустер';
      case 'client': return 'Клиент';
      default: return role || 'Неизвестно';
    }
  };
  
  const formatBalance = (balance: number | undefined | null): string => {
    if (typeof balance !== 'number' || balance === null || isNaN(balance)) {
      return '0.00';
    }
    return balance.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <Users className="mr-2 h-6 w-6" />
              Управление Пользователями
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Просмотр, редактирование и управление аккаунтами пользователей.
            </CardDescription>
          </div>
          <Button onClick={handleAddUser} variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить пользователя
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по логину, email или роли..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full md:w-1/3 bg-background focus:border-primary"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Загрузка пользователей...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">ID</TableHead>
                    <TableHead className="text-primary">Логин</TableHead>
                    <TableHead className="text-primary">Email</TableHead>
                    <TableHead className="text-primary">Роль</TableHead>
                    <TableHead className="text-right text-primary">Баланс (GH)</TableHead>
                    <TableHead className="text-primary">Дата регистрации</TableHead>
                    <TableHead className="text-center text-primary">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground/90">{user.id}</TableCell>
                      <TableCell className="text-foreground/90">{user.username}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{formatRole(user.role)}</TableCell>
                      <TableCell className="text-right text-foreground/90">{formatBalance(user.balance)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleViewDetails(user.id)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Детали</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditUser(user)} disabled={user.id === PROTECTED_USER_ID}>
                            <Edit className="h-4 w-4" />
                             <span className="sr-only">Редактировать</span>
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteUserClick(user)} disabled={user.id === PROTECTED_USER_ID}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Удалить</span>
                              </Button>
                            </AlertDialogTrigger>
                            {userToDelete && userToDelete.id !== PROTECTED_USER_ID && (
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие нельзя отменить. Пользователь {userToDelete?.username} будет удален.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setUserToDelete(null)}>Отмена</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteUserConfirm} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            )}
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Пользователи не найдены.</p>
          )}
        </CardContent>
      </Card>
      
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={() => {
          setIsAddUserModalOpen(false);
          fetchUsers(); 
        }}
      />
      
      {selectedUser && (
        <EditUserModal
          isOpen={isEditUserModalOpen}
          onClose={() => {
            setIsEditUserModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={() => {
            setIsEditUserModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
