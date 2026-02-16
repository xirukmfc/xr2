const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

let sidebarCollapseListeners: ((collapsed: boolean) => void)[] = []

export function getStoredCollapseState(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
  return stored === 'true'
}

export function saveCollapseState(collapsed: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
}

export function notifyCollapseListeners(collapsed: boolean) {
  sidebarCollapseListeners.forEach(l => l(collapsed))
}

export function addCollapseListener(listener: (collapsed: boolean) => void) {
  sidebarCollapseListeners.push(listener)
  return () => {
    sidebarCollapseListeners = sidebarCollapseListeners.filter((l) => l !== listener)
  }
}

// Re-exported hook so client-layout can import it without pulling in the heavy Sidebar
import { useState, useEffect } from "react"

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    setIsCollapsed(getStoredCollapseState())

    const listener = (collapsed: boolean) => setIsCollapsed(collapsed)
    return addCollapseListener(listener)
  }, [])

  return isCollapsed
}
