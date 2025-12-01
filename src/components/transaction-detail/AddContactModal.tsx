import { useState } from 'react';
import { useTransactionContacts } from '../../hooks/useTransactionContacts';
import type { Contact } from '../../types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
    } catch (err: unknown) {
      alert('Failed to add contact: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const contactTypes = [
    { value: 'buyer', label: 'Buyer' },
    { value: 'seller', label: 'Seller' },
    { value: 'lender', label: 'Lender' },
    { value: 'title_company', label: 'Title Company' },
    { value: 'inspector', label: 'Inspector' },
    { value: 'appraiser', label: 'Appraiser' },
    { value: 'realtor', label: 'Realtor' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact to Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter>
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
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
