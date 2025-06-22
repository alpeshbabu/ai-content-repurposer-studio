'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'content' | 'general';
  modifiers?: ('ctrl' | 'cmd' | 'shift' | 'alt')[];
}

interface UseKeyboardShortcutsProps {
  shortcuts?: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts = [], enabled = true }: UseKeyboardShortcutsProps = {}) {
  const router = useRouter();
  
  // Default global shortcuts (3-key combinations)
  const defaultShortcuts: KeyboardShortcut[] = useMemo(() => [
    // Navigation
    {
      key: 'h',
      modifiers: ['ctrl', 'shift'],
      description: 'Go to Dashboard',
      action: () => router.push('/dashboard'),
      category: 'navigation'
    },
    {
      key: 'n',
      modifiers: ['ctrl', 'shift'],
      description: 'Create New Content',
      action: () => router.push('/dashboard/new'),
      category: 'content'
    },
    {
      key: 'l',
      modifiers: ['ctrl', 'shift'],
      description: 'View Content Library',
      action: () => router.push('/dashboard/content'),
      category: 'content'
    },
    {
      key: 's',
      modifiers: ['ctrl', 'shift'],
      description: 'Go to Settings',
      action: () => router.push('/dashboard/settings'),
      category: 'navigation'
    },
    {
      key: 't',
      modifiers: ['ctrl', 'shift'],
      description: 'Go to Team',
      action: () => router.push('/dashboard/settings/team'),
      category: 'navigation'
    },
    {
      key: 'a',
      modifiers: ['ctrl', 'shift'],
      description: 'Go to Analytics',
      action: () => router.push('/dashboard/analytics'),
      category: 'navigation'
    },
    // Search
    {
      key: '/',
      modifiers: ['ctrl', 'shift'],
      description: 'Focus Search',
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      category: 'general'
    },
    // General
    {
      key: '?',
      modifiers: ['ctrl', 'shift'],
      description: 'Show Keyboard Shortcuts',
      action: () => {
        // This will be handled by the component
      },
      category: 'general'
    }
  ], [router]);

  const allShortcuts = useMemo(() => [...defaultShortcuts, ...shortcuts], [defaultShortcuts, shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Exception for search shortcut
      if (event.key === '/' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      return;
    }

    for (const shortcut of allShortcuts) {
      const isKeyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const modifiers = shortcut.modifiers || [];
      
      // const isCtrlPressed = modifiers.includes('ctrl') && (event.ctrlKey || event.metaKey);
      // const isShiftPressed = modifiers.includes('shift') && event.shiftKey;
      // const isAltPressed = modifiers.includes('alt') && event.altKey;
      
      const requiredModifiersPressed = modifiers.every(modifier => {
        switch (modifier) {
          case 'ctrl':
          case 'cmd':
            return event.ctrlKey || event.metaKey;
          case 'shift':
            return event.shiftKey;
          case 'alt':
            return event.altKey;
          default:
            return false;
        }
      });

      // const noExtraModifiers = 
      //   (!modifiers.includes('ctrl') && !modifiers.includes('cmd')) || (event.ctrlKey || event.metaKey) &&
      //   (!modifiers.includes('shift') || event.shiftKey) &&
      //   (!modifiers.includes('alt') || event.altKey);

      if (isKeyMatch && requiredModifiersPressed) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [allShortcuts, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: allShortcuts };
}

// Keyboard shortcuts help dialog
export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const { shortcuts } = useKeyboardShortcuts();

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category]!.push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const modifiers = shortcut.modifiers || [];
    const parts = [];
    
    if (modifiers.includes('ctrl') || modifiers.includes('cmd')) {
      parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    }
    if (modifiers.includes('shift')) {
      parts.push('⇧');
    }
    if (modifiers.includes('alt')) {
      parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
    }
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  };

  const categoryLabels = {
    navigation: 'Navigation',
    content: 'Content',
    general: 'General'
  };

  // Listen for Ctrl+Shift+? key to open help
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && event.shiftKey && (event.ctrlKey || event.metaKey) && !open) {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Command className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="font-medium text-lg mb-3 capitalize">
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50">
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {formatShortcut(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Press <Badge variant="outline" className="font-mono text-xs mx-1">Ctrl + Shift + ?</Badge> to toggle this dialog
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Context provider for keyboard shortcuts
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  
  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        <KeyboardShortcutsHelp />
      </div>
    </>
  );
}

// Hook for content-specific shortcuts
export function useContentShortcuts() {
  const router = useRouter();
  
  const contentShortcuts: KeyboardShortcut[] = [
    {
      key: 'e',
      modifiers: ['ctrl', 'shift'],
      description: 'Edit Current Content',
      action: () => {
        // Get current content ID from URL or context
        const pathParts = window.location.pathname.split('/');
        const contentId = pathParts[pathParts.length - 1];
        if (contentId && contentId !== 'content') {
          router.push(`/dashboard/content/${contentId}/edit`);
        }
      },
      category: 'content'
    },
    {
      key: 'r',
      modifiers: ['ctrl', 'shift'],
      description: 'Repurpose Current Content',
      action: () => {
        const repurposeButton = document.querySelector('[data-action="repurpose"]') as HTMLButtonElement;
        if (repurposeButton) {
          repurposeButton.click();
        }
      },
      category: 'content'
    },
    {
      key: 'c',
      modifiers: ['ctrl', 'shift', 'alt'],
      description: 'Copy Content to Clipboard',
      action: () => {
        const contentText = document.querySelector('[data-content="original"]')?.textContent;
        if (contentText) {
          navigator.clipboard.writeText(contentText);
        }
      },
      category: 'content'
    }
  ];

  return useKeyboardShortcuts({ shortcuts: contentShortcuts });
}

// Hook for dashboard shortcuts
export function useDashboardShortcuts() {
  const dashboardShortcuts: KeyboardShortcut[] = [
    {
      key: 'f',
      modifiers: ['ctrl', 'shift'],
      description: 'Toggle Filters',
      action: () => {
        const filterButton = document.querySelector('[data-action="toggle-filters"]') as HTMLButtonElement;
        if (filterButton) {
          filterButton.click();
        }
      },
      category: 'general'
    },
    {
      key: 'g',
      modifiers: ['ctrl', 'shift'],
      description: 'Toggle Grid/List View',
      action: () => {
        const viewToggle = document.querySelector('[data-action="toggle-view"]') as HTMLButtonElement;
        if (viewToggle) {
          viewToggle.click();
        }
      },
      category: 'general'
    }
  ];

  return useKeyboardShortcuts({ shortcuts: dashboardShortcuts });
} 