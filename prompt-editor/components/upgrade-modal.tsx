"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useLocale } from "@/contexts/locale-context"

interface PricingPlan {
  plan_name: string
  price_display: string
  period_display: string
  features: string[]
}

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpgradeSuccess?: () => void
  forcedProvider?: 'yookassa' | 'lemonsqueezy' | null  // Force specific provider (from existing subscription)
}

export function UpgradeModal({ open, onOpenChange, onUpgradeSuccess, forcedProvider }: UpgradeModalProps) {
  const { t, locale } = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pricing, setPricing] = useState<{ free?: PricingPlan; pro?: PricingPlan }>({})
  const [pricingLoading, setPricingLoading] = useState(false)

  // Determine effective provider: forced > locale-based
  const effectiveProvider = forcedProvider || (locale === "ru" ? "yookassa" : "lemonsqueezy")
  // Determine effective locale for pricing display
  const effectiveLocale = forcedProvider === "yookassa" ? "ru" : forcedProvider === "lemonsqueezy" ? "en" : locale

  // Reset pricing when locale or forced provider changes
  useEffect(() => {
    setPricing({})
  }, [locale, forcedProvider])

  // Fetch pricing from API when modal opens
  useEffect(() => {
    if (open && !pricing.pro) {
      const fetchPricing = async () => {
        try {
          setPricingLoading(true)
          const response = await fetch(`${apiClient.getBaseUrl()}/pricing?locale=${effectiveLocale}`)
          if (response.ok) {
            const data = await response.json()
            const plans: { free?: PricingPlan; pro?: PricingPlan } = {}
            for (const plan of data.plans) {
              if (plan.plan_name === 'free') plans.free = plan
              if (plan.plan_name === 'pro') plans.pro = plan
            }
            setPricing(plans)
          }
        } catch (err) {
          console.error('Failed to fetch pricing:', err)
        } finally {
          setPricingLoading(false)
        }
      }
      fetchPricing()
    }
  }, [open, effectiveLocale, pricing.pro])

  const handleUpgrade = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use effective provider (forced or locale-based)
      if (effectiveProvider === "yookassa") {
        const result = await apiClient.upgradeToProYookassa(effectiveLocale)
        // Redirect to YooKassa payment page
        window.location.href = result.redirect_url
        return
      }

      // LemonSqueezy payment gateway (USD)
      const result = await apiClient.upgradeToProLemonSqueezy(effectiveLocale)
      // Redirect to LemonSqueezy checkout page
      window.location.href = result.redirect_url
    } catch (err: any) {
      setError(err.message || "Failed to initiate upgrade")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onOpenChange(false)
  }

  const freePlan = pricing.free
  const proPlan = pricing.pro

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {t("upgrade.title")}
          </DialogTitle>
          <DialogDescription>{t("upgrade.subtitle")}</DialogDescription>
        </DialogHeader>

        {pricingLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Plan Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Free Plan */}
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{t("upgrade.free")}</h3>
                  <Badge variant="outline" className="text-xs">
                    {t("upgrade.currentPlan")}
                  </Badge>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {freePlan?.features?.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  )) || (
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{t("upgrade.freeFeatures.prompts")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{t("upgrade.freeFeatures.apiCalls")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{t("upgrade.freeFeatures.analytics")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{t("upgrade.freeFeatures.workspaces")}</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Pro Plan */}
              <div className="border-2 border-blue-500 rounded-lg p-4 relative bg-blue-50/30">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Pro</Badge>
                </div>
                <div className="flex items-center justify-between mb-3 mt-1">
                  <h3 className="font-medium text-blue-700">{t("upgrade.pro")}</h3>
                  <span className="text-lg font-bold text-blue-600">
                    {proPlan?.price_display || (effectiveLocale === "ru" ? "1500₽" : "$19")}
                    <span className="text-sm font-normal text-slate-500">{proPlan?.period_display || t("upgrade.perMonth")}</span>
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {proPlan?.features?.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className={index === 0 ? "font-medium" : ""}>{feature}</span>
                    </li>
                  )) || (
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="font-medium">{t("upgrade.proFeatures.prompts")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{t("upgrade.proFeatures.apiCalls")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{t("upgrade.proFeatures.analytics")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{t("upgrade.proFeatures.workspaces")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{t("upgrade.proFeatures.collaboration")}</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                {t("upgrade.cancel")}
              </Button>
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("upgrade.processing")}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    {t("upgrade.upgradeNow")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
