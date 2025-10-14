import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TestTube,
  Settings,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Activity
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Overview',
    href: '/analytics',
    icon: BarChart3,
    description: 'Main analytics dashboard'
  },
  {
    title: 'Dashboard',
    href: '/analytics/dashboard',
    icon: TrendingUp,
    description: 'Detailed metrics and charts'
  },
  {
    title: 'A/B Tests',
    href: '/analytics/ab-tests',
    icon: TestTube,
    description: 'Test different prompt versions'
  },
  {
    title: 'Event Setup',
    href: '/analytics/events',
    icon: Settings,
    description: 'Configure tracking events'
  },
];

interface AnalyticsNavigationProps {
  className?: string;
  variant?: 'sidebar' | 'tabs' | 'dropdown';
}

export default function AnalyticsNavigation({
  className,
  variant = 'sidebar'
}: AnalyticsNavigationProps) {
  const router = useRouter();

  if (variant === 'tabs') {
    return (
      <div className={cn("flex border-b", className)}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent hover:text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={cn("space-y-1", className)}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive
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
      </div>
    );
  }

  // Default sidebar variant
  return (
    <nav className={cn("space-y-2", className)}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = router.pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              isActive
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