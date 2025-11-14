import { Transaction } from '../types/database';

interface CompletionWeights {
  critical: string[];
  important: string[];
  optional: string[];
}

const fieldWeights: CompletionWeights = {
  critical: [
    'name',
    'property_address',
    'side',
    'status',
    'sale_price',
    'estimated_close_date',
  ],
  important: [
    'city',
    'state',
    'zip',
    'listing_price',
    'commission_rate',
    'contract_accepted_date',
    'actual_close_date',
  ],
  optional: [
    'mls_number',
    'listing_date',
    'offer_received_date',
    'offer_accepted_date',
    'inspection_date',
    'inspection_period_end',
    'appraisal_ordered_date',
    'appraisal_received_date',
    'financing_contingency_deadline',
    'buyer_financing_approval',
    'possession_date',
    'move_out_date',
    'representation_agreement_signed',
    'listing_agreement_signed',
    'inspection_required',
    'notes',
  ],
};

export function calculateCompletionPercentage(transaction: Transaction): number {
  let totalWeight = 0;
  let completedWeight = 0;

  const criticalWeight = 3;
  const importantWeight = 2;
  const optionalWeight = 1;

  fieldWeights.critical.forEach((field) => {
    totalWeight += criticalWeight;
    const value = transaction[field as keyof Transaction];
    if (value !== null && value !== undefined && value !== '') {
      completedWeight += criticalWeight;
    }
  });

  fieldWeights.important.forEach((field) => {
    totalWeight += importantWeight;
    const value = transaction[field as keyof Transaction];
    if (value !== null && value !== undefined && value !== '') {
      completedWeight += importantWeight;
    }
  });

  fieldWeights.optional.forEach((field) => {
    totalWeight += optionalWeight;
    const value = transaction[field as keyof Transaction];
    if (value !== null && value !== undefined && value !== '') {
      completedWeight += optionalWeight;
    }
  });

  return Math.round((completedWeight / totalWeight) * 100);
}

export function calculateSectionCompletion(
  transaction: Transaction,
  section: 'property' | 'financial' | 'dates' | 'additional'
): number {
  const sectionFields: Record<string, string[]> = {
    property: ['property_address', 'city', 'state', 'zip', 'mls_number', 'side'],
    financial: ['listing_price', 'sale_price', 'commission_rate'],
    dates: [
      'representation_agreement_signed',
      'listing_agreement_signed',
      'listing_date',
      'offer_received_date',
      'offer_accepted_date',
      'contract_accepted_date',
      'inspection_date',
      'inspection_period_end',
      'appraisal_ordered_date',
      'appraisal_received_date',
      'financing_contingency_deadline',
      'buyer_financing_approval',
      'estimated_close_date',
      'actual_close_date',
      'possession_date',
      'move_out_date',
    ],
    additional: ['status', 'inspection_required', 'notes'],
  };

  const fields = sectionFields[section] || [];
  if (fields.length === 0) return 0;

  let completed = 0;
  fields.forEach((field) => {
    const value = transaction[field as keyof Transaction];
    if (value !== null && value !== undefined && value !== '') {
      completed++;
    }
  });

  return Math.round((completed / fields.length) * 100);
}

export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}
