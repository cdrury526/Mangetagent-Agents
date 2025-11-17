import { supabase } from '../lib/supabase';

const BOLDSIGN_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/boldsign-api`;

async function callBoldSignAPI(action: string, params: any) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(BOLDSIGN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'BoldSign API request failed');
  }

  return await response.json();
}

export interface SendDocumentParams {
  documentUrl: string;
  name: string;
  signers: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    signerOrder?: number;
  }>;
  emailMessage?: string;
  subject?: string;
  expiryDays?: number;
}

export async function sendDocumentForSignature(params: SendDocumentParams) {
  return await callBoldSignAPI('sendDocument', params);
}

export interface RevokeDocumentParams {
  documentId: string;
  revokeReason?: string;
}

export async function revokeDocument(params: RevokeDocumentParams) {
  return await callBoldSignAPI('revokeDocument', params);
}

export async function getDocumentStatus(documentId: string) {
  return await callBoldSignAPI('getDocument', { documentId });
}

export interface GenerateSigningLinkParams {
  documentId: string;
  signerEmail: string;
  redirectUrl?: string;
}

export async function generateEmbeddedSigningLink(params: GenerateSigningLinkParams) {
  return await callBoldSignAPI('generateSigningLink', params);
}

export async function downloadSignedDocument(documentId: string) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(BOLDSIGN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'downloadDocument',
      documentId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to download document');
  }

  return await response.blob();
}

export interface CreateEmbeddedRequestParams {
  documentUrl: string;
  name: string;
  signers: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    signerOrder?: number;
  }>;
  title?: string;
  message?: string;
  expiryDays?: number;
  redirectUrl?: string;
  showToolbar?: boolean;
  showNavigationButtons?: boolean;
  showSendButton?: boolean;
  showPreviewButton?: boolean;
  sendViewOption?: string;
  showTooltip?: boolean;
}

export async function createEmbeddedRequest(params: CreateEmbeddedRequestParams) {
  return await callBoldSignAPI('createEmbeddedRequest', params);
}
