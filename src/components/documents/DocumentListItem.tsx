import { FileText, Download, Trash2, Eye, EyeOff, FileSignature } from 'lucide-react';
import { useState } from 'react';
import { Document, BoldSignDocument, Transaction } from '../../types/database';
import { DocumentStatusBadge } from '../boldsign/DocumentStatusBadge';
import { SendDocumentModal } from '../boldsign/SendDocumentModal';

interface DocumentListItemProps {
  document: Document;
  boldSignDocument?: BoldSignDocument;
  transaction?: Transaction;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, current: boolean) => void;
}

export function DocumentListItem({
  document,
  boldSignDocument,
  transaction,
  isSelected,
  onSelect,
  onDelete,
  onToggleVisibility,
}: DocumentListItemProps) {
  const [showSendModal, setShowSendModal] = useState(false);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div
        className={`flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
          isSelected ? 'bg-blue-50 border-blue-300' : ''
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(document.id)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />

        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {document.name}
          </h3>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-gray-500 capitalize">
              {document.type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-gray-400">
              {formatFileSize(document.size_bytes)}
            </span>
            {transaction && (
              <span className="text-xs text-gray-500 truncate max-w-xs">
                {transaction.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {boldSignDocument && (
            <DocumentStatusBadge status={boldSignDocument.status} />
          )}

          {document.visible_to_client && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Eye className="w-3 h-3" />
              <span>Client</span>
            </div>
          )}

          <span className="text-xs text-gray-400 whitespace-nowrap">
            {formatDate(document.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!boldSignDocument && (
            <button
              onClick={() => setShowSendModal(true)}
              className="p-2 text-gray-400 hover:text-orange-600 rounded hover:bg-orange-50 transition-colors"
              title="Send for signature"
            >
              <FileSignature className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onToggleVisibility(document.id, document.visible_to_client)}
            className={`p-2 rounded transition-colors ${
              document.visible_to_client
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={document.visible_to_client ? 'Hide from client' : 'Show to client'}
          >
            {document.visible_to_client ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
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
            title="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSendModal && (
        <SendDocumentModal
          document={document}
          transactionId={document.transaction_id}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => setShowSendModal(false)}
        />
      )}
    </>
  );
}
