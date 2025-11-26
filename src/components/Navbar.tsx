import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { Button } from './ui/Button'
import { User, LogOut, CreditCard } from 'lucide-react'

export function Navbar() {
  const { user, signOut } = useAuth()
  const { activePlan, isActive } = useSubscription()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              MagnetAgent
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {activePlan && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      {activePlan}
                      {isActive && <span className="ml-1 text-green-600">●</span>}
                    </span>
                  </div>
                )}
                
                <Link to="/pricing">
                  <Button variant="outline" size="sm">
                    Pricing
                  </Button>
                </Link>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{user.email}</span>
                </div>
                
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}