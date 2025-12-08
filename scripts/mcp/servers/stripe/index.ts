/**
 * Stripe MCP Server
 *
 * 15 API-based tools for Stripe payment integration:
 *
 * Customer Management (2 tools):
 * - list-customers: List/search customers with pagination and filtering
 * - get-customer: Get customer details with payment methods and subscriptions
 *
 * Payment Management (2 tools):
 * - list-payments: List PaymentIntents with filters
 * - get-payment: Get PaymentIntent details with charge timeline
 *
 * Subscription Management (2 tools):
 * - list-subscriptions: List subscriptions with status filter
 * - get-subscription: Get subscription details with billing history
 *
 * Product & Pricing (2 tools):
 * - list-products: List products (subscription plans, one-time purchases)
 * - list-prices: List prices with filters for product, type, currency
 *
 * Invoice Management (1 tool):
 * - list-invoices: List invoices for customer/subscription
 *
 * Webhook & Debugging (2 tools):
 * - list-webhook-events: Query Stripe events for debugging
 * - webhook-health: Check webhook processing health
 *
 * Financial Tools (2 tools):
 * - get-balance: Get Stripe account balance
 * - list-disputes: List payment disputes (chargebacks)
 *
 * Testing Tools (2 tools):
 * - create-test-customer: Create test customer in test mode
 * - get-config-status: Check Stripe API configuration
 */

import { MCPServerManifest } from '../../types/index.js';

// Export configuration
export {
  STRIPE_CONFIG,
  SUPABASE_CONFIG,
  WEBHOOK_CONFIG,
  callStripeAPI,
  buildFormData,
  buildQueryString,
  callEdgeFunction,
  isStripeConfigured,
  isSupabaseConfigured,
  isTestMode,
  getConfigStatus,
  transformResponse,
} from './config.js';

// Customer tools
export { listCustomers, getCustomer } from './customer-tools.js';

// Payment tools
export { listPayments, getPayment } from './payment-tools.js';

// Subscription tools
export { listSubscriptions, getSubscription } from './subscription-tools.js';

// Invoice tools
export { listInvoices } from './invoice-tools.js';

// Webhook tools
export { listWebhookEvents, webhookHealth } from './webhook-tools.js';

// Balance and dispute tools
export { getBalance, listDisputes } from './balance-dispute-tools.js';

// Test tools
export { createTestCustomer, getConfigStatusTool } from './test-tools.js';

// Product and pricing tools
export { listProducts, listPrices } from './product-tools.js';

// Import tool definitions for registry
import { listCustomersDefinition, getCustomerDefinition } from './customer-tools.js';
import { listPaymentsDefinition, getPaymentDefinition } from './payment-tools.js';
import { listSubscriptionsDefinition, getSubscriptionDefinition } from './subscription-tools.js';
import { listProductsDefinition, listPricesDefinition } from './product-tools.js';
import { listInvoicesDefinition } from './invoice-tools.js';
import { listWebhookEventsDefinition, webhookHealthDefinition } from './webhook-tools.js';
import { getBalanceDefinition, listDisputesDefinition } from './balance-dispute-tools.js';
import { createTestCustomerDefinition, getConfigStatusDefinition } from './test-tools.js';

/**
 * Stripe server manifest
 */
export const manifest: MCPServerManifest = {
  name: 'stripe',
  description:
    'Stripe payment API for customers, payments, subscriptions, invoices, webhooks, and financial data',
  version: '1.0.0',
  apiBaseUrl: 'https://api.stripe.com/v1',
  tools: [
    // Customer Management
    listCustomersDefinition,
    getCustomerDefinition,

    // Payment Management
    listPaymentsDefinition,
    getPaymentDefinition,

    // Subscription Management
    listSubscriptionsDefinition,
    getSubscriptionDefinition,

    // Product & Pricing
    listProductsDefinition,
    listPricesDefinition,

    // Invoice Management
    listInvoicesDefinition,

    // Webhook & Debugging
    listWebhookEventsDefinition,
    webhookHealthDefinition,

    // Financial Tools
    getBalanceDefinition,
    listDisputesDefinition,

    // Testing Tools
    createTestCustomerDefinition,
    getConfigStatusDefinition,
  ],
  documentation: 'Docs/Stripe/README.md',
};
