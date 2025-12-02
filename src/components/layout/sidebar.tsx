'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  MessageSquare,
  Users,
  Settings,
  Plus,
  ChevronDown,
  Hash,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/files', label: 'Files', icon: FileText },
  { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
  { href: '/dashboard/team', label: 'Team', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentTeam, teams } = useAuthStore();

  return (
    <div className="w-64 border-r bg-card flex flex-col">
      {/* Team Selector */}
      <div className="p-4 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {currentTeam?.name?.[0] || 'W'}
                  </span>
                </div>
                <span className="font-semibold truncate">
                  {currentTeam?.name || 'Workspace'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {teams.map((team) => (
              <DropdownMenuItem key={team.id}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold">{team.name[0]}</span>
                  </div>
                  <span>{team.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <Separator className="my-1" />
            <DropdownMenuItem>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn('w-full justify-start', isActive && 'bg-secondary')}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <Separator className="my-4" />

          {/* Channels Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Channels
              </span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <nav className="space-y-1">
              <Link href="/dashboard/chat/general">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <Hash className="mr-2 h-4 w-4" />
                  general
                </Button>
              </Link>
              <Link href="/dashboard/chat/random">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <Hash className="mr-2 h-4 w-4" />
                  random
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="p-2 border-t">
        <Link href="/dashboard/settings">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}
