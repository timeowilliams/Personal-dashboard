'use client';

import { SessionProvider } from 'next-auth/react';
import NavBar from '@/components/NavBar';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NavBar />
      <main>{children}</main>
    </SessionProvider>
  );
}