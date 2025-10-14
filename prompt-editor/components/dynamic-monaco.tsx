"use client"

import { lazy, Suspense, memo } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamic loading of Monaco Editor only when needed
const MonacoEditor = lazy(() => 
  import("@monaco-editor/react").then(module => ({
    default: module.default
  }))
)

interface DynamicMonacoProps {
  height?: string
  width?: string
  language?: string
  theme?: string
  value?: string
  onChange?: (value: string | undefined) => void
  onMount?: (editor: any, monaco: any) => void
  options?: any
  loading?: React.ReactNode
}

const MonacoLoading = () => (
  <div className="w-full h-full min-h-[400px] space-y-2">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-2/3" />
    <div className="space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  </div>
)

const DynamicMonaco = memo(function DynamicMonaco({
  loading = <MonacoLoading />,
  ...props
}: DynamicMonacoProps) {
  return (
    <Suspense fallback={loading}>
      <MonacoEditor {...props} />
    </Suspense>
  )
})

export default DynamicMonaco