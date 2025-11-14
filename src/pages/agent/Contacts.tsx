import { useState } from 'react';
import { AgentLayout } from '../../components/AgentLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useContacts } from '../../hooks/useContacts';
import { ContactType } from '../../types/database';
import { Plus, Search, Star, Mail, Phone, Building, X, AlertCircle, Trash2, Edit } from 'lucide-react';
import { AddressAutocomplete } from '../../components/forms/AddressAutocomplete';

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

export function Contacts() {
  const { user } = useAuth();
  const { contacts, loading, createContact, updateContact, deleteContact, toggleFavorite } = useContacts(user?.id);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ContactType | 'all'>('all');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const filtered = contacts.filter((contact) => {
    const matchType = filterType === 'all' || contact.type === filterType;
    const matchFavorite = !filterFavorites || contact.favorite;
    const matchSearch =
      contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchFavorite && matchSearch;
  });

  function openEditModal(contactId: string) {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setAddressLine1(contact.address_line_1 || '');
      setCity(contact.city || '');
      setState(contact.state || '');
      setZip(contact.zip || '');
    }
    setEditingContact(contactId);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingContact(null);
    setError('');
    setAddressLine1('');
    setCity('');
    setState('');
    setZip('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const contactData = {
      agent_id: user!.id,
      type: formData.get('type') as ContactType,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string || null,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      company: formData.get('company') as string || null,
      business_name: formData.get('business_name') as string || null,
      address_line_1: addressLine1 || null,
      address_line_2: formData.get('address_line_2') as string || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      favorite: false,
    };

    try {
      if (editingContact) {
        await updateContact(editingContact, contactData);
      } else {
        await createContact(contactData);
      }
      closeModal();
      form.reset();
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(id);
      } catch (err: any) {
        alert('Failed to delete contact: ' + err.message);
      }
    }
  }

  const typeColors: Record<ContactType, string> = {
    buyer: 'bg-blue-100 text-blue-700',
    seller: 'bg-green-100 text-green-700',
    lender: 'bg-purple-100 text-purple-700',
    title_company: 'bg-indigo-100 text-indigo-700',
    inspector: 'bg-yellow-100 text-yellow-700',
    appraiser: 'bg-orange-100 text-orange-700',
    realtor: 'bg-pink-100 text-pink-700',
    other: 'bg-slate-100 text-slate-700',
  };

  const editingContactData = editingContact ? contacts.find(c => c.id === editingContact) : null;

  return (
    <AgentLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>
            <p className="text-slate-600 mt-1">Manage your professional network</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Contact
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {CONTACT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={filterFavorites}
                onChange={(e) => setFilterFavorites(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-slate-700">Favorites Only</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-slate-600 mt-4">Loading contacts...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-900 font-medium mb-1">No contacts found</p>
              <p className="text-slate-600 text-sm">
                {searchTerm || filterType !== 'all' || filterFavorites
                  ? 'Try adjusting your filters'
                  : 'Add your first contact to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filtered.map((contact) => (
                <div
                  key={contact.id}
                  className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        <button
                          onClick={() => toggleFavorite(contact.id, contact.favorite)}
                          className="text-slate-400 hover:text-yellow-500 transition"
                        >
                          <Star
                            className={`w-4 h-4 ${contact.favorite ? 'fill-yellow-500 text-yellow-500' : ''}`}
                          />
                        </button>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${typeColors[contact.type]}`}
                      >
                        {contact.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {contact.company && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <Building className="w-4 h-4" />
                      {contact.company}
                    </div>
                  )}

                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600 truncate">
                        {contact.email}
                      </a>
                    </div>
                  )}

                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                        {contact.phone}
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => openEditModal(contact.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    defaultValue={editingContactData?.first_name}
                    placeholder="John"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    defaultValue={editingContactData?.last_name || ''}
                    placeholder="Doe"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contact Type *</label>
                  <select
                    name="type"
                    required
                    defaultValue={editingContactData?.type}
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
                    defaultValue={editingContactData?.email || ''}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingContactData?.phone || ''}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                  <input
                    type="text"
                    name="company"
                    defaultValue={editingContactData?.company || ''}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    name="business_name"
                    defaultValue={editingContactData?.business_name || ''}
                    placeholder="ABC Title Services"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

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
                    defaultValue={editingContactData?.address_line_2 || ''}
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
                  onClick={closeModal}
                  className="px-6 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Saving...' : editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AgentLayout>
  );
}
