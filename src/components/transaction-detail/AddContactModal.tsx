import { useState } from 'react';
import { X } from 'lucide-react';
import { useTransactionContacts } from '../../hooks/useTransactionContacts';
import type { Contact } from '../../types/database';

interface AddContactModalProps {
  transactionId: string;
  allContacts: Contact[];
  existingContactIds: string[];
  onClose: () => void;
}

export function AddContactModal({
  transactionId,
  allContacts,
  existingContactIds,
  onClose,
}: AddContactModalProps) {
  const { addContactToTransaction } = useTransactionContacts(transactionId);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [contactType, setContactType] = useState('buyer');
  const [submitting, setSubmitting] = useState(false);

  const availableContacts = allContacts.filter((c) => !existingContactIds.includes(c.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) return;

    try {
      setSubmitting(true);
      await addContactToTransaction(selectedContactId, contactType);
      onClose();
    } catch (err: any) {
      alert('Failed to add contact: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const contactTypes = [
    'buyer',
    'seller',
    'lender',
    'title_company',
    'inspector',
    'appraiser',
    'realtor',
    'other',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Contact to Transaction</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {availableContacts.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              All your contacts have been added to this transaction.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Contact *
                </label>
                <select
                  required
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a contact...</option>
                  {availableContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                      {contact.company || contact.business_name
                        ? ` - ${contact.company || contact.business_name}`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Type *
                </label>
                <select
                  required
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {contactTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedContactId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Contact'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
