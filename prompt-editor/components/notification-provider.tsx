"use client"

import React, { createContext, useContext, useRef, useState, useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react"

type Kind = "success" | "error" | "info" | "warning"

interface Notification {
  id: string
  message: string
  type: Kind
  duration: number
  count: number
  createdAt: number
}

interface ShowOptions {
  duration?: number
}

interface NotificationContextType {
  showNotification: (message: string, type?: Kind, options?: ShowOptions) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotification must be used within a NotificationProvider")
  return ctx
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Notification[]>([])
  const [mounted, setMounted] = useState(false)
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Fix hydration mismatch by only rendering portal after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const remove = (id: string) => {
    setList((prev) => prev.filter((n) => n.id !== id))
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
  }

  const armTimer = (n: Notification) => {
    const t = timers.current.get(n.id)
    if (t) clearTimeout(t)
    timers.current.set(
      n.id,
      setTimeout(() => remove(n.id), n.duration)
    )
  }

  const showNotification = (message: string, type: Kind = "info", options?: ShowOptions) => {
    const duration = Math.max(1600, Math.min(6000, options?.duration ?? 3000))
    const now = Date.now()

    setList((prev) => {
      // coalesce duplicates by (type + message)
      const idx = prev.findIndex((n) => n.message === message && n.type === type)
      if (idx !== -1) {
        const updated = [...prev]
        const existing = { ...updated[idx] }
        existing.count += 1
        existing.createdAt = now
        existing.duration = duration
        updated[idx] = existing
        // re-arm timer after state updates
        queueMicrotask(() => armTimer(existing))
        return updated
      }

      const n: Notification = {
        id: Math.random().toString(36).slice(2, 11),
        message,
        type,
        duration,
        count: 1,
        createdAt: now,
      }
      queueMicrotask(() => armTimer(n))
      return [...prev, n]
    })
  }

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t))
      timers.current.clear()
    }
  }, [])

  const iconByType: Record<Kind, ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
    error: <AlertCircle className="h-4 w-4 text-red-300" />,
    info: <Info className="h-4 w-4 text-sky-300" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-300" />,
  }

  const barByType: Record<Kind, string> = {
    success: "from-emerald-400 to-emerald-600",
    error: "from-red-400 to-red-600",
    info: "from-sky-400 to-sky-600",
    warning: "from-amber-400 to-amber-600",
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {mounted &&
        createPortal(
          <div
            className="fixed bottom-5 right-5 z-[10050] flex flex-col gap-2 pointer-events-none w-[min(92vw,360px)]"
            role="status"
            aria-live="polite"
          >
            {list.slice(-4).map((n) => (
              <ToastItem
                key={n.id + n.createdAt} // restart progress on coalesced bump
                n={n}
                icon={iconByType[n.type]}
                gradient={barByType[n.type]}
                onClose={() => remove(n.id)}
              />
            ))}
          </div>,
          document.body,
        )}
    </NotificationContext.Provider>
  )
}

function ToastItem({
  n,
  icon,
  gradient,
  onClose,
}: {
  n: Notification
  icon: ReactNode
  gradient: string
  onClose: () => void
}) {
  const [w, setW] = useState(100)

  useEffect(() => {
    // kick the progress animation
    const id = requestAnimationFrame(() => setW(0))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className={[
        "relative pointer-events-auto overflow-hidden",
        "rounded-2xl border border-white/10 bg-neutral-900/80 text-white",
        "shadow-xl backdrop-blur-xl",
        "px-3.5 py-2.5",
        "animate-in slide-in-from-top-2 fade-in duration-200",
        "transition-transform hover:-translate-y-0.5",
      ].join(" ")}
      role="alert"
    >
      {/* left gradient accent */}
      <span
        className={`absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b ${gradient}`}
        aria-hidden="true"
      />

      {/* close */}
      <button
        onClick={onClose}
        className="absolute right-2.5 top-2.5 rounded-md p-1 text-white/70 hover:text-white/95 hover:bg-white/10 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <span className="mt-0.5">{icon}</span>
        <div className="text-[13px] leading-5 break-words">
          {n.message}
          {n.count > 1 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-white/10 px-1.5 py-0.5 text-[11px]">
              ×{n.count}
            </span>
          )}
        </div>
      </div>

      {/* progress bar */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-white/40"
          style={{ width: `${w}%`, transition: `width ${n.duration}ms linear` }}
        />
      </div>
    </div>
  )
}