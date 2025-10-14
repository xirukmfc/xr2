import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  FileText,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  TestTube,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const mainNavigationItems = [
  {
    title: 'Prompts',
    href: '/prompts',
    icon: FileText,
    description: 'Manage your prompts'
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Performance insights',
    children: [
      {
        title: 'Dashboard',
        href: '/analytics/dashboard',
        icon: TrendingUp,
        description: 'Main metrics overview'
      },
      {
        title: 'A/B Tests',
        href: '/analytics/ab-tests',
        icon: TestTube,
        description: 'Test prompt variations'
      },
      {
        title: 'Event Setup',
        href: '/analytics/events',
        icon: Settings,
        description: 'Configure tracking'
      }
    ]
  },
  {
    title: 'Team',
    href: '/team',
    icon: Users,
    description: 'Team management'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Application settings'
  }
];

interface MainNavigationProps {
  className?: string;
}

export default function MainNavigation({ className }: MainNavigationProps) {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return router.pathname === href || router.pathname.startsWith(href);
  };

  return (
    <nav className={cn("space-y-2", className)}>
      {mainNavigationItems.map((item) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.title);
        const isItemActive = isActive(item.href);

        if (hasChildren) {
          return (
            <div key={item.title}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-auto p-3",
                  isItemActive && "bg-muted"
                )}
                onClick={() => toggleExpanded(item.title)}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>

              {isExpanded && (
                <div className="ml-6 mt-2 space-y-1 border-l pl-4">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = isActive(child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
                          isChildActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <ChildIcon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{child.title}</div>
                          <div className="text-xs opacity-75">{child.description}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-md transition-colors",
              isItemActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

// Также создадим компонент для быстрого доступа к аналитике
export function AnalyticsQuickAccess() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem asChild>
          <Link href="/analytics" className="flex items-center gap-3">
            <TrendingUp className="h-4 w-4" />
            <div>
              <div className="font-medium">Dashboard</div>
              <div className="text-xs text-muted-foreground">Main analytics overview</div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/analytics/ab-tests" className="flex items-center gap-3">
            <TestTube className="h-4 w-4" />
            <div>
              <div className="font-medium">A/B Tests</div>
              <div className="text-xs text-muted-foreground">Test prompt variations</div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/analytics/events" className="flex items-center gap-3">
            <Settings className="h-4 w-4" />
            <div>
              <div className="font-medium">Setup Events</div>
              <div className="text-xs text-muted-foreground">Configure tracking</div>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}