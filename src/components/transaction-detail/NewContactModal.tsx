import { useState } from 'react';
import { X } from 'lucide-react';
import { useContacts } from '../../hooks/useContacts';
import { useTransactionContacts } from '../../hooks/useTransactionContacts';
import { useAuth } from '../../hooks/useAuth';
import { ContactType } from '../../types/database';
import { AddressAutocomplete } from '../forms/AddressAutocomplete';
import { formatPhoneNumber } from '../../utils/phoneFormatter';

interface NewContactModalProps {
  transactionId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'lender', label: 'Lender' },
  { value: 'title_company', label: 'Title Company' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'appraiser', label: 'Appraiser' },
  { value: 'realtor', label: 'Realtor' },
  { value: 'other', label: 'Other' },
];

export function NewContactModal({ transactionId, onClose, onSuccess }: NewContactModalProps) {
  const { user } = useAuth();
  const { createContact } = useContacts(user?.id);
  const { addContactToTransaction } = useTransactionContacts(transactionId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [selectedContactType, setSelectedContactType] = useState<ContactType | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;

    if (!firstName || firstName.trim() === '') {
      setError('First Name is required');
      setSubmitting(false);
      return;
    }

    if (!lastName || lastName.trim() === '') {
      setError('Last Name is required');
      setSubmitting(false);
      return;
    }

    if (!selectedContactType) {
      setError('Contact Type is required');
      setSubmitting(false);
      return;
    }

    const cleanedPhone = phoneNumber.replace(/\D/g, '');

    const contactData = {
      agent_id: user!.id,
      type: selectedContactType as ContactType,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: formData.get('email') as string || null,
      phone: cleanedPhone || null,
      company: formData.get('company') as string || null,
      business_name: null,
      address_line_1: addressLine1 || null,
      address_line_2: formData.get('address_line_2') as string || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      favorite: false,
    };

    try {
      const newContact = await createContact(contactData);

      await addContactToTransaction(newContact.id, selectedContactType);

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to create contact');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Create New Contact</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
              <input
                type="text"
                name="first_name"
                required
                placeholder="John"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
              <input
                type="text"
                name="last_name"
                required
                placeholder="Doe"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contact Type *</label>
              <select
                name="type"
                required
                value={selectedContactType}
                onChange={(e) => setSelectedContactType(e.target.value as ContactType)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select type...</option>
                {CONTACT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="(555) 123-4567"
                maxLength={14}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {selectedContactType !== 'buyer' && selectedContactType !== 'seller' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                <input
                  type="text"
                  name="company"
                  placeholder="Acme Corp"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <AddressAutocomplete
                label="Address Line 1"
                value={addressLine1}
                onChange={setAddressLine1}
                onAddressSelect={(address) => {
                  setAddressLine1(address.streetAddress);
                  setCity(address.city);
                  setState(address.state);
                  setZip(address.zip);
                }}
                placeholder="123 Main Street"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Address Line 2</label>
              <input
                type="text"
                name="address_line_2"
                placeholder="Suite 100"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="San Francisco"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="CA"
                maxLength={2}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Zip Code</label>
              <input
                type="text"
                name="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="94102"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all"
            >
              {submitting ? 'Creating...' : 'Create & Add to Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
