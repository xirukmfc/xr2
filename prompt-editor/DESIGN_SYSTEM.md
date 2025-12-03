# xR2 Design System

This document describes the unified design system for the xR2 project.

## Overview

The xR2 project uses a consistent design system based on:
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Design Tokens** - Centralized styling constants

## Design Tokens

Located in `/lib/design-tokens.ts`

### Colors

All colors use CSS custom properties defined in `globals.css`:

```tsx
import { colors } from '@/lib/design-tokens'

// Status badges
<div className={colors.status.active}>Active</div>
<div className={colors.status.draft}>Draft</div>
<div className={colors.status.archived}>Archived</div>

// Status dots
<div className={colors.statusDot.active} />

// Buttons (use Button component variants instead)
<Button variant="default">Primary</Button>
```

### Helper Functions

```tsx
import { getStatusBadgeClasses, getStatusDotClasses } from '@/lib/design-tokens'

// Get status badge classes
const badgeClasses = getStatusBadgeClasses('active')

// Get status dot classes
const dotClasses = getStatusDotClasses('draft')
```

### Typography

```tsx
import { typography } from '@/lib/design-tokens'

<h1 className={typography.pageTitle}>Page Title</h1>
<p className={typography.pageSubtitle}>Subtitle</p>
<div className={typography.cardTitle}>Card Title</div>
<p className={typography.body}>Body text</p>
```

### Spacing

```tsx
import { spacing } from '@/lib/design-tokens'

// Header
<header className={spacing.header}>...</header>

// Cards
<Card className={spacing.card.default}>...</Card>
<Card className={spacing.card.compact}>...</Card>
```

### Icon Sizes

```tsx
import { iconSize, getIconSizeClasses } from '@/lib/design-tokens'

// Direct usage
<Icon className={iconSize.default} />

// Helper function
<Icon className={getIconSizeClasses('lg')} />
```

## Components

### Button

Use the Button component with variants instead of custom classes:

```tsx
// ✅ Good - Default is black
<Button>Submit</Button> // Black button
<Button variant="default">Submit</Button> // Black button (same)

// ✅ Primary is blue - use for main actions only
<Button variant="primary">Create Prompt</Button>
<Button variant="primary">Save Changes</Button>
<Button variant="primary">+ New Prompt</Button>

// ✅ Other variants
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>

// ❌ Bad - don't use hardcoded colors
<Button className="bg-black hover:bg-gray-800">Button</Button>
<Button className="bg-blue-600">Button</Button>
```

**Button Color Rules:**
- **Black (default)**: All regular buttons (Cancel, Close, Edit, etc.)
- **Blue (primary)**: Only for main actions - Create Prompt, Save Prompt, New Prompt
- **Red (destructive)**: Delete actions
- **Gray (secondary)**: Less important actions

### Loading States

Always use the unified loading components:

```tsx
import { LoadingState } from '@/components/ui/loading-state'
import { Loader2 } from 'lucide-react'

// For full-page loading
<LoadingState message="Loading..." />

// For inline spinners
<Loader2 className="h-4 w-4 animate-spin text-primary" />
```

### Status Badges

Use helper functions for consistent status styling:

```tsx
import { getStatusBadgeClasses, getStatusDotClasses } from '@/lib/design-tokens'

<span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadgeClasses(status)}`}>
  {status}
</span>
```

## Logging

Use the development-only logger instead of console:

```tsx
import { logger } from '@/lib/logger'

// Only logs in development
logger.log('Debug info')
logger.warn('Warning')

// Always logs (even in production)
logger.error('Error occurred')
```

## Theme Colors

The project uses HSL color system with CSS variables:

### Light Theme
- Primary: `hsl(220 90% 56%)` - Blue
- Success: `hsl(142 76% 36%)` - Green
- Warning: `hsl(38 92% 50%)` - Orange
- Destructive: `hsl(0 84% 60%)` - Red

### Dark Theme
- Primary: `hsl(217 91% 60%)` - Light Blue
- Success: `hsl(142 76% 36%)` - Green (same)
- Warning: `hsl(38 92% 50%)` - Orange (same)
- Destructive: `hsl(0 84% 60%)` - Red (same)

## Best Practices

### ✅ Do

- Use design tokens for all colors, spacing, and typography
- Use Button component variants
- Use LoadingState or Loader2 for loading indicators
- Use helper functions for status badges
- Use logger instead of console
- Use theme colors via CSS variables

### ❌ Don't

- Hardcode colors like `bg-black`, `bg-blue-600`
- Create custom spinners
- Use inline styles (except for dynamic user colors)
- Use console.log in production code
- Mix different loading state patterns

## Migration Guide

If you encounter old code patterns, update them:

```tsx
// ❌ Old
<Button className="bg-black hover:bg-gray-800">Submit</Button>
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
console.log('debug')

// ✅ New
<Button>Submit</Button>
<Loader2 className="h-8 w-8 animate-spin text-primary" />
logger.log('debug')
```

## Files Modified

This refactoring touched the following files:

1. **Created:**
   - `/lib/design-tokens.ts` - Design system constants
   - `/lib/logger.ts` - Development-only logger
   - `/components/ui/loading-spinner.tsx` - Unified spinner
   - `/DESIGN_SYSTEM.md` - This file

2. **Updated:**
   - `/app/globals.css` - Added tag color CSS variables
   - `/app/login/page.tsx` - Fixed colors, loading states
   - `/app/page.tsx` - Fixed colors, loading states
   - `/app/prompts/page.tsx` - Fixed status badges, logger
   - `/app/settings/page.tsx` - Fixed colors, inline styles, loading

## Questions?

If you have questions about the design system, check:
1. This document
2. `/lib/design-tokens.ts` for available constants
3. `/components/ui/` for component examples
