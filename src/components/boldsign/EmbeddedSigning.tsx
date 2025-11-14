import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { generateEmbeddedSigningLink } from '../../actions/boldsign';

interface EmbeddedSigningProps {
  boldSignDocumentId: string;
  signerEmail: string;
  onComplete?: (documentId: string) => void;
  onError?: (error: Error) => void;
}

export function EmbeddedSigning({
  boldSignDocumentId,
  signerEmail,
  onComplete,
  onError,
}: EmbeddedSigningProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    generateSigningUrl();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://app.boldsign.com') {
        return;
      }

      switch (event.data.type) {
        case 'BoldSign.SigningComplete':
          setCompleted(true);
          if (onComplete) {
            onComplete(boldSignDocumentId);
          }
          break;
        case 'BoldSign.SigningError':
          const errorMsg = 'An error occurred during signing';
          setError(errorMsg);
          if (onError) {
            onError(new Error(errorMsg));
          }
          break;
        case 'BoldSign.ViewerReady':
          setLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [boldSignDocumentId, signerEmail]);

  const generateSigningUrl = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await generateEmbeddedSigningLink({
        documentId: boldSignDocumentId,
        signerEmail,
        redirectUrl: window.location.origin + '/agent/transactions',
      });

      if (result.signingLink || result.embeddedSigningLink) {
        setSigningUrl(result.signingLink || result.embeddedSigningLink);
      } else {
        throw new Error('Failed to generate signing link');
      }
    } catch (err: any) {
      setError(err.message);
      if (onError) {
        onError(err);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setCompleted(false);
    generateSigningUrl();
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Document Signed Successfully!</h3>
        <p className="text-slate-600 text-center max-w-md">
          The document has been signed and will be available shortly.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Error Loading Signing Interface</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !signingUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600">Loading signing interface...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: '800px' }}>
      <iframe
        ref={iframeRef}
        src={signingUrl}
        className="w-full h-full border border-slate-200 rounded-lg"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        allow="clipboard-read; clipboard-write"
        title="Document Signing"
      />
    </div>
  );
}
