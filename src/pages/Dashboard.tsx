import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Link } from 'react-router-dom'
import { CreditCard, User, Calendar } from 'lucide-react'

export function Dashboard() {
  const { user } = useAuth()
  const { subscription, activePlan, isActive, loading } = useSubscription()

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium">Account</h3>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">Email</p>
              <p className="font-medium">{user?.email}</p>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium">Subscription</h3>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : activePlan ? (
                <div>
                  <p className="font-medium text-green-600 mb-1">
                    {activePlan}
                    {isActive && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>}
                  </p>
                  {subscription?.current_period_end && (
                    <p className="text-sm text-gray-600">
                      Renews: {formatDate(subscription.current_period_end)}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">No active subscription</p>
                  <Button asChild size="sm">
                    <Link to="/pricing">View Plans</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium">Quick Actions</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/pricing">View Pricing</Link>
              </Button>
              {!activePlan && (
                <Button asChild size="sm" className="w-full">
                  <Link to="/pricing">Get Started</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Details */}
        {subscription && activePlan && (
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-medium">Subscription Details</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium capitalize">{subscription.subscription_status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Period Start</p>
                  <p className="font-medium">{formatDate(subscription.current_period_start)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Period End</p>
                  <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
                </div>
                {subscription.payment_method_brand && subscription.payment_method_last4 && (
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">
                      {subscription.payment_method_brand.toUpperCase()} ****{subscription.payment_method_last4}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}