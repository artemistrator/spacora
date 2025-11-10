'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function UserProfile() {
  const { user, isSignedIn } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything on the server to avoid hydration mismatches
  if (!isClient || !isSignedIn) {
    return null;
  }

  return (
    <Link href="/profile">
      <Button variant="ghost" className="p-0 h-auto flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
          <AvatarFallback>
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0) || user?.firstName?.charAt(1) || 'U'}
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:inline text-sm">
          {user?.firstName} {user?.lastName}
        </span>
      </Button>
    </Link>
  );
}