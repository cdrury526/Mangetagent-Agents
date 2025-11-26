import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'MagnetAgent',
    version: '1.0.0',
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

type PortalFlowType =
  | 'subscription_cancel'
  | 'subscription_update'
  | 'subscription_update_confirm'
  | 'payment_method_update';

interface PortalRequest {
  return_url: string;
  flow_type?: PortalFlowType;
  configuration_id?: string;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const body = await req.json() as PortalRequest;
    const { return_url, flow_type, configuration_id } = body;

    if (!return_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: return_url' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate user' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('agent_id', user.id)
      .maybeSingle();

    if (getCustomerError || !customer || !customer.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No Stripe customer found. Please complete a purchase or subscription first.' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
      customer: customer.stripe_customer_id,
      return_url,
    };

    if (configuration_id) {
      sessionParams.configuration = configuration_id;
    }

    console.log('Creating portal session with params:', JSON.stringify({
      customer: customer.stripe_customer_id,
      return_url,
      flow_type,
      configuration_id,
    }));

    const portalSession = await stripe.billingPortal.sessions.create(sessionParams);

    console.log(`Created portal session ${portalSession.id} for customer ${customer.stripe_customer_id}`);
    console.log(`Portal URL: ${portalSession.url}`);

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Portal error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});