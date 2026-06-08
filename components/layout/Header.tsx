'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/utils/rbac';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="fixed left-60 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
        {session?.user && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{session.user.name}</span>
              <Badge variant="secondary" className="text-xs">
                {ROLE_LABELS[session.user.role]}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="gap-1.5 text-gray-500"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
