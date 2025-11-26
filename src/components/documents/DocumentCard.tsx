import { FileText, Download, Trash2, Eye, EyeOff, FileSignature, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { Document, BoldSignDocument, Transaction } from '../../types/database';
import { DocumentStatusBadge } from '../boldsign/DocumentStatusBadge';
import { SendDocumentModal } from '../boldsign/SendDocumentModal';
import { Card, CardContent } from '../ui/Card';

interface DocumentCardProps {
  document: Document;
  boldSignDocument?: BoldSignDocument;
  transaction?: Transaction;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, current: boolean) => void;
}

export function DocumentCard({
  document,
  boldSignDocument,
  transaction,
  isSelected,
  onSelect,
  onDelete,
  onToggleVisibility,
}: DocumentCardProps) {
  const [showActions, setShowActions] = useState(false);
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
    });
  };

  return (
    <>
      <Card
        className={`relative transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        <CardContent className="p-4">
          <div className="absolute top-4 left-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(document.id)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {!boldSignDocument && (
                  <button
                    onClick={() => {
                      setShowSendModal(true);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileSignature className="w-4 h-4" />
                    Send for Signature
                  </button>
                )}
                <button
                  onClick={() => {
                    onToggleVisibility(document.id, document.visible_to_client);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  {document.visible_to_client ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide from Client
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show to Client
                    </>
                  )}
                </button>
                <button
                  disabled
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 opacity-50 cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => {
                    onDelete(document.id);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center pt-8 pb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>

            <h3 className="text-sm font-medium text-gray-900 text-center mb-1 line-clamp-2">
              {document.name}
            </h3>

            <p className="text-xs text-gray-500 capitalize mb-2">
              {document.type.replace(/_/g, ' ')}
            </p>

            {boldSignDocument && (
              <div className="mb-2">
                <DocumentStatusBadge status={boldSignDocument.status} />
              </div>
            )}

            {transaction && (
              <p className="text-xs text-gray-500 text-center mb-2 line-clamp-1">
                {transaction.name}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{formatFileSize(document.size_bytes)}</span>
              <span>{formatDate(document.created_at)}</span>
            </div>

            {document.visible_to_client && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <Eye className="w-3 h-3" />
                <span>Visible to client</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showSendModal && (
        <SendDocumentModal
          documents={[document]}
          transactionId={document.transaction_id}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => setShowSendModal(false)}
        />
      )}
    </>
  );
}
