import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { AuthUI } from '@/components/AuthUI';
import { NotificationToast } from '@/components/NotificationToast';
import Link from 'next/link';
import { UserProfile } from '@/components/UserProfile';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Space Social",
  description: "Социальная сеть для жилых пространств",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ru">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <header className="border-b bg-white sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-8">
                <h1 className="text-xl font-bold">Space Social</h1>
                <nav className="hidden md:flex gap-6">
                  <Link href="/" className="text-sm font-medium hover:text-blue-600 transition-colors">
                    Лента
                  </Link>
                  <Link href="/spaces" className="text-sm font-medium hover:text-blue-600 transition-colors">
                    Пространства
                  </Link>
                  <Link href="/profile" className="text-sm font-medium hover:text-blue-600 transition-colors">
                    Профиль
                  </Link>
                  <Link href="/ai-studio" className="text-sm font-medium hover:text-blue-600 transition-colors">
                    AI Студия
                  </Link>
                  <Link href="/favorites" className="text-sm font-medium hover:text-blue-600 transition-colors">
                    Избранное
                  </Link>
                  <Link href="/gamification" className="text-sm font-medium hover:text-blue-600 transition-colors">
                    Достижения
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <UserProfile />
                <AuthUI />
              </div>
            </div>
          </header>
          <main>
            {children}
            <NotificationToast />
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}