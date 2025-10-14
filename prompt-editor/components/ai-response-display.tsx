"use client"

import { Loader2 } from "lucide-react"

interface AIResponseDisplayProps {
  isLoading: boolean
  response: string
}

export function AIResponseDisplay({ isLoading, response }: AIResponseDisplayProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border">
      <div className="text-xs font-semibold text-gray-700 mb-3">AI Response</div>
      <div className="bg-white rounded-lg p-3 border min-h-[200px] max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Generating response...
          </div>
        ) : response ? (
          <div className="text-sm text-gray-800 whitespace-pre-wrap">{response}</div>
        ) : (
          <div className="text-sm text-gray-500 italic">No response yet. Click "Run Test" to generate.</div>
        )}
      </div>
    </div>
  )
}
