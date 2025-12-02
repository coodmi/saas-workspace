'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  MessageSquare,
  Users,
  Settings,
  Bell,
  Plus,
  Search,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Keyboard,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut } from '@/lib/firebase/auth';

interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      setOpen(false);
    },
    [router]
  );

  const actions: CommandAction[] = [
    // Navigation
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      shortcut: 'G D',
      onSelect: () => navigate('/dashboard'),
      group: 'Navigation',
    },
    {
      id: 'projects',
      label: 'Go to Projects',
      icon: <FolderKanban className="h-4 w-4" />,
      shortcut: 'G P',
      onSelect: () => navigate('/dashboard/projects'),
      group: 'Navigation',
    },
    {
      id: 'files',
      label: 'Go to Files',
      icon: <FileText className="h-4 w-4" />,
      shortcut: 'G F',
      onSelect: () => navigate('/dashboard/files'),
      group: 'Navigation',
    },
    {
      id: 'chat',
      label: 'Go to Chat',
      icon: <MessageSquare className="h-4 w-4" />,
      shortcut: 'G C',
      onSelect: () => navigate('/dashboard/chat'),
      group: 'Navigation',
    },
    {
      id: 'team',
      label: 'Go to Team',
      icon: <Users className="h-4 w-4" />,
      shortcut: 'G T',
      onSelect: () => navigate('/dashboard/team'),
      group: 'Navigation',
    },
    {
      id: 'notifications',
      label: 'Go to Notifications',
      icon: <Bell className="h-4 w-4" />,
      shortcut: 'G N',
      onSelect: () => navigate('/dashboard/notifications'),
      group: 'Navigation',
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      icon: <Settings className="h-4 w-4" />,
      shortcut: 'G S',
      onSelect: () => navigate('/dashboard/settings'),
      group: 'Navigation',
    },
    // Actions
    {
      id: 'new-project',
      label: 'Create New Project',
      icon: <Plus className="h-4 w-4" />,
      onSelect: () => navigate('/dashboard/projects/new'),
      group: 'Actions',
    },
    {
      id: 'upload-file',
      label: 'Upload File',
      icon: <FileText className="h-4 w-4" />,
      onSelect: () => navigate('/dashboard/files'),
      group: 'Actions',
    },
    {
      id: 'search',
      label: 'Search Everywhere',
      icon: <Search className="h-4 w-4" />,
      shortcut: '/',
      onSelect: () => {
        setOpen(false);
        // Could open a global search modal
      },
      group: 'Actions',
    },
    // Theme
    {
      id: 'toggle-theme',
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      onSelect: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        setOpen(false);
      },
      group: 'Preferences',
    },
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      icon: <Keyboard className="h-4 w-4" />,
      shortcut: 'Ctrl /',
      onSelect: () => {
        // Trigger keyboard shortcuts dialog
        setOpen(false);
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: '/', ctrlKey: true })
        );
      },
      group: 'Preferences',
    },
    // Account
    {
      id: 'help',
      label: 'Help & Documentation',
      icon: <HelpCircle className="h-4 w-4" />,
      shortcut: '?',
      onSelect: () => {
        window.open('/docs', '_blank');
        setOpen(false);
      },
      group: 'Account',
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <LogOut className="h-4 w-4" />,
      onSelect: async () => {
        await signOut();
        router.push('/auth/login');
        setOpen(false);
      },
      group: 'Account',
    },
  ];

  const groups = Array.from(new Set(actions.map((a) => a.group)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, index) => (
          <div key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {actions
                .filter((a) => a.group === group)
                .map((action) => (
                  <CommandItem
                    key={action.id}
                    value={action.label}
                    onSelect={action.onSelect}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {action.icon}
                      <span>{action.label}</span>
                    </div>
                    {action.shortcut && (
                      <span className="text-xs text-muted-foreground">
                        {action.shortcut}
                      </span>
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
