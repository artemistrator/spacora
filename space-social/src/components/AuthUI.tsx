'use client';

import { useAuth, useUser, SignInButton, SignUpButton, SignOutButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';

export function AuthUI() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything on the server to avoid hydration mismatches
  if (!isClient) {
    return null;
  }

  if (isSignedIn && user) {
    return (
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={user.imageUrl} alt={user.fullName || user.username || ''} />
          <AvatarFallback>
            {user.firstName?.charAt(0)}
            {user.lastName?.charAt(0) || user.firstName?.charAt(1) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block">
          <p className="text-sm font-medium">
            {user.firstName} {user.lastName}
          </p>
        </div>
        <SignOutButton>
          <Button variant="outline" size="sm">Выйти</Button>
        </SignOutButton>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <SignInButton mode="modal">
        <Button variant="outline">Войти</Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button>Регистрация</Button>
      </SignUpButton>
    </div>
  );
}