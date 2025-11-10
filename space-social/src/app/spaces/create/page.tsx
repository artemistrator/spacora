'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpaceForm } from '@/components/space/SpaceForm';

export default function CreateSpacePage() {
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/');
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Создать пространство</CardTitle>
            <CardDescription>
              Создайте профиль для вашего жилого пространства
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpaceForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}