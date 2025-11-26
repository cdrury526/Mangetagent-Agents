import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useTasks } from '../../hooks/useTasks';
import { useTransactionContacts } from '../../hooks/useTransactionContacts';
import { useDocuments } from '../../hooks/useDocuments';
import { useAuth } from '../../hooks/useAuth';
import { AgentLayout } from '../../components/AgentLayout';
import { DetailsTab } from '../../components/transaction-detail/DetailsTab';
import { TasksTab } from '../../components/transaction-detail/TasksTab';
import { ContactsTab } from '../../components/transaction-detail/ContactsTab';
import { DocumentsTab } from '../../components/transaction-detail/DocumentsTab';
import type { Transaction } from '../../types/database';

type TabType = 'details' | 'tasks' | 'contacts' | 'documents';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, loading, updateTransaction } = useTransactions(user?.id);
  
  // Fetch data for counts
  const { tasks } = useTasks(id);
  const { transactionContacts } = useTransactionContacts(id);
  const { documents } = useDocuments(id);

  const [activeTab, setActiveTab] = useState<TabType>('details');

  const transaction = transactions.find((t) => t.id === id);

  const handleUpdateTransaction = async (updates: Partial<Transaction>) => {
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

  // Calculate counts
  const uncompletedTasksCount = tasks.filter(t => !t.completed).length;
  const contactsCount = transactionContacts.length;
  const documentsCount = documents.length;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'details', label: 'Details' },
    { id: 'tasks', label: 'Tasks', count: uncompletedTasksCount },
    { id: 'contacts', label: 'Contacts', count: contactsCount },
    { id: 'documents', label: 'Documents', count: documentsCount },
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
            <nav className="flex justify-center -mb-px space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-all duration-200
                    ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.count !== undefined && (
                    <span className={`${
                      activeTab === tab.id 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                    } py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block mr-2`}>
                      {tab.count}
                    </span>
                  )}
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
