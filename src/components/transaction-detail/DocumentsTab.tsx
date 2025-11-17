import { useState } from 'react';
import { Plus, FileText, Download, Trash2, Eye, EyeOff, FileSignature, ExternalLink, CheckSquare, Square, X, Edit3 } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments';
import { useBoldSignDocuments } from '../../hooks/useBoldSignDocuments';
import { SendDocumentModal } from '../boldsign/SendDocumentModal';
import { EmbeddedDocumentPreparation } from '../boldsign/EmbeddedDocumentPreparation';
import { DocumentStatusBadge } from '../boldsign/DocumentStatusBadge';
import { DocumentUploadModal } from '../documents/DocumentUploadModal';
import { Document } from '../../types/database';
import { supabase } from '../../lib/supabase';

interface DocumentsTabProps {
  transactionId: string;
}

export function DocumentsTab({ transactionId }: DocumentsTabProps) {
  const { documents, loading, deleteDocument, updateDocument, refetch } = useDocuments(transactionId);
  const { documents: boldSignDocs } = useBoldSignDocuments(transactionId);
  const [filter, setFilter] = useState<string>('all');
  const [selectedDocs, setSelectedDocs] = useState<Document[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [prepareSigners, setPrepareSigners] = useState<any[]>([]);

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
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">Documents</h3>
            {selectedDocs.length > 0 && (
              <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                {selectedDocs.length} selected
              </span>
            )}
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
        </div>

        {/* Action buttons on separate line */}
        <div className="flex items-center space-x-2">
          {selectedDocs.length > 0 && (
            <>
              <button
                onClick={() => {
                  setShowSendModal(true);
                }}
                className="group relative px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                title="Prepare & Send for Signature"
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-sm font-medium">Prepare & Send</span>
              </button>
              <button
                onClick={() => setSelectedDocs([])}
                className="group relative p-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                title="Clear Selection"
              >
                <X className="w-5 h-5" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Clear Selection
                </span>
              </button>
            </>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="group relative p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Upload Document"
          >
            <Plus className="w-5 h-5" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Upload Document
            </span>
          </button>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {filter === 'all'
            ? 'No documents yet. Upload documents to keep everything organized in one place.'
            : `No ${documentTypes.find((t) => t.value === filter)?.label.toLowerCase()} found.`}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => {
            const boldSignDoc = boldSignDocs.find(bsd => bsd.document_id === doc.id);
            const isSelected = selectedDocs.some(d => d.id === doc.id);
            return (
              <DocumentItem
                key={doc.id}
                document={doc}
                boldSignDoc={boldSignDoc}
                transactionId={transactionId}
                isSelected={isSelected}
                onSelect={(doc) => {
                  if (isSelected) {
                    setSelectedDocs(selectedDocs.filter(d => d.id !== doc.id));
                  } else {
                    setSelectedDocs([...selectedDocs, doc]);
                  }
                }}
                onDelete={handleDelete}
                onToggleVisibility={handleToggleVisibility}
                onSendForSignature={() => setSelectedDocs([doc])}
              />
            );
          })}
        </div>
      )}

      {showSendModal && selectedDocs.length > 0 && (
        <SendDocumentModal
          documents={selectedDocs}
          transactionId={transactionId}
          onClose={() => {
            setShowSendModal(false);
            setSelectedDocs([]);
          }}
          onSuccess={() => {
            setShowSendModal(false);
            setSelectedDocs([]);
            refetch();
            alert('Documents sent for signature successfully!');
          }}
          onPrepareDocument={(signers) => {
            setPrepareSigners(signers);
            setShowSendModal(false);
            setShowPrepareModal(true);
          }}
        />
      )}

      {showPrepareModal && selectedDocs.length > 0 && prepareSigners.length > 0 && (
        <EmbeddedDocumentPreparation
          documents={selectedDocs}
          signers={prepareSigners}
          transactionId={transactionId}
          onClose={() => {
            setShowPrepareModal(false);
            setSelectedDocs([]);
            setPrepareSigners([]);
          }}
          onSuccess={() => {
            setShowPrepareModal(false);
            setSelectedDocs([]);
            setPrepareSigners([]);
            refetch();
            alert('Documents sent for signature successfully!');
          }}
        />
      )}

      {showUploadModal && (
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          transactionId={transactionId}
          onUploadComplete={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

interface DocumentItemProps {
  document: any;
  boldSignDoc?: any;
  transactionId: string;
  isSelected: boolean;
  onSelect: (doc: any) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, currentValue: boolean) => void;
  onSendForSignature: () => void;
}

function DocumentItem({ document, boldSignDoc, transactionId, isSelected, onSelect, onDelete, onToggleVisibility, onSendForSignature }: DocumentItemProps) {
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

  const handlePreview = async () => {
    let storagePath = document.storage_path;

    if (storagePath.startsWith('documents/')) {
      storagePath = storagePath.substring('documents/'.length);
    }

    let { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600);

    if (error && document.storage_path.startsWith('documents/')) {
      const { data: retryData, error: retryError } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.storage_path, 3600);

      data = retryData;
      error = retryError;
    }

    if (error) {
      console.error('Failed to create signed URL:', error);
      alert('Failed to preview document. Please try again.');
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
    }`}>
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <button
          onClick={() => onSelect(document)}
          className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
        >
          {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
        </button>
        <div className="flex-shrink-0">
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{document.name}</h4>
          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
            <span className="capitalize">{document.type.replace(/_/g, ' ')}</span>
            <span>{formatFileSize(document.size_bytes)}</span>
            <span>Uploaded {formatDate(document.created_at)}</span>
            {boldSignDoc && (
              <DocumentStatusBadge status={boldSignDoc.status} />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        {!boldSignDoc && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendForSignature();
            }}
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
          title={document.visible_to_client ? 'Visible to client' : 'Hidden from client'}
        >
          {document.visible_to_client ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={handlePreview}
          className="p-2 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
          title="Preview document"
        >
          <ExternalLink className="w-4 h-4" />
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
