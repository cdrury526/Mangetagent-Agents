import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Transaction } from '../../types/database';

interface TransactionSelectorProps {
  value: string | null;
  onChange: (transactionId: string | null, transactionName?: string) => void;
  agentId: string;
}

export function TransactionSelector({ value, onChange, agentId }: TransactionSelectorProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [agentId]);

  async function fetchTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', agentId)
        .neq('status', 'closed')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  const selectedTransaction = value ? transactions.find((t) => t.id === value) : null;

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(searchLower) ||
      t.property_address.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (transaction: Transaction | null) => {
    if (transaction) {
      onChange(transaction.id, transaction.name);
    } else {
      onChange(null);
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Link to Transaction (Optional)
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors"
        >
          {selectedTransaction ? (
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedTransaction.name}</p>
                <p className="text-xs text-gray-500 truncate">{selectedTransaction.property_address}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(null);
                }}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-500">None - Personal Task</span>
          )}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-64">
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100"
                >
                  <p className="text-sm font-medium text-gray-900">None - Personal Task</p>
                  <p className="text-xs text-gray-500">Not linked to any transaction</p>
                </button>

                {loading ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading transactions...
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No transactions found
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <button
                      key={transaction.id}
                      type="button"
                      onClick={() => handleSelect(transaction)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                        value === transaction.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{transaction.name}</p>
                      <p className="text-xs text-gray-500">{transaction.property_address}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {transaction.status.replace(/_/g, ' ')} • {transaction.side}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-1">
        Link this task to a transaction or leave as a personal task
      </p>
    </div>
  );
}
