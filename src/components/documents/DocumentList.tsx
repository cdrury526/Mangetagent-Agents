import { Document, BoldSignDocument, Transaction } from '../../types/database';
import { DocumentListItem } from './DocumentListItem';
import { useDocuments } from '../../hooks/useDocuments';

interface DocumentListProps {
  documents: Document[];
  boldSignDocuments: BoldSignDocument[];
  transactions: Transaction[];
  selectedDocuments: Set<string>;
  onSelectDocument: (id: string) => void;
  onSelectAll: () => void;
}

export function DocumentList({
  documents,
  boldSignDocuments,
  transactions,
  selectedDocuments,
  onSelectDocument,
  onSelectAll,
}: DocumentListProps) {
  const { deleteDocument, updateDocument } = useDocuments(undefined);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(id);
    } catch (err: any) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  const handleToggleVisibility = async (id: string, currentValue: boolean) => {
    try {
      await updateDocument(id, { visible_to_client: !currentValue });
    } catch (err: any) {
      alert('Failed to update document visibility: ' + err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          checked={selectedDocuments.size === documents.length && documents.length > 0}
          onChange={onSelectAll}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-600">
          Select all ({documents.length})
        </span>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => {
          const boldSignDoc = boldSignDocuments.find(bsd => bsd.document_id === doc.id);
          const transaction = transactions.find(t => t.id === doc.transaction_id);

          return (
            <DocumentListItem
              key={doc.id}
              document={doc}
              boldSignDocument={boldSignDoc}
              transaction={transaction}
              isSelected={selectedDocuments.has(doc.id)}
              onSelect={onSelectDocument}
              onDelete={handleDelete}
              onToggleVisibility={handleToggleVisibility}
            />
          );
        })}
      </div>
    </div>
  );
}
