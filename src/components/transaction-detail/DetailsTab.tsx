import { useState } from 'react';
import { Transaction, TransactionStatus, TransactionSide } from '../../types/database';
import { DollarSign, Calendar, Home, FileText, Edit2, Save, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FormInput } from '../forms/FormInput';
import { FormSelect } from '../forms/FormSelect';
import { FormTextarea } from '../forms/FormTextarea';
import { FormToggle } from '../forms/FormToggle';
import { AddressAutocomplete } from '../forms/AddressAutocomplete';
import { CurrencyInput } from '../forms/CurrencyInput';
import { DatePicker } from '../forms/DatePicker';
import { ProgressBar, SectionProgress } from '../ui/ProgressBar';
import { calculateCompletionPercentage, calculateSectionCompletion, formatRelativeTime } from '../../utils/transactionUtils';

interface DetailsTabProps {
  transaction: Transaction;
  onUpdate: (updates: Partial<Transaction>) => Promise<void>;
}

type EditSection = 'property' | 'financial' | 'dates' | 'additional' | null;

export function DetailsTab({ transaction, onUpdate }: DetailsTabProps) {
  const [editingSection, setEditingSection] = useState<EditSection>(null);
  const [formData, setFormData] = useState<Partial<Transaction>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const completionPercentage = calculateCompletionPercentage(transaction);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const startEditing = (section: EditSection) => {
    setEditingSection(section);
    const data = { ...transaction };

    if (section === 'financial') {
      if (data.commission_rate !== null && data.commission_rate !== undefined) {
        data.commission_rate = data.commission_rate * 100;
      }
    }

    setFormData(data);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setFormData({});
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updates = {
        ...formData,
        section_last_updated: {
          ...transaction.section_last_updated,
          [editingSection as string]: new Date().toISOString(),
        },
      };

      if (editingSection === 'financial') {
        if (updates.commission_rate !== null && updates.commission_rate !== undefined) {
          updates.commission_rate = updates.commission_rate / 100;
        }
      }

      await onUpdate(updates);
      setEditingSection(null);
      setFormData({});
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Transaction, value: string | number | boolean | null | undefined | Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return null;
    return `${(value * 100).toFixed(2)}%`;
  };

  const transactionSideOptions: { value: TransactionSide; label: string }[] = [
    { value: 'buyer', label: 'Buyer' },
    { value: 'seller', label: 'Seller' },
    { value: 'both', label: 'Both' },
  ];

  const transactionStatusOptions: { value: TransactionStatus; label: string }[] = [
    { value: 'prospecting', label: 'Prospecting' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'under_contract', label: 'Under Contract' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'appraisal', label: 'Appraisal' },
    { value: 'closing', label: 'Closing' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <ProgressBar percentage={completionPercentage} size="lg" />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error saving changes</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Section
            title="Property Information"
            icon={Home}
            isEditing={editingSection === 'property'}
            onEdit={() => startEditing('property')}
            onSave={handleSave}
            onCancel={cancelEditing}
            saving={saving}
            sectionKey="property"
            transaction={transaction}
            gradient="from-blue-50 to-cyan-50"
          >
            {editingSection === 'property' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <AddressAutocomplete
                    label="Property Address"
                    value={formData.property_address || ''}
                    onChange={(value) => updateField('property_address', value)}
                    onAddressSelect={(address) => {
                      updateField('property_address', address.streetAddress);
                      updateField('city', address.city);
                      updateField('state', address.state);
                      updateField('zip', address.zip);
                    }}
                    required
                    placeholder="Start typing property address..."
                  />
                </div>
                <FormInput
                  label="City"
                  value={formData.city || ''}
                  onChange={(e) => updateField('city', e.target.value)}
                />
                <FormInput
                  label="State"
                  value={formData.state || ''}
                  onChange={(e) => updateField('state', e.target.value)}
                  maxLength={2}
                  placeholder="e.g., CA"
                />
                <FormInput
                  label="ZIP Code"
                  value={formData.zip || ''}
                  onChange={(e) => updateField('zip', e.target.value)}
                  maxLength={10}
                />
                <FormInput
                  label="MLS Number"
                  value={formData.mls_number || ''}
                  onChange={(e) => updateField('mls_number', e.target.value)}
                />
                <FormSelect
                  label="Transaction Side"
                  value={formData.side || transaction.side}
                  onChange={(e) => updateField('side', e.target.value as TransactionSide)}
                  options={transactionSideOptions}
                  required
                />
              </div>
            ) : (
              <InfoGrid>
                <InfoItem label="Property Address" value={transaction.property_address} />
                <InfoItem label="City" value={transaction.city} />
                <InfoItem label="State" value={transaction.state} />
                <InfoItem label="ZIP Code" value={transaction.zip} />
                <InfoItem label="MLS Number" value={transaction.mls_number} />
                <InfoItem
                  label="Transaction Side"
                  value={transaction.side}
                  className="capitalize"
                />
              </InfoGrid>
            )}
          </Section>

          <Section
            title="Financial Details"
            icon={DollarSign}
            isEditing={editingSection === 'financial'}
            onEdit={() => startEditing('financial')}
            onSave={handleSave}
            onCancel={cancelEditing}
            saving={saving}
            sectionKey="financial"
            transaction={transaction}
            gradient="from-green-50 to-emerald-50"
          >
            {editingSection === 'financial' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyInput
                  label="Listing Price"
                  value={formData.listing_price ?? ''}
                  onChange={(value) => updateField('listing_price', value)}
                  placeholder="0"
                />
                <CurrencyInput
                  label="Sale Price"
                  value={formData.sale_price ?? ''}
                  onChange={(value) => updateField('sale_price', value)}
                  placeholder="0"
                />
                <FormInput
                  label="Commission Rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate ?? ''}
                  onChange={(e) =>
                    updateField('commission_rate', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  placeholder="0.00"
                />
              </div>
            ) : (
              <InfoGrid>
                <InfoItem label="Listing Price" value={formatCurrency(transaction.listing_price)} />
                <InfoItem label="Sale Price" value={formatCurrency(transaction.sale_price)} />
                <InfoItem label="Commission Rate" value={formatPercent(transaction.commission_rate)} />
              </InfoGrid>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section
            title="Important Dates"
            icon={Calendar}
            isEditing={editingSection === 'dates'}
            onEdit={() => startEditing('dates')}
            onSave={handleSave}
            onCancel={cancelEditing}
            saving={saving}
            sectionKey="dates"
            transaction={transaction}
            gradient="from-violet-50 to-fuchsia-50"
          >
            {editingSection === 'dates' ? (
              <div className="space-y-6">
                <DateGroup
                  title="Pre-Contract Dates"
                  groupId="pre-contract"
                  collapsed={collapsedGroups['pre-contract']}
                  onToggle={() => toggleGroup('pre-contract')}
                >
                  <DatePicker
                    label="Representation Agreement Signed"
                    value={formData.representation_agreement_signed || ''}
                    onChange={(value) => updateField('representation_agreement_signed', value || null)}
                  />
                  <DatePicker
                    label="Listing Agreement Signed"
                    value={formData.listing_agreement_signed || ''}
                    onChange={(value) => updateField('listing_agreement_signed', value || null)}
                  />
                  <DatePicker
                    label="Listing Date"
                    value={formData.listing_date || ''}
                    onChange={(value) => updateField('listing_date', value || null)}
                  />
                </DateGroup>

                <GradientDivider />

                <DateGroup
                  title="Contract Dates"
                  groupId="contract"
                  collapsed={collapsedGroups['contract']}
                  onToggle={() => toggleGroup('contract')}
                >
                  <DatePicker
                    label="Offer Received"
                    value={formData.offer_received_date || ''}
                    onChange={(value) => updateField('offer_received_date', value || null)}
                  />
                  <DatePicker
                    label="Offer Accepted"
                    value={formData.offer_accepted_date || ''}
                    onChange={(value) => updateField('offer_accepted_date', value || null)}
                  />
                  <DatePicker
                    label="Contract Accepted"
                    value={formData.contract_accepted_date || ''}
                    onChange={(value) => updateField('contract_accepted_date', value || null)}
                  />
                </DateGroup>

                <GradientDivider />

                <DateGroup
                  title="Inspection & Appraisal"
                  groupId="inspection"
                  collapsed={collapsedGroups['inspection']}
                  onToggle={() => toggleGroup('inspection')}
                >
                  <DatePicker
                    label="Inspection Date"
                    value={formData.inspection_date || ''}
                    onChange={(value) => updateField('inspection_date', value || null)}
                  />
                  <DatePicker
                    label="Inspection Period End"
                    value={formData.inspection_period_end || ''}
                    onChange={(value) => updateField('inspection_period_end', value || null)}
                  />
                  <DatePicker
                    label="Appraisal Ordered"
                    value={formData.appraisal_ordered_date || ''}
                    onChange={(value) => updateField('appraisal_ordered_date', value || null)}
                  />
                  <DatePicker
                    label="Appraisal Received"
                    value={formData.appraisal_received_date || ''}
                    onChange={(value) => updateField('appraisal_received_date', value || null)}
                  />
                </DateGroup>

                <GradientDivider />

                <DateGroup
                  title="Financing"
                  groupId="financing"
                  collapsed={collapsedGroups['financing']}
                  onToggle={() => toggleGroup('financing')}
                >
                  <DatePicker
                    label="Financing Contingency Deadline"
                    value={formData.financing_contingency_deadline || ''}
                    onChange={(value) => updateField('financing_contingency_deadline', value || null)}
                  />
                  <DatePicker
                    label="Buyer Financing Approval"
                    value={formData.buyer_financing_approval || ''}
                    onChange={(value) => updateField('buyer_financing_approval', value || null)}
                  />
                </DateGroup>

                <GradientDivider />

                <DateGroup
                  title="Closing & Possession"
                  groupId="closing"
                  collapsed={collapsedGroups['closing']}
                  onToggle={() => toggleGroup('closing')}
                >
                  <DatePicker
                    label="Estimated Close Date"
                    value={formData.estimated_close_date || ''}
                    onChange={(value) => updateField('estimated_close_date', value || null)}
                  />
                  <DatePicker
                    label="Actual Close Date"
                    value={formData.actual_close_date || ''}
                    onChange={(value) => updateField('actual_close_date', value || null)}
                  />
                  <DatePicker
                    label="Possession Date"
                    value={formData.possession_date || ''}
                    onChange={(value) => updateField('possession_date', value || null)}
                  />
                  <DatePicker
                    label="Move Out Date"
                    value={formData.move_out_date || ''}
                    onChange={(value) => updateField('move_out_date', value || null)}
                  />
                </DateGroup>
              </div>
            ) : (
              <div className="space-y-6">
                <DateGroup
                  title="Pre-Contract Dates"
                  groupId="pre-contract"
                  collapsed={collapsedGroups['pre-contract']}
                  onToggle={() => toggleGroup('pre-contract')}
                >
                  <InfoItem
                    label="Representation Agreement Signed"
                    value={formatDate(transaction.representation_agreement_signed)}
                  />
                  <InfoItem
                    label="Listing Agreement Signed"
                    value={formatDate(transaction.listing_agreement_signed)}
                  />
                  <InfoItem label="Listing Date" value={formatDate(transaction.listing_date)} />
                </DateGroup>

                <GradientDivider />

                <DateGroup
                  title="Contract Dates"
                  groupId="contract"
                  collapsed={collapsedGroups['contract']}
                  onToggle={() => toggleGroup('contract')}
                >
                  <InfoItem label="Offer Received" value={formatDate(transaction.offer_received_date)} />
                  <InfoItem label="Offer Accepted" value={formatDate(transaction.offer_accepted_date)} />
                  <InfoItem
                    label="Contract Accepted"
                    value={formatDate(transaction.contract_accepted_date)}
                  />
                </DateGroup>

                <GradientDivider />

                <DateGroup
                  title="Inspection & Appraisal"
                  groupId="inspection"
                  collapsed={collapsedGroups['inspection']}
                  onToggle={() => toggleGroup('inspection')}
                >
                  <InfoItem label="Inspection Date" value={formatDate(transaction.inspection_date)} />
                  <InfoItem
                    label="Inspection Period End"
                    value={formatDate(transaction.inspection_period_end)}
                  />
                  <InfoItem
                    label="Appraisal Ordered"
                    value={formatDate(transaction.appraisal_ordered_date)}
                  />
                  <InfoItem
                    label="Appraisal Received"
                    value={formatDate(transaction.appraisal_received_date)}
                  />
                </DateGroup>

                <GradientDivider />

                <DateGroup
                  title="Financing"
                  groupId="financing"
                  collapsed={collapsedGroups['financing']}
                  onToggle={() => toggleGroup('financing')}
                >
                  <InfoItem
                    label="Financing Contingency Deadline"
                    value={formatDate(transaction.financing_contingency_deadline)}
                  />
                  <InfoItem
                    label="Buyer Financing Approval"
                    value={formatDate(transaction.buyer_financing_approval)}
                  />
                </DateGroup>

                <GradientDivider />

                <DateGroup
                  title="Closing & Possession"
                  groupId="closing"
                  collapsed={collapsedGroups['closing']}
                  onToggle={() => toggleGroup('closing')}
                >
                  <InfoItem
                    label="Estimated Close Date"
                    value={formatDate(transaction.estimated_close_date)}
                  />
                  <InfoItem label="Actual Close Date" value={formatDate(transaction.actual_close_date)} />
                  <InfoItem label="Possession Date" value={formatDate(transaction.possession_date)} />
                  <InfoItem label="Move Out Date" value={formatDate(transaction.move_out_date)} />
                </DateGroup>
              </div>
            )}
          </Section>

          <Section
            title="Additional Information"
            icon={FileText}
            isEditing={editingSection === 'additional'}
            onEdit={() => startEditing('additional')}
            onSave={handleSave}
            onCancel={cancelEditing}
            saving={saving}
            sectionKey="additional"
            transaction={transaction}
            gradient="from-orange-50 to-amber-50"
          >
            {editingSection === 'additional' ? (
              <div className="space-y-4">
                <FormSelect
                  label="Status"
                  value={formData.status || transaction.status}
                  onChange={(e) => updateField('status', e.target.value as TransactionStatus)}
                  options={transactionStatusOptions}
                  required
                />
                <FormToggle
                  label="Inspection Required"
                  checked={formData.inspection_required ?? transaction.inspection_required}
                  onChange={(checked) => updateField('inspection_required', checked)}
                />
                <FormTextarea
                  label="Notes"
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value || null)}
                  rows={6}
                  showCharCount
                  placeholder="Add any additional notes or information about this transaction..."
                />
              </div>
            ) : (
              <div className="space-y-4">
                <InfoItem
                  label="Status"
                  value={
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status.replace(/_/g, ' ')}
                    </span>
                  }
                />
                <InfoItem
                  label="Inspection Required"
                  value={transaction.inspection_required ? 'Yes' : 'No'}
                  className="font-medium"
                />
                {transaction.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                      {transaction.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  saving,
  sectionKey,
  transaction,
  gradient,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  sectionKey: 'property' | 'financial' | 'dates' | 'additional';
  transaction: Transaction;
  gradient: string;
}) {
  const sectionCompletion = calculateSectionCompletion(transaction, sectionKey);
  const lastUpdated = transaction.section_last_updated?.[sectionKey];

  return (
    <div className={`border border-gray-200 rounded-lg p-6 bg-gradient-to-br ${gradient} hover:shadow-lg hover:scale-[1.01] transition-all duration-300 ease-out`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center flex-1">
          <Icon className="w-5 h-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <SectionProgress percentage={sectionCompletion} className="ml-4" />
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && !isEditing && (
            <span className="text-xs text-gray-500" title={new Date(lastUpdated).toLocaleString()}>
              {formatRelativeTime(lastUpdated)}
            </span>
          )}
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={onCancel}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function DateGroup({
  title,
  children,
  groupId,
  collapsed,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  groupId?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const isCollapsible = groupId && onToggle;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {isCollapsible && (
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
      )}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>;
}

function InfoItem({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string | null | undefined | React.ReactNode;
  className?: string;
}) {
  const isEmpty = !value || value === 'N/A';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      {typeof value === 'string' || value === null || value === undefined ? (
        <p className={`text-sm ${isEmpty ? 'text-gray-400 italic' : 'text-gray-900'} ${className}`}>
          {value || '—'}
        </p>
      ) : (
        <div className={className}>{value}</div>
      )}
    </div>
  );
}

function GradientDivider() {
  return (
    <div className="relative h-px my-4">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}

function getStatusColor(status: TransactionStatus): string {
  const colors: Record<TransactionStatus, string> = {
    prospecting: 'bg-gray-100 text-gray-800',
    pending: 'bg-blue-100 text-blue-800',
    active: 'bg-cyan-100 text-cyan-800',
    under_contract: 'bg-indigo-100 text-indigo-800',
    inspection: 'bg-yellow-100 text-yellow-800',
    appraisal: 'bg-violet-100 text-violet-800',
    closing: 'bg-teal-100 text-teal-800',
    closed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
