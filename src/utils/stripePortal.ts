import { supabase } from '../lib/supabase';

export type PortalFlowType =
  | 'subscription_cancel'
  | 'subscription_update'
  | 'subscription_update_confirm'
  | 'payment_method_update';

interface CreatePortalSessionParams {
  returnUrl: string;
  flowType?: PortalFlowType;
  configurationId?: string;
}

interface PortalSessionResponse {
  url: string;
}

export async function createPortalSession({
  returnUrl,
  flowType,
  configurationId,
}: CreatePortalSessionParams): Promise<PortalSessionResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Please sign in to continue');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      return_url: returnUrl,
      flow_type: flowType,
      configuration_id: configurationId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Portal session error:', data);
    throw new Error(data.error || 'Failed to access customer portal');
  }

  console.log('Portal session created successfully:', data);
  return data;
}

export async function openPortalSession(params: CreatePortalSessionParams): Promise<void> {
  try {
    const { url } = await createPortalSession(params);
    console.log('Redirecting to portal URL:', url);

    if (!url) {
      throw new Error('No portal URL received');
    }

    // Use window.location.assign as a more reliable redirect method
    window.location.assign(url);
  } catch (error) {
    console.error('Error opening portal session:', error);
    throw error;
  }
}

export function getPortalReturnUrl(path: string = '/settings'): string {
  return `${window.location.origin}${path}`;
}

export async function openGeneralPortal(returnPath: string = '/settings'): Promise<void> {
  await openPortalSession({
    returnUrl: getPortalReturnUrl(returnPath),
  });
}

export async function openPaymentMethodUpdate(returnPath: string = '/settings'): Promise<void> {
  await openPortalSession({
    returnUrl: getPortalReturnUrl(returnPath),
    flowType: 'payment_method_update',
  });
}

export async function openSubscriptionUpdate(returnPath: string = '/settings'): Promise<void> {
  await openPortalSession({
    returnUrl: getPortalReturnUrl(returnPath),
    flowType: 'subscription_update',
  });
}

export async function openSubscriptionCancel(returnPath: string = '/settings'): Promise<void> {
  await openPortalSession({
    returnUrl: getPortalReturnUrl(returnPath),
    flowType: 'subscription_cancel',
  });
}
