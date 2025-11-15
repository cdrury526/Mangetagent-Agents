import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BOLDSIGN_WEBHOOK_SECRET = Deno.env.get("BOLDSIGN_WEBHOOK_SECRET");
const BOLDSIGN_API_KEY = Deno.env.get("BOLDSIGN_API_KEY");
const BOLDSIGN_BASE_URL = Deno.env.get("BOLDSIGN_BASE_URL") || "https://api.boldsign.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = "https://magnetagent.com";

// Validate required environment variables
if (!BOLDSIGN_WEBHOOK_SECRET) {
  console.error("ERROR: BOLDSIGN_WEBHOOK_SECRET not configured");
}
if (!BOLDSIGN_API_KEY) {
  console.error("ERROR: BOLDSIGN_API_KEY not configured");
}
if (!SUPABASE_URL) {
  console.error("ERROR: SUPABASE_URL not configured");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY not configured");
}
if (!RESEND_API_KEY) {
  console.warn("WARNING: RESEND_API_KEY not configured - email notifications will be skipped");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

/**
 * Verify BoldSign webhook signature using HMAC-SHA256
 */
async function verifyBoldSignSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  try {
    // BoldSign uses HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // BoldSign sends signature in format: sha256=xxx or just the hex string
    const receivedSignature = signature.replace('sha256=', '').toLowerCase();

    // Constant-time comparison
    if (computedSignature.length !== receivedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < computedSignature.length; i++) {
      result |= computedSignature.charCodeAt(i) ^ receivedSignature.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Sleep utility for exponential backoff retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send email via Resend with exponential backoff retry logic
 * Retries only on transient failures (5xx, 429)
 */
async function sendEmailWithRetry(
  emailParams: Record<string, any>,
  maxAttempts = 3,
  timestamp: string,
  requestId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn(`[${timestamp}] [${requestId}] Resend API key not configured, skipping email`);
    return { success: false, error: 'Resend API key not configured' };
  }

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(emailParams),
      });

      const data = await response.json();

      if (response.ok && data.id) {
        console.log(`[${timestamp}] [${requestId}] Email sent successfully to ${emailParams.to} (ID: ${data.id})`);
        return { success: true, messageId: data.id };
      }

      // Check if error is transient
      const isTransient =
        response.status >= 500 ||
        response.status === 429 ||
        (data.message && (data.message.includes('timeout') || data.message.includes('temporarily')));

      if (!isTransient) {
        // Non-transient error (4xx), don't retry
        const errorMsg = data.message || `HTTP ${response.status}`;
        console.error(`[${timestamp}] [${requestId}] Non-transient email error to ${emailParams.to}:`, errorMsg);
        return { success: false, error: errorMsg };
      }

      // Transient error, retry if attempts remaining
      if (attempt < maxAttempts) {
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        const errorMsg = data.message || `HTTP ${response.status}`;
        console.warn(
          `[${timestamp}] [${requestId}] Transient email error (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms:`,
          errorMsg
        );
        await sleep(delayMs);
        continue;
      }

      // Max attempts reached
      lastError = data.message || `HTTP ${response.status}`;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (attempt === maxAttempts) {
        console.error(`[${timestamp}] [${requestId}] Unexpected email error (attempt ${attempt}/${maxAttempts}):`, errorMsg);
        return { success: false, error: errorMsg };
      }

      const delayMs = Math.pow(2, attempt) * 1000;
      console.warn(
        `[${timestamp}] [${requestId}] Unexpected email error (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms:`,
        errorMsg
      );
      await sleep(delayMs);
    }
  }

  console.error(`[${timestamp}] [${requestId}] Email send failed after max retries to ${emailParams.to}`);
  return { success: false, error: lastError || 'Email send failed after max retries' };
}

/**
 * Get agent details for email notification
 */
async function getAgentDetails(agentId: string): Promise<{ email: string; firstName: string; lastName: string } | null> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('email, first_name, last_name')
      .eq('id', agentId)
      .single();

    if (error || !data) {
      console.error('Error getting agent details:', error);
      return null;
    }

    return {
      email: data.email,
      firstName: data.first_name || 'Agent',
      lastName: data.last_name || '',
    };
  } catch (error) {
    console.error('Error fetching agent:', error);
    return null;
  }
}

/**
 * Get document details for email context
 */
async function getDocumentDetails(documentId: string): Promise<{ name: string } | null> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('name')
      .eq('id', documentId)
      .single();

    if (error || !data) {
      return null;
    }

    return { name: data.name };
  } catch (error) {
    return null;
  }
}

/**
 * Store webhook event in database
 */
async function storeEvent(event: any): Promise<void> {
  const eventId = event.id || `${event.event}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  await supabase.from('bold_sign_events').insert({
    bold_sign_event_id: eventId,
    event_type: event.event,
    document_id: event.data?.documentId,
    payload_json: event,
  });
}

/**
 * Store webhook delivery metrics
 */
async function storeWebhookMetrics(
  eventId: string,
  eventType: string,
  documentId: string | undefined,
  processingTimeMs: number,
  status: 'success' | 'error',
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('webhook_metrics').insert({
      event_id: eventId,
      event_type: eventType,
      bold_sign_document_id: documentId,
      processing_time_ms: processingTimeMs,
      status,
      error_message: errorMessage,
      received_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Failed to store webhook metrics:', error);
  }
}

/**
 * Check if event has already been processed
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from('bold_sign_events')
    .select('processed')
    .eq('bold_sign_event_id', eventId)
    .single();

  return data?.processed || false;
}

/**
 * Mark event as processed
 */
async function markEventProcessed(eventId: string): Promise<void> {
  await supabase
    .from('bold_sign_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .eq('bold_sign_event_id', eventId);
}

/**
 * Download signed PDF from BoldSign and store in Supabase Storage
 */
async function downloadAndStoreSignedPDF(
  boldSignDocumentId: string,
  documentRecordId: string,
  transactionId: string,
  agentId: string
): Promise<{ storagePath: string; signedPdfUrl: string } | null> {
  try {
    // Download signed PDF from BoldSign
    const downloadUrl = `${BOLDSIGN_BASE_URL}/v1/document/${boldSignDocumentId}/download/signed?format=pdf`;
    const downloadResponse = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BOLDSIGN_API_KEY}`,
      },
    });

    if (!downloadResponse.ok) {
      throw new Error(`Failed to download signed PDF: ${downloadResponse.statusText}`);
    }

    const pdfBlob = await downloadResponse.blob();
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);

    // Generate storage path: documents/{transactionId}/{documentId}/signed.pdf
    const storagePath = `documents/${transactionId}/${documentRecordId}/signed.pdf`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      throw new Error(`Failed to upload signed PDF to storage: ${uploadError.message}`);
    }

    // Generate signed URL for the stored PDF
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 31536000); // 1 year expiry

    if (signedUrlError || !signedUrlData) {
      console.warn('Failed to generate signed URL, but PDF was uploaded:', signedUrlError);
    }

    return {
      storagePath,
      signedPdfUrl: signedUrlData?.signedUrl || '',
    };
  } catch (error) {
    console.error('Error downloading and storing signed PDF:', error);
    return null;
  }
}

/**
 * Handle document.completed event
 * This is where we automatically download the signed PDF
 */
async function handleDocumentCompleted(
  data: any,
  timestamp: string,
  requestId: string
): Promise<void> {
  try {
    const boldSignDocumentId = data.documentId;
    const completedAt = data.completedAt || new Date().toISOString();

    // Find the document record
    const { data: docRecord, error: docError } = await supabase
      .from('bold_sign_documents')
      .select('id, transaction_id, agent_id, document_id')
      .eq('bold_sign_document_id', boldSignDocumentId)
      .single();

    if (docError || !docRecord) {
      console.error('Document record not found:', docError);
      return;
    }

    // Download and store the signed PDF
    const pdfResult = await downloadAndStoreSignedPDF(
      boldSignDocumentId,
      docRecord.id,
      docRecord.transaction_id,
      docRecord.agent_id
    );

    // Update document status
    const updateData: any = {
      status: 'completed',
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    };

    if (pdfResult) {
      updateData.signed_pdf_url = pdfResult.signedPdfUrl;
      updateData.signed_pdf_storage_path = pdfResult.storagePath;
    }

    await supabase
      .from('bold_sign_documents')
      .update(updateData)
      .eq('bold_sign_document_id', boldSignDocumentId);

    // If there's a linked document record, create a new document entry for the signed version
    if (docRecord.document_id && pdfResult) {
      // Get the original document to copy metadata
      const { data: originalDoc } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docRecord.document_id)
        .single();

      if (originalDoc) {
        // Create a new document entry for the signed version
        const signedDocumentId = crypto.randomUUID();
        const signedDocumentName = originalDoc.name.replace(/\.(pdf|docx?)$/i, '') + ' - Signed.pdf';

        await supabase.from('documents').insert({
          id: signedDocumentId,
          agent_id: docRecord.agent_id,
          transaction_id: docRecord.transaction_id,
          name: signedDocumentName,
          type: originalDoc.type,
          size_bytes: pdfResult.storagePath ? undefined : null, // We could calculate this if needed
          mime_type: 'application/pdf',
          storage_path: pdfResult.storagePath,
          visible_to_client: originalDoc.visible_to_client,
          archived: false,
        });
      }
    }

    console.log(`Document ${boldSignDocumentId} completed and signed PDF downloaded`);

    // Send completion email notification
    if (docRecord.agent_id) {
      const agent = await getAgentDetails(docRecord.agent_id);
      const document = docRecord.document_id ? await getDocumentDetails(docRecord.document_id) : null;

      if (agent && document) {
        const downloadUrl = pdfResult?.signedPdfUrl || `${APP_URL}/documents/${docRecord.document_id}`;

        const emailResult = await sendEmailWithRetry(
          {
            from: 'noreply@magnetagent.com',
            to: agent.email,
            subject: `✓ "${document.name}" Signed and Complete`,
            html: `
              <h2>Document Completed</h2>
              <p>Hi ${agent.firstName},</p>
              <p><strong>"${document.name}"</strong> has been signed by all signers and is ready for download.</p>
              <p><a href="${downloadUrl}" style="display: inline-block; padding: 12px 32px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 4px;">Download Signed PDF</a></p>
              <p>Completed on ${completedAt}</p>
            `,
          },
          3,
          timestamp,
          requestId
        );

        if (!emailResult.success) {
          console.warn(`[${timestamp}] [${requestId}] Failed to send document.completed email:`, emailResult.error);
        }
      }
    }
  } catch (error) {
    console.error('Error handling document.completed:', error);
    throw error;
  }
}

/**
 * Refund credit for declined or revoked document
 */
async function refundCreditForDocument(
  boldSignDocumentId: string,
  eventId: string,
  reason: 'declined' | 'revoked'
): Promise<void> {
  try {
    // Get document record to find agent_id and document name
    const { data: docRecord, error: docError } = await supabase
      .from('bold_sign_documents')
      .select('agent_id, document_id')
      .eq('bold_sign_document_id', boldSignDocumentId)
      .single();

    if (docError || !docRecord) {
      console.error(`[Credit Refund] Document record not found for ${boldSignDocumentId}:`, docError);
      return;
    }

    const agentId = docRecord.agent_id;

    // Check if deduction exists
    const { data: deduction, error: deductionError } = await supabase
      .from('credit_ledger')
      .select('id')
      .eq('agent_id', agentId)
      .eq('reference_id', boldSignDocumentId)
      .eq('transaction_type', 'esignature_send')
      .maybeSingle();

    if (deductionError) {
      console.error(`[Credit Refund] Error checking for deduction:`, deductionError);
      return;
    }

    if (!deduction) {
      console.log(`[Credit Refund] No deduction found for ${boldSignDocumentId}, skipping refund`);
      return;
    }

    // Check if refund already exists (idempotency)
    const transactionType = reason === 'declined' ? 'esignature_refund' : 'esignature_refund_revoke';

    const { data: existingRefund, error: refundCheckError } = await supabase
      .from('credit_ledger')
      .select('id')
      .eq('agent_id', agentId)
      .eq('reference_id', boldSignDocumentId)
      .eq('transaction_type', transactionType)
      .maybeSingle();

    if (refundCheckError) {
      console.error(`[Credit Refund] Error checking for existing refund:`, refundCheckError);
      return;
    }

    if (existingRefund) {
      console.log(`[Credit Refund] Refund already exists for ${boldSignDocumentId}, skipping`);
      return;
    }

    // Get current balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('credit_ledger')
      .select('balance_after')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (balanceError) {
      console.error(`[Credit Refund] Error getting current balance:`, balanceError);
      return;
    }

    const currentBalance = balanceData?.balance_after || 0;
    const newBalance = currentBalance + 1;

    // Get document name for description
    let documentName = 'document';
    if (docRecord.document_id) {
      const { data: docData } = await supabase
        .from('documents')
        .select('name')
        .eq('id', docRecord.document_id)
        .single();

      if (docData?.name) {
        documentName = docData.name;
      }
    }

    const description = `${documentName} - refund (${reason})`;

    // Create refund entry
    const { error: insertError } = await supabase
      .from('credit_ledger')
      .insert({
        agent_id: agentId,
        transaction_type: transactionType,
        amount: 1, // Positive for refund
        balance_after: newBalance,
        reference_id: boldSignDocumentId,
        reference_type: 'bold_sign_documents',
        description,
      });

    if (insertError) {
      // Check if it's a duplicate key violation (race condition)
      if (insertError.code === '23505') {
        console.log(`[Credit Refund] Refund already created in race condition for ${boldSignDocumentId}`);
        return;
      }
      console.error(`[Credit Refund] Error creating refund entry:`, insertError);
      return;
    }

    console.log(`[Credit Refund] Successfully refunded 1 credit for ${boldSignDocumentId}. New balance: ${newBalance}`);
  } catch (error) {
    console.error(`[Credit Refund] Unexpected error:`, error);
  }
}

/**
 * Handle document.declined event
 */
async function handleDocumentDeclined(
  data: any,
  eventId: string,
  timestamp: string,
  requestId: string
): Promise<void> {
  try {
    const boldSignDocumentId = data.documentId;
    const declinedAt = data.declinedAt || new Date().toISOString();

    // Get document record
    const { data: docRecord, error: docError } = await supabase
      .from('bold_sign_documents')
      .select('id, agent_id, document_id, signers_json')
      .eq('bold_sign_document_id', boldSignDocumentId)
      .single();

    await supabase
      .from('bold_sign_documents')
      .update({
        status: 'declined',
        completed_at: declinedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('bold_sign_document_id', boldSignDocumentId);

    console.log(`Document ${boldSignDocumentId} declined`);

    // Refund credit
    await refundCreditForDocument(boldSignDocumentId, eventId, 'declined');

    // Send declined email notification
    if (docRecord && docRecord.agent_id) {
      const agent = await getAgentDetails(docRecord.agent_id);
      const document = docRecord.document_id ? await getDocumentDetails(docRecord.document_id) : null;

      if (agent && document) {
        const signers = docRecord.signers_json || [];
        const declinedSigner = signers.find((s: any) => s.email === data.signerEmail) || signers[0];

        const emailResult = await sendEmailWithRetry(
          {
            from: 'noreply@magnetagent.com',
            to: agent.email,
            subject: `"${document.name}" - Declined by ${declinedSigner?.name || 'Signer'}`,
            html: `
              <h2>Document Declined</h2>
              <p>Hi ${agent.firstName},</p>
              <p><strong>${declinedSigner?.name || 'A signer'}</strong> (${declinedSigner?.email || 'N/A'}) declined to sign <strong>"${document.name}"</strong> on ${declinedAt}.</p>
              ${data.declineReason ? `<p><strong>Reason:</strong> ${data.declineReason}</p>` : ''}
              <p style="padding: 12px 16px; background-color: #dcfce7; border-left: 4px solid #16a34a; color: #15803d; border-radius: 4px;">✓ The credit for this document has been refunded to your account.</p>
            `,
          },
          3,
          timestamp,
          requestId
        );

        if (!emailResult.success) {
          console.warn(`[${timestamp}] [${requestId}] Failed to send document.declined email:`, emailResult.error);
        }
      }
    }
  } catch (error) {
    console.error('Error handling document.declined:', error);
    throw error;
  }
}

/**
 * Handle document.expired event
 */
async function handleDocumentExpired(
  data: any,
  timestamp: string,
  requestId: string
): Promise<void> {
  try {
    const boldSignDocumentId = data.documentId;
    const expiredAt = data.expiredAt || new Date().toISOString();

    // Get document record
    const { data: docRecord, error: docError } = await supabase
      .from('bold_sign_documents')
      .select('id, agent_id, document_id')
      .eq('bold_sign_document_id', boldSignDocumentId)
      .single();

    await supabase
      .from('bold_sign_documents')
      .update({
        status: 'expired',
        completed_at: expiredAt,
        updated_at: new Date().toISOString(),
      })
      .eq('bold_sign_document_id', boldSignDocumentId);

    console.log(`Document ${boldSignDocumentId} expired`);

    // Send expired email notification
    if (docRecord && docRecord.agent_id) {
      const agent = await getAgentDetails(docRecord.agent_id);
      const document = docRecord.document_id ? await getDocumentDetails(docRecord.document_id) : null;

      if (agent && document) {
        const resendUrl = `${APP_URL}/documents/${boldSignDocumentId}/resend`;

        const emailResult = await sendEmailWithRetry(
          {
            from: 'noreply@magnetagent.com',
            to: agent.email,
            subject: `"${document.name}" - Signature Request Expired`,
            html: `
              <h2>Signature Request Expired</h2>
              <p>Hi ${agent.firstName},</p>
              <p>The signature request for <strong>"${document.name}"</strong> has expired on ${expiredAt}.</p>
              <p>The signer can no longer sign using the original link. To get signatures, you'll need to send a new request.</p>
              <p><a href="${resendUrl}" style="display: inline-block; padding: 12px 32px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 4px;">Send New Request</a></p>
            `,
          },
          3,
          timestamp,
          requestId
        );

        if (!emailResult.success) {
          console.warn(`[${timestamp}] [${requestId}] Failed to send document.expired email:`, emailResult.error);
        }
      }
    }
  } catch (error) {
    console.error('Error handling document.expired:', error);
    throw error;
  }
}

/**
 * Handle document.revoked event
 */
async function handleDocumentRevoked(data: any, eventId: string): Promise<void> {
  try {
    const boldSignDocumentId = data.documentId;
    const revokedAt = data.revokedAt || new Date().toISOString();

    await supabase
      .from('bold_sign_documents')
      .update({
        status: 'revoked',
        completed_at: revokedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('bold_sign_document_id', boldSignDocumentId);

    console.log(`Document ${boldSignDocumentId} revoked`);

    // Refund credit
    await refundCreditForDocument(boldSignDocumentId, eventId, 'revoked');
  } catch (error) {
    console.error('Error handling document.revoked:', error);
    throw error;
  }
}

/**
 * Handle document.sent event
 */
async function handleDocumentSent(
  data: any,
  timestamp: string,
  requestId: string
): Promise<void> {
  try {
    const boldSignDocumentId = data.documentId;

    // Get document record with agent info
    const { data: docRecord, error: docError } = await supabase
      .from('bold_sign_documents')
      .select('id, agent_id, document_id, signers_json')
      .eq('bold_sign_document_id', boldSignDocumentId)
      .single();

    if (docError || !docRecord) {
      console.error('Document record not found:', docError);
      return;
    }

    // Update document status
    await supabase
      .from('bold_sign_documents')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('bold_sign_document_id', boldSignDocumentId);

    console.log(`Document ${boldSignDocumentId} sent`);

    // Send email notification
    if (docRecord.agent_id) {
      const agent = await getAgentDetails(docRecord.agent_id);
      const document = docRecord.document_id ? await getDocumentDetails(docRecord.document_id) : null;

      if (agent && document) {
        const signers = docRecord.signers_json || [];
        const primarySigner = signers[0];
        const expiryDate = data.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

        const emailResult = await sendEmailWithRetry(
          {
            from: 'noreply@magnetagent.com',
            to: agent.email,
            subject: `Document Sent for Signature: "${document.name}"`,
            html: `
              <h2>Document Sent for Signature</h2>
              <p>Hi ${agent.firstName},</p>
              <p><strong>"${document.name}"</strong> has been sent to <strong>${primarySigner?.name || 'the signer'}</strong> (${primarySigner?.email || 'N/A'}) for signature.</p>
              <p><a href="${APP_URL}/documents/${docRecord.document_id || boldSignDocumentId}">View Document</a></p>
              <p>The document will expire on <strong>${expiryDate}</strong> if not signed.</p>
            `,
          },
          3,
          timestamp,
          requestId
        );

        if (!emailResult.success) {
          console.warn(`[${timestamp}] [${requestId}] Failed to send document.sent email:`, emailResult.error);
        }
      }
    }
  } catch (error) {
    console.error('Error handling document.sent:', error);
    throw error;
  }
}

/**
 * Handle signer.completed event
 */
async function handleSignerCompleted(data: any): Promise<void> {
  try {
    const boldSignDocumentId = data.documentId;

    // Update status to in_progress if not already completed
    await supabase
      .from('bold_sign_documents')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('bold_sign_document_id', boldSignDocumentId)
      .neq('status', 'completed');

    console.log(`Signer completed for document ${boldSignDocumentId}`);
  } catch (error) {
    console.error('Error handling signer.completed:', error);
    throw error;
  }
}

/**
 * Main webhook handler
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type, x-boldsign-signature',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const processingStartTime = Date.now();
  const timestamp = new Date().toISOString();
  const requestId = crypto.randomUUID().substring(0, 8);

  console.log(JSON.stringify({
    timestamp,
    requestId,
    type: 'webhook_received',
    message: 'Webhook request received',
  }));

  try {
    const signature = req.headers.get('X-BoldSign-Signature') || req.headers.get('x-boldsign-signature');
    const body = await req.text();

    console.log(`[${timestamp}] [${requestId}] Signature present: ${!!signature}, Body length: ${body.length} bytes`);

    // Check if this is a test/verification request (BoldSign test may not include signature)
    const isTestRequest = !signature && (body.includes('"event":"test"') || body === '{}' || body === '' || body.trim() === '');
    const isEmptyBody = !body || body.trim() === '' || body === '{}';

    // For test/verification requests without signature, return success to allow BoldSign to verify connectivity
    // This allows BoldSign to verify the URL before they provide the webhook secret
    if ((isTestRequest || isEmptyBody) && !signature) {
      console.log(`[${timestamp}] [${requestId}] Test/verification webhook - returning success for connectivity test`);
      return new Response(JSON.stringify({ received: true, message: 'Webhook endpoint is reachable' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse event early to check if it's a test event
    let eventForChecking: any = null;
    try {
      if (body && body.trim() !== '' && body !== '{}') {
        eventForChecking = JSON.parse(body);
      }
    } catch (e) {
      // Ignore parse errors for now
    }

    // Check if this is a test/development event (no signature required)
    const isTestDoc = eventForChecking?.data?.documentId?.startsWith('test_') ||
                      eventForChecking?.data?.documentId?.includes('test');

    // If we have a signature, verify it (but allow through if secret not configured yet during setup)
    let signatureValid = false;
    if (signature) {
      if (!BOLDSIGN_WEBHOOK_SECRET) {
        console.warn(`[${timestamp}] [${requestId}] BOLDSIGN_WEBHOOK_SECRET not configured, allowing through for initial setup`);
        signatureValid = true;
      } else {
        signatureValid = await verifyBoldSignSignature(body, signature, BOLDSIGN_WEBHOOK_SECRET);
        console.log(`[${timestamp}] [${requestId}] Signature verification: ${signatureValid ? 'VALID' : 'INVALID'}`);
        if (!signatureValid) {
          console.error(`[${timestamp}] [${requestId}] Invalid webhook signature - rejecting`);
          return new Response('Invalid signature', { status: 401 });
        }
      }
    } else {
      // No signature - check if this is a test event or during setup
      if (isTestDoc) {
        console.log(`[${timestamp}] [${requestId}] Test document without signature - allowing for testing`);
        signatureValid = true;
      } else if (!BOLDSIGN_WEBHOOK_SECRET) {
        console.warn(`[${timestamp}] [${requestId}] No signature and BOLDSIGN_WEBHOOK_SECRET not configured - allowing through for initial setup`);
        signatureValid = true;
      } else {
        console.error(`[${timestamp}] [${requestId}] Missing X-BoldSign-Signature header - rejecting`);
        return new Response('Missing signature header', { status: 401 });
      }
    }

    // Parse event JSON (handle empty/invalid JSON during test)
    let event;
    try {
      if (!body || body.trim() === '' || body === '{}') {
        // Empty body during test - return success
        console.log(`[${timestamp}] [${requestId}] Empty body - returning success`);
        return new Response(JSON.stringify({ received: true, message: 'Webhook endpoint is reachable' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      event = JSON.parse(body);
      console.log(`[${timestamp}] [${requestId}] Event parsed: type=${event.event}, id=${event.id}`);
    } catch (error) {
      console.error(`[${timestamp}] [${requestId}] Invalid JSON in webhook body:`, error);
      // During setup, allow invalid JSON through
      if (!BOLDSIGN_WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ received: true, message: 'Webhook endpoint is reachable' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Invalid JSON', { status: 400 });
    }

    // Skip processing test events and manual test events (no signature)
    if (event.event === 'test' || event.event?.startsWith('test.') ||
        (event.data?.documentId?.startsWith('test_') && !signature)) {
      console.log(`[${timestamp}] [${requestId}] Test/manual event - returning success without processing`);
      return new Response(JSON.stringify({ received: true, message: 'Test event received' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store event
    const eventId = event.id || `${event.event}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`[${timestamp}] [${requestId}] Storing event: ${eventId}`);
    await storeEvent(event);

    // Check idempotency
    const alreadyProcessed = await isEventProcessed(eventId);
    if (alreadyProcessed) {
      console.log(`[${timestamp}] [${requestId}] Event ${eventId} already processed - skipping`);
      return new Response(JSON.stringify({ received: true, message: 'Already processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process event
    console.log(`[${timestamp}] [${requestId}] Processing event type: ${event.event}`);
    switch (event.event) {
      case 'document.completed':
        console.log(`[${timestamp}] [${requestId}] → Handling document.completed for ${event.data?.documentId}`);
        await handleDocumentCompleted(event.data, timestamp, requestId);
        break;
      case 'document.declined':
        console.log(`[${timestamp}] [${requestId}] → Handling document.declined for ${event.data?.documentId}`);
        await handleDocumentDeclined(event.data, eventId, timestamp, requestId);
        break;
      case 'document.expired':
        console.log(`[${timestamp}] [${requestId}] → Handling document.expired for ${event.data?.documentId}`);
        await handleDocumentExpired(event.data, timestamp, requestId);
        break;
      case 'document.revoked':
        console.log(`[${timestamp}] [${requestId}] → Handling document.revoked for ${event.data?.documentId}`);
        await handleDocumentRevoked(event.data, eventId);
        break;
      case 'document.sent':
        console.log(`[${timestamp}] [${requestId}] → Handling document.sent for ${event.data?.documentId}`);
        await handleDocumentSent(event.data, timestamp, requestId);
        break;
      case 'signer.completed':
        console.log(`[${timestamp}] [${requestId}] → Handling signer.completed for ${event.data?.documentId}`);
        await handleSignerCompleted(event.data);
        break;
      case 'signer.signed':
        console.log(`[${timestamp}] [${requestId}] → Handling signer.signed for ${event.data?.documentId}`);
        await handleSignerCompleted(event.data);
        break;
      case 'signer.viewed':
        console.log(`[${timestamp}] [${requestId}] → Signer viewed document ${event.data?.documentId}`);
        break;
      case 'signer.declined':
        console.log(`[${timestamp}] [${requestId}] → Signer declined document ${event.data?.documentId}`);
        break;
      default:
        console.log(`[${timestamp}] [${requestId}] ⚠ Unhandled event type: ${event.event}`);
    }

    // Mark as processed
    console.log(`[${timestamp}] [${requestId}] Marking event as processed`);
    await markEventProcessed(eventId);

    const processingTimeMs = Date.now() - processingStartTime;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      type: 'webhook_processed',
      eventType: event.event,
      documentId: event.data?.documentId,
      processingTimeMs,
      status: 'success',
    }));

    // Store metrics
    await storeWebhookMetrics(
      eventId,
      event.event,
      event.data?.documentId,
      processingTimeMs,
      'success'
    );

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const processingTimeMs = Date.now() - processingStartTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      type: 'webhook_error',
      error: errorMessage,
      processingTimeMs,
      status: 'error',
    }));

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

