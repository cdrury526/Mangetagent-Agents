import { Transaction, DocumentType, ESignatureStatus } from '../../types/database';

interface DocumentFiltersProps {
  selectedType: DocumentType | 'all';
  selectedTransaction: string;
  selectedStatus: ESignatureStatus | 'all' | 'none';
  transactions: Transaction[];
  onTypeChange: (type: DocumentType | 'all') => void;
  onTransactionChange: (transactionId: string) => void;
  onStatusChange: (status: ESignatureStatus | 'all' | 'none') => void;
}

export function DocumentFilters({
  selectedType,
  selectedTransaction,
  selectedStatus,
  transactions,
  onTypeChange,
  onTransactionChange,
  onStatusChange,
}: DocumentFiltersProps) {
  const documentTypes: Array<{ value: DocumentType | 'all'; label: string }> = [
    { value: 'all', label: 'All Types' },
    { value: 'contract', label: 'Contract' },
    { value: 'disclosure', label: 'Disclosure' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'appraisal', label: 'Appraisal' },
    { value: 'financing', label: 'Financing' },
    { value: 'closing', label: 'Closing' },
    { value: 'other', label: 'Other' },
  ];

  const signatureStatuses: Array<{ value: ESignatureStatus | 'all' | 'none'; label: string }> = [
    { value: 'all', label: 'All Statuses' },
    { value: 'none', label: 'No E-Signature' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'declined', label: 'Declined' },
    { value: 'expired', label: 'Expired' },
    { value: 'revoked', label: 'Revoked' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Document Type
        </label>
        <select
          id="type-filter"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as DocumentType | 'all')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          {documentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="transaction-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Transaction
        </label>
        <select
          id="transaction-filter"
          value={selectedTransaction}
          onChange={(e) => onTransactionChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">All Transactions</option>
          {transactions.map((transaction) => (
            <option key={transaction.id} value={transaction.id}>
              {transaction.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
          E-Signature Status
        </label>
        <select
          id="status-filter"
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as ESignatureStatus | 'all' | 'none')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          {signatureStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
