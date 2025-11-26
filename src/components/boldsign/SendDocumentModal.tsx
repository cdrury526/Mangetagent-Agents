import { useState } from 'react';
import { X, Plus, Trash2, AlertCircle, Coins, GripVertical, FileText } from 'lucide-react';
import { FormInput } from '../forms/FormInput';
import { FormSelect } from '../forms/FormSelect';
import { Button } from '../ui/Button';
import { useTransactionContacts } from '../../hooks/useTransactionContacts';
import { sendDocumentForSignature } from '../../actions/boldsign';
import { supabase } from '../../lib/supabase';
import { Document } from '../../types/database';
import { useAuth } from '../../hooks/useAuth';

interface Signer {
  email: string;
  firstName: string;
  lastName: string;
  signerOrder?: number;
}

interface SendDocumentModalProps {
  documents: Document[];
  transactionId: string;
  onClose: () => void;
  onSuccess: () => void;
  onPrepareDocument?: (signers: Signer[]) => void;
}

export function SendDocumentModal({ documents, transactionId, onClose, onSuccess, onPrepareDocument }: SendDocumentModalProps) {
  const { user, refreshProfile } = useAuth();
  const { transactionContacts } = useTransactionContacts(transactionId);
  const [orderedDocs, setOrderedDocs] = useState<Document[]>(documents);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [subject, setSubject] = useState(`Please sign: ${documents.length > 1 ? `${documents.length} documents` : documents[0].name}`);
  const [message, setMessage] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const CREDIT_COST_PER_DOCUMENT = 1;
  const totalCost = documents.length * CREDIT_COST_PER_DOCUMENT;
  const hasEnoughCredits = (user?.credit_balance || 0) >= totalCost;

  const addSigner = () => {
    setSigners([...signers, {
      email: '',
      firstName: '',
      lastName: '',
    }]);
  };

  const removeSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const updateSigner = (index: number, field: keyof Signer, value: string | number) => {
    const updated = [...signers];
    updated[index] = { ...updated[index], [field]: value };
    setSigners(updated);
  };

  const addContactAsSigner = (contactId: string) => {
    const transactionContact = transactionContacts.find(tc => tc.contact_id === contactId);
    if (!transactionContact || !transactionContact.contact) return;

    setSigners([...signers, {
      firstName: transactionContact.contact.first_name,
      lastName: transactionContact.contact.last_name || '',
      email: transactionContact.contact.email || '',
    }]);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newDocs = [...orderedDocs];
    const draggedDoc = newDocs[draggedIndex];
    newDocs.splice(draggedIndex, 1);
    newDocs.splice(index, 0, draggedDoc);
    setOrderedDocs(newDocs);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!hasEnoughCredits) {
        throw new Error(`Insufficient credits. You need ${totalCost} credit(s) to send ${orderedDocs.length} document(s).`);
      }

      if (signers.length === 0) {
        throw new Error('Please add at least one signer');
      }

      for (const signer of signers) {
        if (!signer.email || !signer.firstName) {
          throw new Error('All signers must have an email and first name');
        }
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expiryDays));

      // Process each document in order
      for (const doc of orderedDocs) {
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(doc.storage_path);

        const result = await sendDocumentForSignature({
          documentUrl: publicUrl,
          name: doc.name,
          signers: signers.map((s, index) => ({
            ...s,
            signerOrder: index + 1,
          })),
          emailMessage: message,
          subject: orderedDocs.length > 1 ? `${subject} - ${doc.name}` : subject,
          expiryDays: parseInt(expiryDays),
        });

        if (!result || !result.documentId) {
          throw new Error(`Failed to send document "${doc.name}" - no document ID returned`);
        }

        await supabase
          .from('bold_sign_documents')
          .insert({
            transaction_id: transactionId,
            agent_id: user.id,
            document_id: doc.id,
            bold_sign_document_id: result.documentId,
            status: 'sent',
            expires_at: expirationDate.toISOString(),
          });
      }

      await supabase
        .from('profiles')
        .update({
          credit_balance: (user.credit_balance || 0) - totalCost,
        })
        .eq('id', user.id);

      await refreshProfile();

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Send for Signature</h2>
            <p className="text-sm text-slate-600 mt-1">{orderedDocs.length} document{orderedDocs.length > 1 ? 's' : ''} selected</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {orderedDocs.length > 1 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-900 mb-3">Document Order</h3>
                <p className="text-xs text-slate-600 mb-3">Drag documents to reorder how they will be sent</p>
                <div className="space-y-2">
                  {orderedDocs.map((doc, index) => (
                    <div
                      key={doc.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center p-3 bg-white border rounded-lg cursor-move transition-all ${
                        draggedIndex === index ? 'opacity-50 scale-95' : 'hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <GripVertical className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                      <FileText className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.type}</p>
                      </div>
                      <span className="text-xs font-medium text-slate-500 ml-3">#{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orderedDocs.length === 1 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">{orderedDocs[0].name}</h3>
                    <p className="text-xs text-slate-600 mt-1">{orderedDocs[0].type}</p>
                  </div>
                </div>
              </div>
            )}

            <div className={`border rounded-lg p-4 flex items-start ${
              hasEnoughCredits ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
            }`}>
              <Coins className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${
                hasEnoughCredits ? 'text-blue-600' : 'text-red-600'
              }`} />
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${
                  hasEnoughCredits ? 'text-blue-800' : 'text-red-800'
                }`}>
                  {hasEnoughCredits ? 'Credit Check' : 'Insufficient Credits'}
                </h3>
                <p className={`text-sm mt-1 ${
                  hasEnoughCredits ? 'text-blue-700' : 'text-red-700'
                }`}>
                  {hasEnoughCredits
                    ? `This will cost ${totalCost} credit${totalCost > 1 ? 's' : ''}. You have ${user?.credit_balance || 0} credits available.`
                    : `You need ${totalCost} credit${totalCost > 1 ? 's' : ''} to send ${orderedDocs.length} document${orderedDocs.length > 1 ? 's' : ''}, but you only have ${user?.credit_balance || 0} credits. Please purchase more credits to continue.`
                  }
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            <div>
              <FormInput
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message to Signers
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a message for the signers..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Signers
                </label>
                <Button type="button" size="sm" onClick={addSigner}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Signer
                </Button>
              </div>

              {transactionContacts.length > 0 && (
                <div className="mb-4">
                  <FormSelect
                    label="Or add from transaction contacts"
                    value=""
                    options={[
                      { value: '', label: 'Select a contact...' },
                      ...transactionContacts.map((tc) => ({
                        value: tc.contact_id,
                        label: `${tc.contact?.first_name} ${tc.contact?.last_name} (${tc.contact?.email})`
                      }))
                    ]}
                    onChange={(e) => {
                      if (e.target.value) {
                        addContactAsSigner(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              )}

              <div className="space-y-4">
                {signers.map((signer, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Signer {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeSigner(index)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <FormInput
                        label="First Name"
                        value={signer.firstName}
                        onChange={(e) => updateSigner(index, 'firstName', e.target.value)}
                        required
                      />
                      <FormInput
                        label="Last Name"
                        value={signer.lastName}
                        onChange={(e) => updateSigner(index, 'lastName', e.target.value)}
                      />
                      <FormInput
                        label="Email"
                        type="email"
                        value={signer.email}
                        onChange={(e) => updateSigner(index, 'email', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <FormSelect
                label="Expiration"
                value={expiryDays}
                options={[
                  { value: '1', label: '24 hours' },
                  { value: '3', label: '3 days' },
                  { value: '7', label: '7 days' },
                  { value: '30', label: '30 days' }
                ]}
                onChange={(e) => setExpiryDays(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center gap-3 pt-4">
              <div className="flex-1">
                {onPrepareDocument && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (signers.length === 0) {
                        setError('Please add at least one signer before preparing the document');
                        return;
                      }
                      for (const signer of signers) {
                        if (!signer.email || !signer.firstName) {
                          setError('All signers must have an email and first name');
                          return;
                        }
                      }
                      onPrepareDocument(signers);
                    }}
                    disabled={signers.length === 0}
                  >
                    Prepare Document
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !hasEnoughCredits}>
                  {loading ? 'Sending...' : 'Quick Send'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
