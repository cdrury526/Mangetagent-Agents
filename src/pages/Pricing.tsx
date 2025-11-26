import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { stripeProducts } from '../stripe-config'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { supabase } from '../lib/supabase'
import { Check, CheckCircle2, Settings } from 'lucide-react'
import { openGeneralPortal } from '../utils/stripePortal'

export function Pricing() {
  const { user } = useAuth()
  const { subscription, isActive } = useSubscription()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleManageSubscription = async () => {
    if (!user) {
      setError('Please sign in to continue')
      return
    }

    setLoading('manage')
    setError('')

    try {
      await openGeneralPortal('/subscription')
    } catch (err: unknown) {
      setError(err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Something went wrong')
      setLoading(null)
    }
  }

  const handleCheckout = async (priceId: string, mode: 'payment' | 'subscription') => {
    if (!user) {
      setError('Please sign in to continue')
      return
    }

    setLoading(priceId)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Please sign in to continue')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/pricing`,
          mode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your real estate business
          </p>
        </div>

        {error && (
          <Alert type="error" className="mb-6" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {stripeProducts.map((product) => {
            const isCurrentPlan = product.mode === 'subscription' && subscription?.plan === 'pro' && isActive
            return (
            <Card key={product.id} className="relative">
              {product.mode === 'subscription' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                  {isCurrentPlan && (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {product.mode === 'subscription' && (
                    <span className="text-gray-600">/month</span>
                  )}
                </div>
                <p className="mt-4 text-gray-600">{product.description}</p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4 mb-8">
                  {product.mode === 'subscription' ? (
                    <>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <span>Monthly e-signature credits</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <span>Professional features</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <span>Priority support</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <span>One-time purchase</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <span>E-signature credits</span>
                      </div>
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <span>No recurring charges</span>
                      </div>
                    </>
                  )}
                </div>
                
                <Button
                  onClick={() => handleCheckout(product.priceId, product.mode)}
                  loading={loading === product.priceId}
                  disabled={isCurrentPlan}
                  className="w-full"
                  variant={product.mode === 'subscription' ? 'primary' : 'outline'}
                >
                  {isCurrentPlan ? 'Current Plan' : product.mode === 'subscription' ? 'Start Subscription' : 'Buy Now'}
                </Button>
              </CardContent>
            </Card>
            )
          })}
        </div>

        {isActive && subscription && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Active Subscription</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your subscription is active and will renew on {new Date(subscription.current_period_end!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleManageSubscription}
                loading={loading === 'manage'}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Manage Subscription
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}