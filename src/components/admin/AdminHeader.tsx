
'use client';

import { Button } from '@/components/ui/button';
import { Moon, Sun, UserCircle, ArrowLeftToLine, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function AdminHeader({ theme, toggleTheme }: AdminHeaderProps) {
  const { currentUser } = useAuth();
  const router = useRouter();

  return (
    <header className="h-16 bg-card text-card-foreground border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/account')} className="text-primary hover:text-primary/80 hover:bg-primary/10 border-primary">
          <ArrowLeftToLine className="mr-2 h-4 w-4" />
          Назад в ЛК
        </Button>
        <Button asChild variant="outline" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10 border-primary">
            <Link href="/">
                <ExternalLink className="mr-2 h-4 w-4" />
                Перейти на сайт
            </Link>
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-primary hover:text-primary/80 hover:bg-primary/10">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
        {currentUser && (
          <Button asChild variant="ghost" className="text-primary hover:text-primary/80 hover:bg-primary/10">
            <Link href="/account/settings">
              <UserCircle className="mr-2 h-5 w-5" />
              {currentUser.username}
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
