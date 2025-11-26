import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AgentLayout } from '../../components/AgentLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Transaction } from '../../types/database';
import {
  TrendingUp,
  CheckCircle,
  DollarSign,
  Plus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    totalValue: 0,
    estimatedCommission: 0,
    pendingTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // fetchData is intentionally excluded - it's stable and including it would cause infinite loops

  async function fetchData() {
    try {
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', user!.id)
        .neq('status', 'closed')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(5);

      setTransactions(txData || []);

      const activeCount = txData?.length || 0;
      const totalValue = txData?.reduce((sum, t) => sum + (t.sale_price || t.listing_price || 0), 0) || 0;
      const commission =
        txData?.reduce((sum, t) => {
          const price = t.sale_price || t.listing_price || 0;
          const rate = t.commission_rate || 0;
          return sum + price * rate;
        }, 0) || 0;

      setStats({
        active: activeCount,
        totalValue,
        estimatedCommission: commission,
        pendingTasks: 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: 'Active Transactions',
      value: stats.active,
      icon: TrendingUp,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
    },
    {
      label: 'Total Deal Value',
      value: `$${(stats.totalValue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: 'from-green-600 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
    },
    {
      label: 'Est. Commission',
      value: `$${(stats.estimatedCommission / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      color: 'from-purple-600 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
    },
    {
      label: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: CheckCircle,
      color: 'from-orange-600 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
    },
  ];

  const statusColors: Record<string, string> = {
    prospecting: 'bg-slate-100 text-slate-700',
    under_contract: 'bg-blue-100 text-blue-700',
    in_inspection: 'bg-yellow-100 text-yellow-700',
    under_appraisal: 'bg-purple-100 text-purple-700',
    financing: 'bg-indigo-100 text-indigo-700',
    final_walkthrough: 'bg-green-100 text-green-700',
    closing: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <AgentLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.name}!</h1>
          <p className="text-slate-600 mt-1">Here's what's happening with your transactions today.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.bgColor} border border-slate-200 p-4 transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${card.color} shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/transactions"
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" />
              <div>
                <p className="font-semibold">New Transaction</p>
                <p className="text-blue-100 text-xs mt-0.5">Create a new deal</p>
              </div>
            </div>
          </Link>

          <Link
            to="/contacts"
            className="group relative overflow-hidden bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 transition-all hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-semibold text-slate-900">Add Contact</p>
                <p className="text-slate-600 text-xs mt-0.5">Build your network</p>
              </div>
            </div>
          </Link>

          <Link
            to="/documents"
            className="group relative overflow-hidden bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 transition-all hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-semibold text-slate-900">Upload Document</p>
                <p className="text-slate-600 text-xs mt-0.5">Manage files</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-sm text-slate-600 mt-1">Your latest active deals</p>
            </div>
            <Link
              to="/transactions"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="text-slate-600 mt-4">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-900 font-medium mb-1">No transactions yet</p>
                <p className="text-slate-600 text-sm mb-4">Create your first transaction to get started</p>
                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  New Transaction
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Property</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Price</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Close Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <Link to={`/transactions/${tx.id}`} className="block">
                          <p className="font-medium text-slate-900 hover:text-blue-600">{tx.name}</p>
                          <p className="text-sm text-slate-600">{tx.property_address}</p>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[tx.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tx.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {tx.sale_price
                          ? `$${(tx.sale_price / 1000).toFixed(0)}K`
                          : tx.listing_price
                            ? `$${(tx.listing_price / 1000).toFixed(0)}K`
                            : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {tx.estimated_close_date
                          ? new Date(tx.estimated_close_date).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}
