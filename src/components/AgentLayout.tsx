import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  FileText,
  Users,
  FolderOpen,
  CheckSquare,
  FileSignature,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Coins,
} from 'lucide-react';

interface AgentLayoutProps {
  children: ReactNode;
}

export function AgentLayout({ children }: AgentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Transactions', href: '/transactions', icon: FileText },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Documents', href: '/documents', icon: FolderOpen },
    { name: 'E-Signatures', href: '/e-signatures', icon: FileSignature },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  ];

  const creditColor =
    user?.credit_balance && user.credit_balance > 100
      ? 'text-green-600'
      : user?.credit_balance && user.credit_balance > 20
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-2.5 shadow-lg">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  MagnetAgent
                </span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 space-y-3">
            <Link
              to="/subscription"
              className="flex items-center justify-between px-4 py-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-xs text-slate-600 font-medium">Plan</p>
                  <p className="text-sm font-bold text-slate-900 capitalize">{user?.subscription_plan}</p>
                </div>
              </div>
            </Link>

            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <Coins className={`w-5 h-5 ${creditColor}`} />
                <div>
                  <p className="text-xs text-amber-700 font-medium">Credits</p>
                  <p className={`text-sm font-bold ${creditColor}`}>{user?.credit_balance || 0}</p>
                </div>
              </div>
            </div>

            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-700 hover:bg-red-50 rounded-lg font-medium transition"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900 mr-4"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-600">{user?.broker_name}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        />
      )}
    </div>
  );
}
