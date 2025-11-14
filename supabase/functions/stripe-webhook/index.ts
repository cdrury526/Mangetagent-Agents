import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(stripeData as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionChange(stripeData as Stripe.Subscription);
      break;

    case 'customer.updated':
      await handleCustomerUpdated(stripeData as Stripe.Customer);
      break;

    case 'payment_method.attached':
      await handlePaymentMethodAttached(stripeData as Stripe.PaymentMethod);
      break;

    case 'payment_method.detached':
      await handlePaymentMethodDetached(stripeData as Stripe.PaymentMethod);
      break;

    case 'customer.tax_id.created':
    case 'customer.tax_id.updated':
    case 'customer.tax_id.deleted':
      console.info(`Tax ID ${event.type} for customer`, stripeData);
      break;

    case 'billing_portal.configuration.created':
    case 'billing_portal.configuration.updated':
      console.info(`Portal configuration ${event.type}`, stripeData);
      break;

    case 'billing_portal.session.created':
      console.info('Portal session created', stripeData);
      break;

    default:
      console.info(`Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer;

  if (!customerId || typeof customerId !== 'string') {
    console.error('No customer ID in checkout session');
    return;
  }

  const isSubscription = session.mode === 'subscription';
  console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);

  if (isSubscription) {
    await syncCustomerFromStripe(customerId);
  } else if (session.mode === 'payment' && session.payment_status === 'paid') {
    try {
      const { error: orderError } = await supabase.from('stripe_orders').insert({
        checkout_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        customer_id: customerId,
        amount_subtotal: session.amount_subtotal ?? 0,
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? 'usd',
        payment_status: session.payment_status,
        status: 'completed',
      });

      if (orderError) {
        console.error('Error inserting order:', orderError);
        return;
      }
      console.info(`Successfully processed one-time payment for session: ${session.id}`);
    } catch (error) {
      console.error('Error processing one-time payment:', error);
    }
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  console.info(`Handling subscription change for customer: ${customerId}`);
  await syncCustomerFromStripe(customerId);
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.info(`Customer updated: ${customer.id}`);

  const { data: dbCustomer } = await supabase
    .from('stripe_customers')
    .select('agent_id')
    .eq('stripe_customer_id', customer.id)
    .maybeSingle();

  if (!dbCustomer) {
    console.info('Customer not found in database, skipping update');
    return;
  }

  console.info('Customer billing information updated in Stripe portal');
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const customerId = paymentMethod.customer as string;
  console.info(`Payment method attached to customer: ${customerId}`);

  await syncCustomerFromStripe(customerId);
}

async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  const customerId = paymentMethod.customer as string;
  console.info(`Payment method detached from customer: ${customerId}`);

  await syncCustomerFromStripe(customerId);
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.info(`No subscriptions found for customer: ${customerId}`);
      return;
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // Get agent_id from stripe_customers table
    const { data: customerData } = await supabase
      .from('stripe_customers')
      .select('agent_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (!customerData) {
      console.error(`Customer ${customerId} not found in database`);
      return;
    }

    const periodStart = subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null;
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    // Determine the plan based on the price
    const priceId = subscription.items.data[0].price.id;
    let plan: 'free' | 'monthly' | 'annual' = 'free';
    if (priceId === 'price_1SOVYQ4MuCor2R33C72xRP2k') {
      plan = 'monthly';
    }

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        agent_id: customerData.agent_id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        status: subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing',
        plan: plan,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      },
      {
        onConflict: 'agent_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}