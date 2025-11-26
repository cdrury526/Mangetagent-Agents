import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { SubscriptionPlan } from '../types/database'
import { getErrorMessage } from '../utils/errorHandler';

interface Subscription {
  id: string
  agent_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
  plan: SubscriptionPlan
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  payment_method_brand?: string | null
  payment_method_last4?: string | null
  created_at: string
  updated_at: string
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('agent_id', user.id)
          .maybeSingle()

        if (error) {
          throw error
        }

        setSubscription(data)
      } catch (err: unknown) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const getActivePlan = () => {
    if (!subscription || !subscription.plan) {
      return null
    }

    // Map plan names to display names
    const planNames: Record<SubscriptionPlan, string> = {
      free: 'Free',
      pro: 'MagnetAgent Pro',
      enterprise: 'Enterprise'
    }

    return planNames[subscription.plan] || subscription.plan
  }

  const isActive = subscription?.status === 'active'

  return {
    subscription,
    loading,
    error,
    isActive,
    activePlan: getActivePlan(),
  }
}