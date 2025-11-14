import { useState } from 'react';
import { Plus, Trash2, Mail, Phone, Building, UserPlus } from 'lucide-react';
import { useTransactionContacts } from '../../hooks/useTransactionContacts';
import { useContacts } from '../../hooks/useContacts';
import { useAuth } from '../../contexts/AuthContext';
import { AddContactModal } from './AddContactModal';
import { NewContactModal } from './NewContactModal';

interface ContactsTabProps {
  transactionId: string;
}

export function ContactsTab({ transactionId }: ContactsTabProps) {
  const { user } = useAuth();
  const { transactionContacts, loading, removeContactFromTransaction, updateTransactionContact } =
    useTransactionContacts(transactionId);
  const { contacts: allContacts, refetch: refetchContacts } = useContacts(user?.id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);

  const handleRemoveContact = async (id: string) => {
    if (!confirm('Remove this contact from the transaction?')) return;
    try {
      await removeContactFromTransaction(id);
    } catch (err: any) {
      alert('Failed to remove contact: ' + err.message);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Loading contacts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Transaction Contacts</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              refetchContacts();
              setShowAddModal(true);
            }}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Existing
          </button>
          <button
            onClick={() => setShowNewContactModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create New
          </button>
        </div>
      </div>

      {showAddModal && (
        <AddContactModal
          transactionId={transactionId}
          allContacts={allContacts}
          existingContactIds={transactionContacts.map((tc) => tc.contact_id)}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showNewContactModal && (
        <NewContactModal
          transactionId={transactionId}
          onClose={() => setShowNewContactModal(false)}
          onSuccess={() => {
            refetchContacts();
          }}
        />
      )}

      {transactionContacts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No contacts added yet. Add contacts to this transaction to keep track of all parties involved.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transactionContacts.map((tc) => (
            <ContactCard
              key={tc.id}
              transactionContact={tc}
              onRemove={handleRemoveContact}
              onUpdateType={updateTransactionContact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ContactCardProps {
  transactionContact: any;
  onRemove: (id: string) => void;
  onUpdateType: (id: string, type: string) => Promise<void>;
}

function ContactCard({ transactionContact, onRemove, onUpdateType }: ContactCardProps) {
  const [isEditingType, setIsEditingType] = useState(false);
  const [selectedType, setSelectedType] = useState(transactionContact.contact_type);
  const contact = transactionContact.contact;

  const handleUpdateType = async () => {
    try {
      await onUpdateType(transactionContact.id, selectedType);
      setIsEditingType(false);
    } catch (err: any) {
      alert('Failed to update contact type: ' + err.message);
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
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-medium text-gray-900">
            {contact.first_name} {contact.last_name}
          </h4>
          {isEditingType ? (
            <div className="mt-2 flex items-center space-x-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-sm px-2 py-1 border border-gray-300 rounded"
              >
                {contactTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdateType}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingType(false)}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingType(true)}
              className="mt-1 text-sm text-gray-500 hover:text-gray-700 capitalize"
            >
              {transactionContact.contact_type.replace(/_/g, ' ')}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(transactionContact.id)}
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {contact.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2 text-gray-400" />
            <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
              {contact.email}
            </a>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
              {contact.phone}
            </a>
          </div>
        )}
        {(contact.company || contact.business_name) && (
          <div className="flex items-center text-sm text-gray-600">
            <Building className="w-4 h-4 mr-2 text-gray-400" />
            <span>{contact.company || contact.business_name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
