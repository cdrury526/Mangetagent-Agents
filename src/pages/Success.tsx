import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'

export function Success() {
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionIdParam = urlParams.get('session_id')
    if (sessionIdParam) {
      setSessionId(sessionIdParam)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Thank you for your purchase. Your payment has been processed successfully.
            </p>
            
            {sessionId && (
              <p className="text-sm text-gray-500">
                Session ID: {sessionId}
              </p>
            )}
            
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/">Go to Dashboard</Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link to="/pricing">View Plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}