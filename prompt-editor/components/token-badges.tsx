// components/token-badges.tsx
"use client"

import { useEffect, useState } from "react";
import { tokenCounter, modelLabel, type ModelId } from "@/lib/tokens";

interface TokenBadgesProps {
  systemText: string
  userText: string
  assistantText: string
  models: ModelId[]
  className?: string
}

type Totals = Record<ModelId, number>;

export function TokenBadges({ systemText, userText, assistantText, models, className }: TokenBadgesProps) {
  const safeModels = models || [];

  // State for token counts
  const [tokens, setTokens] = useState<{
    estimated: Totals;
    precise?: Totals;
  }>({ estimated: {} });

  useEffect(() => {
    const updateTokens = async () => {
      try {
        // Use the smart tokenization approach
        const { quick, precise } = await tokenCounter.estimateSmart(
          systemText || "",
          userText || "",
          assistantText || "",
          safeModels
        );

        // Show quick estimates immediately
        setTokens({ estimated: quick });

        // Update with precise values when they arrive
        precise.then(preciseTokens => {
          setTokens(prev => ({ ...prev, precise: preciseTokens }));
        }).catch(error => {
          console.warn("Precise tokenization failed:", error);
          // Keep showing estimated values on error
        });
      } catch (error) {
        console.error("Token estimation failed:", error);
      }
    };

    // Only update if we have models and text
    if (safeModels.length > 0) {
      updateTokens();
    } else {
      setTokens({ estimated: {} });
    }
  }, [systemText, userText, assistantText, safeModels.join("|")]);

  return (
    <div className={["flex items-center gap-2", className || ""].join(" ")}>
      <span className="text-slate-500 text-xs">Tokens:</span>
      {safeModels.map((id) => {
        const preciseCount = tokens.precise?.[id];
        const estimatedCount = tokens.estimated[id] ?? 0;
        const displayed = preciseCount ?? estimatedCount;
        const isEstimated = preciseCount == null;

        return (
          <span
            key={id}
            className="px-2 py-1 bg-slate-100 rounded text-xs"
            title={isEstimated ? "Quick estimate (~)" : "Precise count"}
          >
            {modelLabel(id)}:{" "}
            <span className="font-medium">
              {isEstimated && "~"}{displayed.toLocaleString()}
            </span>
          </span>
        );
      })}
    </div>
  );
}
