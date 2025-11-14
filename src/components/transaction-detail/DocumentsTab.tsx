import { useState } from 'react';
import { Plus, FileText, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments';

interface DocumentsTabProps {
  transactionId: string;
}

export function DocumentsTab({ transactionId }: DocumentsTabProps) {
  const { documents, loading, deleteDocument, updateDocument } = useDocuments(transactionId);
  const [filter, setFilter] = useState<string>('all');

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

  const filteredDocuments =
    filter === 'all' ? documents : documents.filter((doc) => doc.type === filter);

  const documentTypes = [
    { value: 'all', label: 'All Documents' },
    { value: 'contract', label: 'Contracts' },
    { value: 'disclosure', label: 'Disclosures' },
    { value: 'inspection', label: 'Inspections' },
    { value: 'appraisal', label: 'Appraisals' },
    { value: 'financing', label: 'Financing' },
    { value: 'closing', label: 'Closing' },
    { value: 'other', label: 'Other' },
  ];

  if (loading) {
    return <div className="text-center text-gray-500">Loading documents...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Documents</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <button
          disabled
          className="flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          title="Document upload feature coming soon"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </button>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {filter === 'all'
            ? 'No documents yet. Upload documents to keep everything organized in one place.'
            : `No ${documentTypes.find((t) => t.value === filter)?.label.toLowerCase()} found.`}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <DocumentItem
              key={doc.id}
              document={doc}
              onDelete={handleDelete}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DocumentItemProps {
  document: any;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, currentValue: boolean) => void;
}

function DocumentItem({ document, onDelete, onToggleVisibility }: DocumentItemProps) {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{document.name}</h4>
          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
            <span className="capitalize">{document.type.replace(/_/g, ' ')}</span>
            <span>{formatFileSize(document.size_bytes)}</span>
            <span>Uploaded {formatDate(document.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={() => onToggleVisibility(document.id, document.visible_to_client)}
          className={`p-2 rounded transition-colors ${
            document.visible_to_client
              ? 'text-green-600 hover:bg-green-50'
              : 'text-gray-400 hover:bg-gray-100'
          }`}
          title={document.visible_to_client ? 'Visible to client' : 'Hidden from client'}
        >
          {document.visible_to_client ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          disabled
          className="p-2 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download feature coming soon"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(document.id)}
          className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
