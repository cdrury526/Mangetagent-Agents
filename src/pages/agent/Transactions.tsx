import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentLayout } from '../../components/AgentLayout';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { TransactionStatus, TransactionSide } from '../../types/database';
import { Plus, Search, X, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS: { value: TransactionStatus; label: string }[] = [
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'appraisal', label: 'Appraisal' },
  { value: 'closing', label: 'Closing' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived', label: 'Archived' },
];

export function Transactions() {
  const { user } = useAuth();
  const { transactions, loading, createTransaction } = useTransactions(user?.id);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'all'>('all');
  const [filterSide, setFilterSide] = useState<TransactionSide | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filtered = transactions.filter((tx) => {
    // Hide archived transactions from 'All Statuses' view - only show when specifically filtered
    const matchStatus = filterStatus === 'all'
      ? tx.status !== 'archived'
      : tx.status === filterStatus;
    const matchSide = filterSide === 'all' || tx.side === filterSide;
    const matchSearch =
      tx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.property_address && tx.property_address.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchSide && matchSearch;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await createTransaction(
        {
          agent_id: user!.id,
          name: formData.get('name') as string,
          side: formData.get('side') as TransactionSide,
          status: 'prospecting',
          property_address: '',
          city: null,
          state: null,
          zip: null,
          mls_number: null,
          listing_price: null,
          commission_rate: null,
          estimated_close_date: null,
          inspection_required: false,
          notes: null,
          sale_price: null,
          actual_close_date: null,
          inspection_date: null,
          representation_agreement_signed: null,
          offer_accepted_date: null,
          inspection_period_end: null,
          financing_contingency_deadline: null,
          appraisal_ordered_date: null,
          appraisal_received_date: null,
          possession_date: null,
          listing_agreement_signed: null,
          listing_date: null,
          offer_received_date: null,
          contract_accepted_date: null,
          buyer_financing_approval: null,
          move_out_date: null,
          section_last_updated: null,
        },
        user!.subscription_plan
      );

      setShowModal(false);
      form.reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err) || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  }

  const statusColors: Record<TransactionStatus, string> = {
    prospecting: 'bg-slate-100 text-slate-700',
    pending: 'bg-blue-100 text-blue-700',
    active: 'bg-cyan-100 text-cyan-700',
    under_contract: 'bg-indigo-100 text-indigo-700',
    inspection: 'bg-yellow-100 text-yellow-700',
    appraisal: 'bg-purple-100 text-purple-700',
    closing: 'bg-green-100 text-green-700',
    closed: 'bg-slate-800 text-white',
    cancelled: 'bg-red-100 text-red-700',
    archived: 'bg-slate-200 text-slate-600',
  };

  const isFreeUser = user?.subscription_plan === 'free';
  const isAtLimit = isFreeUser && transactions.length >= 5;

  return (
    <AgentLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Transactions</h1>
            <p className="text-slate-600 mt-1">Manage all your real estate deals</p>
            {isFreeUser && (
              <p className="text-sm text-slate-500 mt-1">
                {transactions.length} of 5 lifetime transactions used
              </p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={isAtLimit}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            New Transaction
          </button>
        </div>

        {isAtLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800">Transaction Limit Reached</h3>
              <p className="text-sm text-amber-700 mt-1">
                You've reached the 5 transaction limit for free users. Upgrade to Pro for unlimited transactions.
              </p>
              <button
                onClick={() => navigate('/subscription')}
                className="mt-2 text-sm font-medium text-amber-800 hover:text-amber-900 underline"
              >
                View Pricing
              </button>
            </div>
          </div>
        )}

        {isFreeUser && !isAtLimit && transactions.length >= 3 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">Approaching Transaction Limit</h3>
              <p className="text-sm text-blue-700 mt-1">
                You have {5 - transactions.length} transaction{5 - transactions.length === 1 ? '' : 's'} remaining on the free plan. Upgrade to Pro for unlimited transactions.
              </p>
              <button
                onClick={() => navigate('/subscription')}
                className="mt-2 text-sm font-medium text-blue-800 hover:text-blue-900 underline"
              >
                View Pricing
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700 placeholder-slate-400 cursor-text"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TransactionStatus | 'all')}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value as TransactionSide | 'all')}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700 cursor-pointer"
            >
              <option value="all">All Sides</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-slate-600 mt-4">Loading transactions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-900 font-medium mb-1">No transactions found</p>
              <p className="text-slate-600 text-sm">
                {searchTerm || filterStatus !== 'all' || filterSide !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first transaction to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Property</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Side</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Price</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Close Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 cursor-pointer transition"
                      onClick={() => navigate(`/transactions/${tx.id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{tx.name}</p>
                        <p className="text-sm text-slate-600">{tx.property_address || 'No address set'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusColors[tx.status]}`}>
                          {tx.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-700">{tx.side}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {tx.sale_price
                          ? `$${(tx.sale_price / 1000).toFixed(0)}K`
                          : tx.listing_price
                            ? `$${(tx.listing_price / 1000).toFixed(0)}K`
                            : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {tx.estimated_close_date ? new Date(tx.estimated_close_date).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Create New Transaction</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., 123 Main St Purchase"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Give this transaction a descriptive name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="relative flex items-center justify-center px-4 py-3 border-2 border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                      <input
                        type="radio"
                        name="side"
                        value="buyer"
                        required
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-slate-700">Buyer</span>
                    </label>
                    <label className="relative flex items-center justify-center px-4 py-3 border-2 border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                      <input
                        type="radio"
                        name="side"
                        value="seller"
                        required
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-slate-700">Seller</span>
                    </label>
                    <label className="relative flex items-center justify-center px-4 py-3 border-2 border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                      <input
                        type="radio"
                        name="side"
                        value="both"
                        required
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-slate-700">Both</span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Are you representing the buyer, seller, or both?</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    You can add property details, dates, and other information after creating the transaction.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Creating...' : 'Create Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AgentLayout>
  );
}
