export type UserRole = 'agent' | 'client';
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type TransactionStatus =
  | 'prospecting'
  | 'pending'
  | 'active'
  | 'under_contract'
  | 'inspection'
  | 'appraisal'
  | 'closing'
  | 'closed'
  | 'cancelled';
export type TransactionSide = 'buyer' | 'seller' | 'both';
export type ContactType =
  | 'buyer'
  | 'seller'
  | 'lender'
  | 'title_company'
  | 'inspector'
  | 'appraiser'
  | 'realtor'
  | 'other';
export type DocumentType =
  | 'contract'
  | 'disclosure'
  | 'inspection'
  | 'appraisal'
  | 'financing'
  | 'closing'
  | 'other';
export type ESignatureStatus =
  | 'draft'
  | 'sent'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'revoked';
export type TaskPhase =
  | 'pre_offer'
  | 'offer'
  | 'inspection'
  | 'appraisal'
  | 'financing'
  | 'closing'
  | 'post_closing';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
  phone: string | null;
  broker_name: string | null;
  broker_logo_url: string | null;
  broker_split_rate: number | null;
  subscription_plan: SubscriptionPlan;
  credit_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  agent_id: string;
  side: TransactionSide;
  status: TransactionStatus;
  name: string;
  property_address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  mls_number: string | null;
  listing_price: number | null;
  sale_price: number | null;
  commission_rate: number | null;
  estimated_close_date: string | null;
  actual_close_date: string | null;
  inspection_required: boolean;
  inspection_date: string | null;
  notes: string | null;
  representation_agreement_signed: string | null;
  offer_accepted_date: string | null;
  inspection_period_end: string | null;
  financing_contingency_deadline: string | null;
  appraisal_ordered_date: string | null;
  appraisal_received_date: string | null;
  possession_date: string | null;
  listing_agreement_signed: string | null;
  listing_date: string | null;
  offer_received_date: string | null;
  contract_accepted_date: string | null;
  buyer_financing_approval: string | null;
  move_out_date: string | null;
  section_last_updated: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  agent_id: string;
  type: ContactType;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  business_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  agent_id: string;
  transaction_id: string;
  name: string;
  type: DocumentType;
  size_bytes: number | null;
  mime_type: string | null;
  storage_path: string;
  visible_to_client: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  agent_id: string;
  transaction_id: string | null;
  parent_task_id: string | null;
  name: string;
  description: string | null;
  phase: TaskPhase | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface ParentTask extends Task {
  parent_task_id: null;
}

export interface Subtask extends Task {
  parent_task_id: string;
  due_date: null;
}

export interface TaskWithSubtasks extends ParentTask {
  subtasks?: Subtask[];
  subtaskCount?: number;
  completedSubtaskCount?: number;
  completionPercentage?: number;
}

export interface BoldSignDocument {
  id: string;
  transaction_id: string | null;
  agent_id: string;
  document_id: string | null;
  bold_sign_document_id: string;
  bold_sign_message_id: string | null;
  status: ESignatureStatus;
  signed_pdf_url: string | null;
  signed_pdf_storage_path: string | null;
  audit_trail_url: string | null;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionContact {
  id: string;
  transaction_id: string;
  contact_id: string;
  contact_type: ContactType;
  created_at: string;
  updated_at: string;
}
