"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MODEL_OPTIONS, type ModelId } from "@/lib/tokens"

interface ModelPickerProps {
  selected: ModelId[]
  onChange: (next: ModelId[]) => void
  max?: number
  buttonLabel?: string
  align?: "left" | "right"
}

export function ModelPicker({
  selected,
  onChange,
  max = 2,
  buttonLabel = "+ Models",
  align = "right",
}: ModelPickerProps) {
  const [open, setOpen] = useState(false)
  const popRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!popRef.current) return
      if (!(e.target instanceof Node)) return
      if (!popRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggleId = (id: ModelId) => {
    const isChecked = selected.includes(id)
    if (isChecked) {
      onChange(selected.filter((x) => x !== id) as ModelId[])
    } else if (selected.length < max) {
      onChange([...(selected as ModelId[]), id])
    }
  }

  return (
    <div className="relative" ref={popRef}>
      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setOpen((o) => !o)} title="Select models">
        {buttonLabel}
      </Button>
      {open && (
        <div
          className={[
            "absolute z-[1000] bottom-full mb-2 w-56 bg-white border border-slate-200 rounded shadow-lg p-2",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          <div className="text-[10px] text-slate-500 mb-2">Select up to {max}</div>
          {MODEL_OPTIONS.map((opt) => {
            const checked = selected.includes(opt.id)
            const disabled = !checked && selected.length >= max
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleId(opt.id)} />
                <span className="text-sm">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
