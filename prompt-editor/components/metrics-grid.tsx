"use client"

interface MetricsGridProps {
  metrics: {
    responseTime: string
    tokens: number
    cost: string
  }
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border">
      <div className="text-xs font-semibold text-gray-700 mb-3">Metrics</div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-2 border text-center">
          <div className="text-xs text-gray-500">Response Time</div>
          <div className="text-sm font-medium">{metrics.responseTime}</div>
        </div>
        <div className="bg-white rounded-lg p-2 border text-center">
          <div className="text-xs text-gray-500">Tokens</div>
          <div className="text-sm font-medium">{metrics.tokens || "—"}</div>
        </div>
        <div className="bg-white rounded-lg p-2 border text-center">
          <div className="text-xs text-gray-500">Cost</div>
          <div className="text-sm font-medium">{metrics.cost}</div>
        </div>
      </div>
    </div>
  )
}
