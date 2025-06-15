'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import ClientOnly from './ClientOnlyProvider';

interface NextAuthProviderProps {
  children: ReactNode;
}

export default function NextAuthProvider({ children }: NextAuthProviderProps) {
  return (
    <SessionProvider>
      <ClientOnly>{children}</ClientOnly>
    </SessionProvider>
  );
} 