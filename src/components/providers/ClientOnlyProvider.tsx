'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
}

/**
 * ClientOnly component to prevent hydration issues by only rendering on the client
 * This is useful for components that use browser-specific APIs or attributes
 */
export default function ClientOnly({ children }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on the server, only show content on the client
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
} 