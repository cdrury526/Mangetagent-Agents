/**
 * Stripe MCP Server Type Definitions
 *
 * Types for Stripe payment API operations including:
 * - Customer management
 * - Payment Intents
 * - Subscriptions
 * - Invoices
 * - Webhook events
 * - Disputes and balance
 * - Development/debugging tools
 */

// =============================================================================
// Customer Types
// =============================================================================

export interface StripeCustomer {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  description: string | null;
  created: number;
  currency: string | null;
  defaultSource: string | null;
  invoicePrefix: string | null;
  livemode: boolean;
  metadata: Record<string, string>;
  delinquent: boolean;
  balance: number;
  address: StripeAddress | null;
  shipping: StripeShipping | null;
}

export interface StripeAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface StripeShipping {
  address: StripeAddress | null;
  name: string | null;
  phone: string | null;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    country: string | null;
    funding: string;
  };
  billingDetails: {
    address: StripeAddress | null;
    email: string | null;
    name: string | null;
    phone: string | null;
  };
}

// =============================================================================
// List Customers Types
// =============================================================================

export interface ListCustomersInput {
  /** Search by email */
  email?: string;
  /** Starting customer ID for pagination */
  startingAfter?: string;
  /** Ending customer ID for pagination */
  endingBefore?: string;
  /** Number of results (default: 10, max: 100) */
  limit?: number;
  /** Filter by creation date (Unix timestamp) */
  createdAfter?: number;
  /** Filter by creation date (Unix timestamp) */
  createdBefore?: number;
}

export interface ListCustomersOutput {
  customers: StripeCustomer[];
  hasMore: boolean;
  totalCount?: number;
}

// =============================================================================
// Get Customer Types
// =============================================================================

export interface GetCustomerInput {
  /** Stripe customer ID */
  customerId: string;
  /** Include payment methods */
  includePaymentMethods?: boolean;
  /** Include subscriptions */
  includeSubscriptions?: boolean;
}

export interface GetCustomerOutput {
  customer: StripeCustomer;
  paymentMethods?: StripePaymentMethod[];
  subscriptions?: StripeSubscription[];
  defaultPaymentMethod?: StripePaymentMethod | null;
}

// =============================================================================
// Payment Types
// =============================================================================

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export interface StripePaymentIntent {
  id: string;
  amount: number;
  amountCapturable: number;
  amountReceived: number;
  currency: string;
  status: PaymentIntentStatus;
  created: number;
  customerId: string | null;
  description: string | null;
  metadata: Record<string, string>;
  paymentMethodId: string | null;
  paymentMethodTypes: string[];
  receiptEmail: string | null;
  statementDescriptor: string | null;
  livemode: boolean;
  lastPaymentError?: {
    code: string;
    message: string;
    type: string;
    declineCode?: string;
  };
  charges?: Array<{
    id: string;
    amount: number;
    status: string;
    failureCode: string | null;
    failureMessage: string | null;
    outcome?: {
      networkStatus: string;
      reason: string | null;
      riskLevel: string;
      sellerMessage: string;
    };
  }>;
}

// =============================================================================
// List Payments Types
// =============================================================================

export interface ListPaymentsInput {
  /** Filter by customer ID */
  customerId?: string;
  /** Filter by status */
  status?: PaymentIntentStatus;
  /** Starting payment ID for pagination */
  startingAfter?: string;
  /** Ending payment ID for pagination */
  endingBefore?: string;
  /** Number of results (default: 10, max: 100) */
  limit?: number;
  /** Filter by creation date (Unix timestamp) */
  createdAfter?: number;
  /** Filter by creation date (Unix timestamp) */
  createdBefore?: number;
}

export interface ListPaymentsOutput {
  payments: StripePaymentIntent[];
  hasMore: boolean;
}

// =============================================================================
// Get Payment Types
// =============================================================================

export interface GetPaymentInput {
  /** Stripe PaymentIntent ID */
  paymentIntentId: string;
  /** Include charges and their details */
  includeCharges?: boolean;
}

export interface GetPaymentOutput {
  payment: StripePaymentIntent;
  timeline: Array<{
    event: string;
    timestamp: number;
    details?: string;
  }>;
}

// =============================================================================
// Subscription Types
// =============================================================================

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid';

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  created: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  endedAt: number | null;
  trialStart: number | null;
  trialEnd: number | null;
  metadata: Record<string, string>;
  items: Array<{
    id: string;
    priceId: string;
    productId: string;
    quantity: number;
    price: {
      unitAmount: number;
      currency: string;
      interval: string;
      intervalCount: number;
    };
  }>;
  defaultPaymentMethodId: string | null;
  latestInvoiceId: string | null;
  livemode: boolean;
}

// =============================================================================
// List Subscriptions Types
// =============================================================================

export interface ListSubscriptionsInput {
  /** Filter by customer ID */
  customerId?: string;
  /** Filter by status */
  status?: SubscriptionStatus | 'all';
  /** Starting subscription ID for pagination */
  startingAfter?: string;
  /** Ending subscription ID for pagination */
  endingBefore?: string;
  /** Number of results (default: 10, max: 100) */
  limit?: number;
  /** Filter by price ID */
  priceId?: string;
}

export interface ListSubscriptionsOutput {
  subscriptions: StripeSubscription[];
  hasMore: boolean;
}

// =============================================================================
// Get Subscription Types
// =============================================================================

export interface GetSubscriptionInput {
  /** Stripe subscription ID */
  subscriptionId: string;
  /** Include upcoming invoice preview */
  includeUpcomingInvoice?: boolean;
}

export interface GetSubscriptionOutput {
  subscription: StripeSubscription;
  upcomingInvoice?: StripeInvoice | null;
  billingHistory?: Array<{
    date: number;
    amount: number;
    status: string;
  }>;
}

// =============================================================================
// Invoice Types
// =============================================================================

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'uncollectible'
  | 'void';

export interface StripeInvoice {
  id: string;
  customerId: string;
  subscriptionId: string | null;
  status: InvoiceStatus;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  currency: string;
  created: number;
  dueDate: number | null;
  periodStart: number;
  periodEnd: number;
  attemptCount: number;
  attempted: boolean;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  number: string | null;
  paid: boolean;
  total: number;
  subtotal: number;
  tax: number | null;
  livemode: boolean;
  lines: Array<{
    id: string;
    description: string | null;
    amount: number;
    currency: string;
    quantity: number | null;
    priceId: string | null;
  }>;
}

// =============================================================================
// List Invoices Types
// =============================================================================

export interface ListInvoicesInput {
  /** Filter by customer ID */
  customerId?: string;
  /** Filter by subscription ID */
  subscriptionId?: string;
  /** Filter by status */
  status?: InvoiceStatus;
  /** Starting invoice ID for pagination */
  startingAfter?: string;
  /** Ending invoice ID for pagination */
  endingBefore?: string;
  /** Number of results (default: 10, max: 100) */
  limit?: number;
  /** Filter by creation date (Unix timestamp) */
  createdAfter?: number;
  /** Filter by creation date (Unix timestamp) */
  createdBefore?: number;
}

export interface ListInvoicesOutput {
  invoices: StripeInvoice[];
  hasMore: boolean;
}

// =============================================================================
// Webhook Event Types
// =============================================================================

export type StripeEventType =
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'invoice.upcoming'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'checkout.session.completed'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.refunded'
  | 'charge.dispute.created';

export interface StripeEvent {
  id: string;
  type: StripeEventType;
  created: number;
  livemode: boolean;
  apiVersion: string;
  request: {
    id: string | null;
    idempotencyKey: string | null;
  } | null;
  data: {
    object: Record<string, unknown>;
    previousAttributes?: Record<string, unknown>;
  };
}

export interface ListWebhookEventsInput {
  /** Filter by event type */
  type?: StripeEventType;
  /** Filter by creation date (Unix timestamp) */
  createdAfter?: number;
  /** Filter by creation date (Unix timestamp) */
  createdBefore?: number;
  /** Number of results (default: 10, max: 100) */
  limit?: number;
  /** Starting event ID for pagination */
  startingAfter?: string;
  /** Ending event ID for pagination */
  endingBefore?: string;
  /** Filter for delivery failures */
  deliverySuccess?: boolean;
}

export interface ListWebhookEventsOutput {
  events: StripeEvent[];
  hasMore: boolean;
  summary?: {
    total: number;
    byType: Record<string, number>;
  };
}

// =============================================================================
// Webhook Health Types
// =============================================================================

export interface WebhookHealthInput {
  /** Time period in hours to check (default: 24) */
  hours?: number;
}

export interface WebhookHealthOutput {
  status: 'healthy' | 'degraded' | 'unhealthy';
  period: {
    start: string;
    end: string;
    hours: number;
  };
  metrics: {
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
    successRate: number;
  };
  recentErrors: Array<{
    eventId: string;
    eventType: string;
    error: string;
    timestamp: string;
  }>;
  recommendations: string[];
}

// =============================================================================
// Balance Types
// =============================================================================

export interface StripeBalance {
  available: Array<{
    amount: number;
    currency: string;
    sourceTypes?: {
      card?: number;
      bankAccount?: number;
    };
  }>;
  pending: Array<{
    amount: number;
    currency: string;
    sourceTypes?: {
      card?: number;
      bankAccount?: number;
    };
  }>;
  livemode: boolean;
}

export interface GetBalanceInput {
  // No input required
}

export interface GetBalanceOutput {
  balance: StripeBalance;
  summary: {
    totalAvailable: number;
    totalPending: number;
    currency: string;
  };
}

// =============================================================================
// Dispute Types
// =============================================================================

export type DisputeStatus =
  | 'warning_needs_response'
  | 'warning_under_review'
  | 'warning_closed'
  | 'needs_response'
  | 'under_review'
  | 'charge_refunded'
  | 'won'
  | 'lost';

export type DisputeReason =
  | 'bank_cannot_process'
  | 'check_returned'
  | 'credit_not_processed'
  | 'customer_initiated'
  | 'debit_not_authorized'
  | 'duplicate'
  | 'fraudulent'
  | 'general'
  | 'incorrect_account_details'
  | 'insufficient_funds'
  | 'product_not_received'
  | 'product_unacceptable'
  | 'subscription_canceled'
  | 'unrecognized';

export interface StripeDispute {
  id: string;
  amount: number;
  currency: string;
  chargeId: string;
  paymentIntentId: string | null;
  status: DisputeStatus;
  reason: DisputeReason;
  created: number;
  evidenceDueBy: number | null;
  isChargeRefundable: boolean;
  livemode: boolean;
  metadata: Record<string, string>;
  evidence: {
    accessActivityLog: string | null;
    billingAddress: string | null;
    cancellationPolicy: string | null;
    customerCommunication: string | null;
    customerEmailAddress: string | null;
    customerName: string | null;
    customerPurchaseIp: string | null;
    customerSignature: string | null;
    duplicateChargeDocumentation: string | null;
    duplicateChargeExplanation: string | null;
    duplicateChargeId: string | null;
    productDescription: string | null;
    receipt: string | null;
    refundPolicy: string | null;
    refundPolicyDisclosure: string | null;
    refundRefusalExplanation: string | null;
    serviceDate: string | null;
    serviceDocumentation: string | null;
    shippingAddress: string | null;
    shippingCarrier: string | null;
    shippingDate: string | null;
    shippingDocumentation: string | null;
    shippingTrackingNumber: string | null;
    uncategorizedFile: string | null;
    uncategorizedText: string | null;
  };
}

export interface ListDisputesInput {
  /** Filter by charge ID */
  chargeId?: string;
  /** Filter by payment intent ID */
  paymentIntentId?: string;
  /** Starting dispute ID for pagination */
  startingAfter?: string;
  /** Ending dispute ID for pagination */
  endingBefore?: string;
  /** Number of results (default: 10, max: 100) */
  limit?: number;
  /** Filter by creation date (Unix timestamp) */
  createdAfter?: number;
  /** Filter by creation date (Unix timestamp) */
  createdBefore?: number;
}

export interface ListDisputesOutput {
  disputes: StripeDispute[];
  hasMore: boolean;
  summary?: {
    total: number;
    byStatus: Record<string, number>;
    byReason: Record<string, number>;
    totalAmount: number;
    currency: string;
  };
}

// =============================================================================
// Test Customer Types
// =============================================================================

export interface CreateTestCustomerInput {
  /** Customer email */
  email: string;
  /** Customer name */
  name?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
  /** Add test payment method */
  addTestPaymentMethod?: boolean;
}

export interface CreateTestCustomerOutput {
  customer: StripeCustomer;
  testPaymentMethod?: StripePaymentMethod;
  message: string;
}

// =============================================================================
// Config Status Types
// =============================================================================

export interface ConfigStatusOutput {
  stripeConfigured: boolean;
  supabaseConfigured: boolean;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  isTestMode: boolean;
  stripeApiVersion: string;
  webhookEndpoint: string;
}

// =============================================================================
// Product Types
// =============================================================================

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created: number;
  updated: number;
  defaultPriceId: string | null;
  images: string[];
  livemode: boolean;
  metadata: Record<string, string>;
  type: 'good' | 'service';
  unitLabel: string | null;
  url: string | null;
}

export interface ListProductsInput {
  /** Filter by active status */
  active?: boolean;
  /** Starting product ID for pagination */
  startingAfter?: string;
  /** Ending product ID for pagination */
  endingBefore?: string;
  /** Number of results (default: 10, max: 100) */
  limit?: number;
  /** Filter by creation date (Unix timestamp) */
  createdAfter?: number;
  /** Filter by creation date (Unix timestamp) */
  createdBefore?: number;
}

export interface ListProductsOutput {
  products: StripeProduct[];
  hasMore: boolean;
}

// =============================================================================
// Price Types
// =============================================================================

export type PriceType = 'one_time' | 'recurring';

export type PriceBillingScheme = 'per_unit' | 'tiered';

export type RecurringInterval = 'day' | 'week' | 'month' | 'year';

export interface StripePrice {
  id: string;
  productId: string;
  active: boolean;
  currency: string;
  type: PriceType;
  unitAmount: number | null;
  unitAmountDecimal: string | null;
  billingScheme: PriceBillingScheme;
  created: number;
  livemode: boolean;
  lookupKey: string | null;
  metadata: Record<string, string>;
  nickname: string | null;
  recurring: {
    interval: RecurringInterval;
    intervalCount: number;
    trialPeriodDays: number | null;
    usageType: 'licensed' | 'metered';
  } | null;
  taxBehavior: 'exclusive' | 'inclusive' | 'unspecified';
  tiersMode: 'graduated' | 'volume' | null;
  transformQuantity: {
    divideBy: number;
    round: 'up' | 'down';
  } | null;
}

export interface ListPricesInput {
  /** Filter by active status */
  active?: boolean;
  /** Filter by product ID */
  productId?: string;
  /** Filter by price type */
  type?: PriceType;
  /** Filter by currency */
  currency?: string;
  /** Starting price ID for pagination */
  startingAfter?: string;
  /** Ending price ID for pagination */
  endingBefore?: string;
  /** Number of results (default: 10, max: 100) */
  limit?: number;
  /** Filter by creation date (Unix timestamp) */
  createdAfter?: number;
  /** Filter by creation date (Unix timestamp) */
  createdBefore?: number;
}

export interface ListPricesOutput {
  prices: StripePrice[];
  hasMore: boolean;
}
