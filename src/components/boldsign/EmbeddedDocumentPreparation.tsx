import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Document } from '../../types/database';
import { createEmbeddedRequest } from '../../actions/boldsign';
import { supabase } from '../../lib/supabase';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';

interface Signer {
  email: string;
  firstName: string;
  lastName: string;
  signerOrder?: number;
}

interface EmbeddedDocumentPreparationProps {
  documents: Document[];
  signers: Signer[];
  transactionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmbeddedDocumentPreparation({
  documents,
  signers,
  transactionId,
  onClose,
  onSuccess,
}: EmbeddedDocumentPreparationProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embeddedUrl, setEmbeddedUrl] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (documents.length === 0 || signers.length === 0) {
      setError('Missing documents or signers');
      setLoading(false);
      return;
    }

    loadEmbeddedRequest();
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://app.boldsign.com') {
        return;
      }

      console.log('[EmbeddedDocumentPreparation] Received message:', event.data);

      switch (event.data.type) {
        case 'BoldSign.DocumentSent':
        case 'BoldSign.SendingComplete':
          console.log('[EmbeddedDocumentPreparation] Document sent successfully');
          handleDocumentSent(event.data);
          break;
        case 'BoldSign.DocumentCancelled':
        case 'BoldSign.Cancelled':
          console.log('[EmbeddedDocumentPreparation] Document cancelled');
          onClose();
          break;
        case 'BoldSign.Error':
          console.error('[EmbeddedDocumentPreparation] Error from iframe:', event.data);
          setError(event.data.message || 'An error occurred in the document editor');
          break;
        case 'BoldSign.ViewerReady':
          console.log('[EmbeddedDocumentPreparation] Viewer ready');
          setLoading(false);
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose, onSuccess]);

  const loadEmbeddedRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      const document = documents[0];

      if (!document.storage_path) {
        throw new Error('Document storage path is missing');
      }

      const fileExtension = document.name.toLowerCase().split('.').pop();
      if (fileExtension !== 'pdf') {
        throw new Error('BoldSign only supports PDF files for signature requests. Please convert your document to PDF first.');
      }

      console.log('[EmbeddedDocumentPreparation] Getting signed URL for:', document.storage_path);

      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.storage_path, 3600);

      if (urlError) {
        console.error('[EmbeddedDocumentPreparation] Error creating signed URL:', urlError);
        throw new Error(`Failed to access document: ${urlError.message}`);
      }

      if (!urlData?.signedUrl) {
        throw new Error('Failed to generate document access URL');
      }

      console.log('[EmbeddedDocumentPreparation] Signed URL created successfully');

      const result = await createEmbeddedRequest({
        documentUrl: urlData.signedUrl,
        name: document.name,
        title: `${document.name} - Signature Request`,
        signers: signers.map((s, index) => ({
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          signerOrder: s.signerOrder || index + 1,
        })),
        expiryDays: 7,
        showToolbar: true,
        showNavigationButtons: true,
        showSendButton: true,
        showPreviewButton: true,
        sendViewOption: 'PreparePage',
        showTooltip: true,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.sendUrl && !result.documentId) {
        throw new Error('No embedded URL returned from BoldSign');
      }

      setEmbeddedUrl(result.sendUrl);
      setDocumentId(result.documentId);
      setLoading(false);
    } catch (err: any) {
      console.error('[EmbeddedDocumentPreparation] Error:', err);
      setError(err.message || 'Failed to load document preparation interface');
      setLoading(false);
    }
  };

  const handleDocumentSent = async (data: any) => {
    try {
      if (documentId) {
        await supabase
          .from('bold_sign_documents')
          .insert({
            transaction_id: transactionId,
            agent_id: (await supabase.auth.getUser()).data.user?.id,
            document_id: documents[0].id,
            bold_sign_document_id: documentId,
            status: 'sent',
          });
      }

      onSuccess();
    } catch (err) {
      console.error('[EmbeddedDocumentPreparation] Error saving document:', err);
      onSuccess();
    }
  };

  const handleRetry = () => {
    setError(null);
    loadEmbeddedRequest();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Prepare Document for Signature</h2>
            <p className="text-sm text-slate-600 mt-1">
              Place signature fields, initials, dates, and other form fields on the document
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-slate-600">Loading document editor...</p>
              <p className="text-xs text-slate-500 mt-2">This may take a moment</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10 p-6">
              <div className="max-w-md w-full">
                <Alert variant="error">
                  <AlertCircle className="w-4 h-4" />
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Editor</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <div className="mt-4 flex gap-3">
                      <Button onClick={handleRetry} size="sm">
                        Try Again
                      </Button>
                      <Button onClick={onClose} variant="secondary" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Alert>
              </div>
            </div>
          )}

          {embeddedUrl && !error && (
            <iframe
              ref={iframeRef}
              src={embeddedUrl}
              className="w-full h-full border-0"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
              title="Document Preparation"
            />
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                {documents.length === 1
                  ? `Preparing: ${documents[0].name}`
                  : `Preparing ${documents.length} documents`}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {signers.length} signer{signers.length !== 1 ? 's' : ''} configured
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
