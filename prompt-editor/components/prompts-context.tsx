// components/prompts-context.tsx
"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface PromptsContextType {
  promptsCount: number
  setPromptsCount: (count: number) => void
}

const PromptsContext = createContext<PromptsContextType | undefined>(undefined)

export function PromptsProvider({ children }: { children: ReactNode }) {
  const [promptsCount, setPromptsCount] = useState(0)

  return (
    <PromptsContext.Provider value={{ promptsCount, setPromptsCount }}>
      {children}
    </PromptsContext.Provider>
  )
}

export function usePromptsContext() {
  const context = useContext(PromptsContext)
  if (context === undefined) {
    throw new Error('usePromptsContext must be used within a PromptsProvider')
  }
  return context
}