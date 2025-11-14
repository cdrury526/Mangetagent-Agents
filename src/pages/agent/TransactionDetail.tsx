import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../contexts/AuthContext';
import { AgentLayout } from '../../components/AgentLayout';
import { DetailsTab } from '../../components/transaction-detail/DetailsTab';
import { TasksTab } from '../../components/transaction-detail/TasksTab';
import { ContactsTab } from '../../components/transaction-detail/ContactsTab';
import { DocumentsTab } from '../../components/transaction-detail/DocumentsTab';

type TabType = 'details' | 'tasks' | 'contacts' | 'documents';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, loading, updateTransaction } = useTransactions(user?.id);
  const [activeTab, setActiveTab] = useState<TabType>('details');

  const transaction = transactions.find((t) => t.id === id);

  const handleUpdateTransaction = async (updates: Partial<typeof transaction>) => {
    if (!transaction) return;
    await updateTransaction(transaction.id, updates);
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-gray-500">Loading...</div>
        </div>
      </AgentLayout>
    );
  }

  if (!transaction) {
    return (
      <AgentLayout>
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="text-gray-500 mb-4">Transaction not found</div>
          <button
            onClick={() => navigate('/transactions')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Transactions
          </button>
        </div>
      </AgentLayout>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <AgentLayout>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/transactions')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Transactions
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">{transaction.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{transaction.property_address}</p>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <DetailsTab transaction={transaction} onUpdate={handleUpdateTransaction} />
            )}
            {activeTab === 'tasks' && <TasksTab transactionId={transaction.id} />}
            {activeTab === 'contacts' && <ContactsTab transactionId={transaction.id} />}
            {activeTab === 'documents' && <DocumentsTab transactionId={transaction.id} />}
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}
