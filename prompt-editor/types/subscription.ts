/**
 * Subscription and payment related types
 */

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type TransactionType = 'subscription' | 'renewal' | 'upgrade' | 'refund'

export interface LimitsInfo {
  max_prompts: number
  max_api_requests_per_month: number
}

export type PaymentProvider = 'yookassa' | 'lemonsqueezy'

export interface SubscriptionResponse {
  id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  period_start?: string
  period_end?: string
  days_remaining: number
  auto_renew: boolean
  currency: string
  cancelled_at?: string
  is_active: boolean
  limits: LimitsInfo
  is_superuser?: boolean
  payment_provider?: PaymentProvider | null
}

export interface Transaction {
  id: string
  amount: number
  currency: string
  amount_display: string
  status: TransactionStatus
  transaction_type: TransactionType
  period_start?: string
  period_end?: string
  payment_method?: string
  created_at?: string
  completed_at?: string
}

export interface TransactionListResponse {
  transactions: Transaction[]
}

export interface UpgradeRequest {
  locale: string
}

export interface UpgradeResponse {
  transaction_id: string
  amount: number
  currency: string
  amount_display: string
  status: string
  message: string
}

export interface ActionResponse {
  success: boolean
  message: string
  period_end?: string
  requires_payment?: boolean
  payment_provider?: PaymentProvider | null
}

export interface CompleteTransactionRequest {
  payment_method?: string
  external_id?: string
}

export interface CompleteTransactionResponse {
  success: boolean
  message: string
  subscription: {
    plan: SubscriptionPlan
    status: SubscriptionStatus
    period_end?: string
  }
}

export interface YooKassaUpgradeResponse {
  transaction_id: string
  redirect_url: string
  amount: number
  currency: string
  amount_display: string
}

export interface LemonSqueezyUpgradeResponse {
  transaction_id: string
  redirect_url: string
  amount: number
  currency: string
  amount_display: string
}
