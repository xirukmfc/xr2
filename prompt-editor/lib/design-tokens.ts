/**
 * Design Tokens - Unified styling system for xR2
 * Use these constants instead of hardcoded values for consistency
 */

// ============================================
// COLORS
// ============================================
export const colors = {
  // Status colors using theme variables
  status: {
    active: 'bg-success/10 text-success border-success/20',
    draft: 'bg-warning/10 text-warning border-warning/20',
    archived: 'bg-muted text-muted-foreground border-border',
  },

  // Status dots for indicators
  statusDot: {
    active: 'bg-success',
    draft: 'bg-warning',
    archived: 'bg-muted-foreground',
  },

  // Button variants
  button: {
    default: 'bg-slate-900 text-white hover:bg-slate-800', // Black by default
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90', // Blue for special actions
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
} as const

// ============================================
// SPACING
// ============================================
export const spacing = {
  // Standard header height and padding
  header: 'h-[65px] px-4 py-3',

  // Card padding variants
  card: {
    default: 'p-4',
    compact: 'px-4 py-3',
    large: 'p-6',
    xlarge: 'p-8',
  },

  // Page content padding
  page: {
    default: 'p-4',
    large: 'p-6',
  },
} as const

// ============================================
// TYPOGRAPHY
// ============================================
export const typography = {
  // Page titles
  pageTitle: 'text-2xl font-semibold',
  pageSubtitle: 'text-sm text-muted-foreground',

  // Section titles
  sectionTitle: 'text-lg font-semibold',
  sectionSubtitle: 'text-sm text-muted-foreground',

  // Card titles
  cardTitle: 'text-base font-semibold',
  cardDescription: 'text-sm text-muted-foreground',

  // Body text
  body: 'text-sm',
  bodySmall: 'text-xs',
  bodyLarge: 'text-base',

  // Labels
  label: 'text-sm font-medium',

  // Table text
  tableHeader: 'text-sm font-medium',
  tableCell: 'text-sm',
  tableCellSmall: 'text-xs',
} as const

// ============================================
// ICON SIZES
// ============================================
export const iconSize = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  default: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  sm: 'rounded-sm', // 2px
  default: 'rounded-md', // 6px
  md: 'rounded-md', // 6px
  lg: 'rounded-lg', // 8px (matches --radius)
  xl: 'rounded-xl', // 12px
  full: 'rounded-full', // circle
} as const

// ============================================
// ANIMATION DURATIONS
// ============================================
export const animation = {
  fast: 'duration-150',
  default: 'duration-200',
  slow: 'duration-300',
} as const

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status badge classes
 */
export function getStatusBadgeClasses(status: 'active' | 'draft' | 'archived'): string {
  return colors.status[status] || colors.status.draft
}

/**
 * Get status dot classes
 */
export function getStatusDotClasses(status: 'active' | 'draft' | 'archived'): string {
  return colors.statusDot[status] || colors.statusDot.draft
}

/**
 * Get icon size classes
 */
export function getIconSizeClasses(size: keyof typeof iconSize = 'default'): string {
  return iconSize[size]
}

/**
 * Get card padding classes
 */
export function getCardPaddingClasses(variant: keyof typeof spacing.card = 'default'): string {
  return spacing.card[variant]
}
