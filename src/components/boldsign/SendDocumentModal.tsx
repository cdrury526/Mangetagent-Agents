import { useState } from 'react';
import { X, Plus, Trash2, AlertCircle, Coins } from 'lucide-react';
import { FormInput } from '../forms/FormInput';
import { FormSelect } from '../forms/FormSelect';
import { Button } from '../ui/Button';
import { useTransactionContacts } from '../../hooks/useTransactionContacts';
import { sendDocumentForSignature } from '../../actions/boldsign';
import { supabase } from '../../lib/supabase';
import { Document } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

interface Signer {
  email: string;
  firstName: string;
  lastName: string;
  signerOrder?: number;
}

interface SendDocumentModalProps {
  document: Document;
  transactionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendDocumentModal({ document, transactionId, onClose, onSuccess }: SendDocumentModalProps) {
  const { user, refreshProfile } = useAuth();
  const { contacts } = useTransactionContacts(transactionId);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [subject, setSubject] = useState(`Please sign: ${document.name}`);
  const [message, setMessage] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CREDIT_COST_PER_DOCUMENT = 1;
  const hasEnoughCredits = (user?.credit_balance || 0) >= CREDIT_COST_PER_DOCUMENT;

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

  const updateSigner = (index: number, field: keyof Signer, value: any) => {
    const updated = [...signers];
    updated[index] = { ...updated[index], [field]: value };
    setSigners(updated);
  };

  const addContactAsSigner = (contactId: string) => {
    const contact = contacts.find(c => c.contact_id === contactId);
    if (!contact || !contact.contacts) return;

    setSigners([...signers, {
      firstName: contact.contacts.first_name,
      lastName: contact.contacts.last_name || '',
      email: contact.contacts.email || '',
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!hasEnoughCredits) {
        throw new Error(`Insufficient credits. You need ${CREDIT_COST_PER_DOCUMENT} credit(s) to send this document.`);
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

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(document.storage_path);

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expiryDays));

      const result = await sendDocumentForSignature({
        documentUrl: publicUrl,
        name: document.name,
        signers: signers.map((s, index) => ({
          ...s,
          signerOrder: index + 1,
        })),
        emailMessage: message,
        subject,
        expiryDays: parseInt(expiryDays),
      });

      if (!result || !result.documentId) {
        throw new Error('Failed to send document - no document ID returned');
      }

      await supabase
        .from('bold_sign_documents')
        .insert({
          transaction_id: transactionId,
          agent_id: user.id,
          document_id: document.id,
          bold_sign_document_id: result.documentId,
          status: 'sent',
          expires_at: expirationDate.toISOString(),
        });

      await supabase
        .from('profiles')
        .update({
          credit_balance: (user.credit_balance || 0) - CREDIT_COST_PER_DOCUMENT,
        })
        .eq('id', user.id);

      await refreshProfile();

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Send Document for Signature</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    ? `This will cost ${CREDIT_COST_PER_DOCUMENT} credit. You have ${user?.credit_balance || 0} credits available.`
                    : `You need ${CREDIT_COST_PER_DOCUMENT} credit to send this document, but you only have ${user?.credit_balance || 0} credits. Please purchase more credits to continue.`
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

              {contacts.length > 0 && (
                <div className="mb-4">
                  <FormSelect
                    label="Or add from transaction contacts"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addContactAsSigner(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select a contact...</option>
                    {contacts.map((tc) => (
                      <option key={tc.id} value={tc.contact_id}>
                        {tc.contacts?.first_name} {tc.contacts?.last_name} ({tc.contacts?.email})
                      </option>
                    ))}
                  </FormSelect>
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
                onChange={(e) => setExpiryDays(e.target.value)}
              >
                <option value="1">24 hours</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
              </FormSelect>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !hasEnoughCredits}>
                {loading ? 'Sending...' : 'Send for Signature'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
