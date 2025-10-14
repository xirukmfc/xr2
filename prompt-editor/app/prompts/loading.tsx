import { LoadingSkeleton } from "@/components/ui/loading-state"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 pt-[12px] pb-[12px] h-[65px] bg-white border-b border-slate-200">
        <div className="h-10 bg-slate-200 rounded animate-pulse" />
      </div>
      <LoadingSkeleton rows={10} />
    </div>
  )
}