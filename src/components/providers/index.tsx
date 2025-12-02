'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './auth-provider';
import { CommandPalette } from '@/components/ui/command-palette';
import { KeyboardShortcutDialog } from '@/components/ui/keyboard-shortcut-dialog';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <DndProvider backend={HTML5Backend}>
            {children}
            <CommandPalette />
            <KeyboardShortcutDialog />
          </DndProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
