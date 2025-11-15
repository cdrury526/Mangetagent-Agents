import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding/base64";

// BoldSign Configuration
const BOLDSIGN_BASE_URL = Deno.env.get("BOLDSIGN_BASE_URL") || "https://api.boldsign.com";
const BOLDSIGN_CLIENT_ID = Deno.env.get("BOLDSIGN_CLIENT_ID");
const BOLDSIGN_CLIENT_SECRET = Deno.env.get("BOLDSIGN_CLIENT_SECRET");
const BOLDSIGN_API_KEY = Deno.env.get("BOLDSIGN_API_KEY"); // Fallback only

// Supabase Configuration
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error("ERROR: SUPABASE_URL not configured");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY not configured");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

/**
 * Token Cache for OAuth tokens
 * Stores bearer token with expiration time to avoid unnecessary token requests
 */
interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

/**
 * Get a valid OAuth access token with caching
 * Automatically fetches fresh token if cache is empty or expired
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > now) {
    const secondsRemaining = Math.round((cachedToken.expiresAt - now) / 1000);
    console.log(`[TokenManager] Token cache hit, expires in ${secondsRemaining}s`);
    return cachedToken.token;
  }

  // Cache miss or expired - fetch fresh token
  console.log("[TokenManager] Token cache miss, fetching fresh OAuth token");

  if (!BOLDSIGN_CLIENT_ID || !BOLDSIGN_CLIENT_SECRET) {
    console.error("[TokenManager] OAuth credentials not configured");
    throw new Error(
      "BoldSign OAuth credentials not configured. " +
        "Set BOLDSIGN_CLIENT_ID and BOLDSIGN_CLIENT_SECRET in Supabase secrets."
    );
  }

  const tokenEndpoint = "https://account.boldsign.com/connect/token";

  try {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: BOLDSIGN_CLIENT_ID,
        client_secret: BOLDSIGN_CLIENT_SECRET,
        scope: "BoldSign.Documents.All BoldSign.SenderIdentity.All",
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TokenManager] Token fetch failed:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 500),
      });
      throw new Error(`Failed to fetch OAuth token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { access_token?: string; expires_in?: number; error?: string };

    if (!data.access_token || !data.expires_in) {
      console.error("[TokenManager] Invalid token response:", {
        hasAccessToken: !!data.access_token,
        hasExpiresIn: !!data.expires_in,
        error: data.error,
      });
      throw new Error("BoldSign token endpoint returned invalid response");
    }

    // Cache token with 5-minute safety buffer (300 seconds)
    const safetyBufferMs = 300 * 1000; // 5 minutes
    cachedToken = {
      token: data.access_token,
      expiresAt: now + (data.expires_in - 300) * 1000, // Subtract 5 minutes safety buffer
    };

    const secondsUntilRefresh = Math.round((cachedToken.expiresAt - now) / 1000);
    console.log(`[TokenManager] Token acquired, will refresh in ${secondsUntilRefresh}s`);

    return data.access_token;
  } catch (error) {
    console.error("[TokenManager] Error fetching token:", error);
    throw error;
  }
}

/**
 * Make a request to BoldSign API with OAuth Bearer token
 *
 * Automatically:
 * 1. Gets cached token or fetches fresh one
 * 2. Adds Authorization header with Bearer token
 * 3. Handles 401 errors by refreshing token and retrying once
 */
async function callBoldSignAPI(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  // BoldSign API uses /v1
  // Endpoint should already start with / (e.g., /document/upload)
  // Full URL: https://api.boldsign.com/v1/document/send
  const url = `${BOLDSIGN_BASE_URL}/v1${endpoint}`;

  // Get fresh or cached OAuth token
  let token: string;
  try {
    token = await getAccessToken();
  } catch (error) {
    console.error("[callBoldSignAPI] Failed to get OAuth token:", error);
    // If OAuth fails and we have API key fallback, use that
    if (BOLDSIGN_API_KEY) {
      console.warn("[callBoldSignAPI] OAuth failed, falling back to API key");
      const headers: HeadersInit = {
        'X-API-KEY': BOLDSIGN_API_KEY,
        ...options.headers,
      };
      if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      return fetch(url, { ...options, headers });
    }
    throw error;
  }

  // Build headers with OAuth Bearer token
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  // Only set Content-Type to application/json if not already set and not FormData
  // For FormData uploads, let the browser/Deno set Content-Type with boundary
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  console.log(`[callBoldSignAPI] Calling ${endpoint} with Bearer token`);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 (token expired) - retry with fresh token
  if (response.status === 401 && retryCount === 0) {
    console.warn("[callBoldSignAPI] Received 401, refreshing token and retrying");
    cachedToken = null; // Clear cache to force refresh
    return callBoldSignAPI(endpoint, options, 1); // Retry once with fresh token
  }

  return response;
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

/**
 * Send document for signature
 */
async function handleSendDocument(params: any) {
  try {
    console.log('[BoldSign API] sendDocument: Starting with params:', {
      documentUrl: params.documentUrl ? params.documentUrl.substring(0, 100) + '...' : 'none',
      signerCount: params.signers?.length || 0,
      name: params.name,
    });

    const { documentUrl, name, signers, emailMessage, subject, expiryDays } = params;

    // Validate required parameters
    if (!documentUrl) {
      console.error('[BoldSign API] sendDocument: Missing documentUrl');
      return new Response(
        JSON.stringify({ error: 'documentUrl is required' }),
        { status: 400 }
      );
    }

    if (!signers || !Array.isArray(signers) || signers.length === 0) {
      console.error('[BoldSign API] sendDocument: Missing or invalid signers');
      return new Response(
        JSON.stringify({ error: 'At least one signer is required' }),
        { status: 400 }
      );
    }

    // Download file from signed URL and convert to Base64
    console.log('[BoldSign API] sendDocument: Downloading file from:', documentUrl.substring(0, 100) + '...');
    let fileBase64: string;
    try {
      const fileResponse = await fetch(documentUrl);
      if (!fileResponse.ok) {
        console.error('[BoldSign API] sendDocument: Failed to download file:', fileResponse.status);
        return new Response(
          JSON.stringify({ error: `Failed to download document: ${fileResponse.statusText}` }),
          { status: 400 }
        );
      }
      const fileBuffer = await fileResponse.arrayBuffer();
      // Use Deno standard library for safe Base64 encoding
      const uint8Array = new Uint8Array(fileBuffer);
      const base64Content = encodeBase64(uint8Array);
      // BoldSign requires data URI format: data:application/pdf;base64,{content}
      fileBase64 = `data:application/pdf;base64,${base64Content}`;
      console.log('[BoldSign API] sendDocument: File converted to Base64 data URI, length:', fileBase64.length);
    } catch (downloadError) {
      console.error('[BoldSign API] sendDocument: Error downloading/converting file:', downloadError);
      return new Response(
        JSON.stringify({ error: `Failed to process document: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}` }),
        { status: 400 }
      );
    }

    // Build payload with Base64 encoded file
    const payload: any = {
      title: name || 'Signing Document', // BoldSign requires title or documentInformation
      files: [
        {
          fileName: name || 'document.pdf',
          base64: fileBase64,
        },
      ],
      signers: signers.map((s: any) => {
        const fullName = [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Signer';
        const signer = {
          emailAddress: s.email,
          name: fullName,
          signerOrder: s.signerOrder || 1,
          authenticationMethod: 'email',
          // Add default signature field on first page (required by BoldSign)
          formFields: [
            {
              fieldType: 'signature',
              pageNumber: 1,
              bounds: {
                x: 100,
                y: 700,
                width: 200,
                height: 50,
              },
              isRequired: true,
            },
          ],
        };
        console.log('[BoldSign API] sendDocument: Signer mapped:', { emailAddress: s.email, name: fullName, order: signer.signerOrder });
        return signer;
      }),
      useTextTags: false, // Disable UseTextTags - using explicit formFields instead
    };

    // Add optional fields
    if (emailMessage) payload.emailMessage = emailMessage;
    if (subject) payload.subject = subject;
    if (expiryDays) payload.expiryDays = expiryDays;

    console.log('[BoldSign API] sendDocument: Request payload prepared, calling BoldSign API');
    console.log('[BoldSign API] sendDocument: Payload signers:', payload.signers.map((s: any) => ({ emailAddress: s.emailAddress, order: s.signerOrder })));

    // Log full payload for debugging
    console.log('[BoldSign API] sendDocument: Full payload:', JSON.stringify(payload, null, 2));

    const response = await callBoldSignAPI('/document/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log('[BoldSign API] sendDocument: API response received', {
      status: response.status,
      statusText: response.statusText,
      headers: {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      },
    });

    const responseText = await response.text();
    console.log('[BoldSign API] sendDocument: Response text (first 1000 chars):', responseText.substring(0, 1000));

    let data: any;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('[BoldSign API] sendDocument: Failed to parse response:', parseError);
      console.error('[BoldSign API] sendDocument: Raw response text:', responseText);
      return new Response(
        JSON.stringify({
          error: `Failed to parse BoldSign response: ${responseText.substring(0, 200)}`,
          rawResponse: responseText.substring(0, 500),
          status: response.status,
        }),
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('[BoldSign API] sendDocument: API error response', {
        status: response.status,
        statusText: response.statusText,
        message: data?.message || data?.error || 'Unknown error',
        fullData: JSON.stringify(data),
      });
      return new Response(
        JSON.stringify({
          error: data.message || data.error || `BoldSign API error (${response.status})`,
          details: data,
          status: response.status,
          statusText: response.statusText,
        }),
        { status: response.status }
      );
    }

    console.log('[BoldSign API] sendDocument: Success! Document ID:', data?.documentId);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[BoldSign API] sendDocument: Caught error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[BoldSign API] sendDocument: Error details:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500 }
    );
  }
}

/**
 * Send document on behalf of another user
 */
async function handleSendOnBehalf(params: any) {
  try {
    const { documentId, senderEmail, senderName, senderIdentityId, signers, emailMessage, subject } = params;

    const payload = {
      documentId,
      senderEmail,
      senderName,
      ...(senderIdentityId && { senderIdentityId }),
      signers: signers.map((s: any) => ({
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
      })),
      ...(emailMessage && { emailMessage }),
      ...(subject && { subject }),
    };

    const response = await callBoldSignAPI('/document/sendOnBehalf', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to send document on behalf' }),
        { status: response.status }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending document on behalf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}

/**
 * Revoke a document
 */
async function handleRevokeDocument(params: any) {
  try {
    const { documentId, revokeReason } = params;

    const payload = {
      documentId,
      ...(revokeReason && { revokeReason }),
    };

    const response = await callBoldSignAPI('/document/revoke', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to revoke document' }),
        { status: response.status }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error revoking document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}

/**
 * Get document details
 */
async function handleGetDocument(params: any) {
  try {
    const { documentId } = params;

    const response = await callBoldSignAPI(`/document/${documentId}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'Failed to get document' }),
        { status: response.status }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}

/**
 * Download document (returns binary PDF)
 */
async function handleDownloadDocument(params: any) {
  try {
    const { documentId, format = 'pdf', type = 'signed' } = params;

    // type can be: 'original', 'signed', or 'audit'
    const endpoint = type === 'original'
      ? `/document/${documentId}/download`
      : type === 'audit'
      ? `/document/${documentId}/download/audit`
      : `/document/${documentId}/download/signed`;

    const url = `${endpoint}?format=${format}`;

    const response = await callBoldSignAPI(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/pdf',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to download document' }));
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: response.status }
      );
    }

    // Return binary PDF
    const pdfBlob = await response.blob();
    return new Response(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="document-${documentId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}

/**
 * Generate signing link for embedded signing
 * BoldSign API: POST /document/{documentId}/embeddedSigningLink
 * Returns: { embeddedSigningLink, expiryTime }
 */
async function handleGenerateSigningLink(params: any) {
  try {
    const { documentId, signerEmail, redirectUrl, expiresIn = 3600 } = params;

    console.log('[handleGenerateSigningLink] Starting with:', {
      documentId: documentId?.substring(0, 10) + '...',
      signerEmail,
      hasRedirectUrl: !!redirectUrl,
      expiresIn,
    });

    // Validate required parameters
    if (!documentId) {
      console.error('[handleGenerateSigningLink] Missing documentId');
      return new Response(
        JSON.stringify({ error: 'documentId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!signerEmail) {
      console.error('[handleGenerateSigningLink] Missing signerEmail');
      return new Response(
        JSON.stringify({ error: 'signerEmail is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = {
      signerEmail,
      ...(redirectUrl && { redirectUrl }),
      expiresIn,
    };

    console.log('[handleGenerateSigningLink] Calling BoldSign API with payload:', {
      documentId,
      signerEmail,
      expiresIn,
      hasRedirectUrl: !!redirectUrl,
    });

    // Use the correct BoldSign endpoint for embedded signing
    const response = await callBoldSignAPI(`/document/${documentId}/embeddedSigningLink`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || 'Failed to generate signing link';
      console.error('[handleGenerateSigningLink] BoldSign API error:', {
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        fullResponse: JSON.stringify(data).substring(0, 500),
      });
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // BoldSign returns { embeddedSigningLink, expiryTime }
    // Map to { signingLink, expiresAt } for consistency with client expectations
    const responseData = {
      signingLink: data.embeddedSigningLink,
      expiresAt: data.expiryTime,
      // Also include original fields for reference
      embeddedSigningLink: data.embeddedSigningLink,
      expiryTime: data.expiryTime,
    };

    console.log('[handleGenerateSigningLink] Success:', {
      hasSigningLink: !!responseData.signingLink,
      expiresAt: responseData.expiresAt,
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[handleGenerateSigningLink] Caught error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'no stack',
    });
    return new Response(
      JSON.stringify({ error: `Failed to generate signing link: ${errorMessage}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Upload document to BoldSign
 * Accepts either a file (FormData) or a documentUrl to download from
 */
async function handleUploadDocument(params: any) {
  try {
    if (!BOLDSIGN_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'BOLDSIGN_API_KEY not configured in Edge Function secrets' }),
        { status: 500 }
      );
    }

    const { file, name, labels, documentUrl } = params;

    let fileBlob: Blob;
    let fileName = name || 'document.pdf';

    // If documentUrl is provided, download the file first
    if (documentUrl) {
      console.log('Downloading document from URL:', documentUrl.substring(0, 100) + '...');
      const downloadResponse = await fetch(documentUrl);
      if (!downloadResponse.ok) {
        console.error('Failed to download document:', downloadResponse.status, downloadResponse.statusText);
        throw new Error(`Failed to download document from URL: ${downloadResponse.status} ${downloadResponse.statusText}`);
      }
      fileBlob = await downloadResponse.blob();
      console.log('Downloaded file blob size:', fileBlob.size, 'bytes');
      // Try to get filename from Content-Disposition header or URL
      const contentDisposition = downloadResponse.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          fileName = filenameMatch[1];
        }
      }
    } else if (file) {
      // Handle file as ArrayBuffer or Blob
      if (file instanceof ArrayBuffer) {
        fileBlob = new Blob([file]);
      } else {
        fileBlob = file;
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Either file or documentUrl must be provided' }),
        { status: 400 }
      );
    }

    // Create FormData for multipart upload to BoldSign
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    if (name) formData.append('name', name);
    if (labels) formData.append('labels', JSON.stringify(labels));

    // Use callBoldSignAPI helper which correctly constructs the URL
    // The endpoint should be /document/upload (without /api/v1 since callBoldSignAPI adds it)
    const response = await callBoldSignAPI('/document/upload', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData - browser/Deno will set it with boundary
      },
      body: formData,
    });
    
    console.log('Uploading to BoldSign: /document/upload');
    console.log('File name:', fileName, 'Size:', fileBlob.size);
    
    console.log('BoldSign upload response status:', response.status);

    // Try to parse JSON response, but handle non-JSON errors
    let data: any;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('Failed to parse BoldSign response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: `BoldSign API error (${response.status}): ${response.statusText}` 
        }),
        { status: response.status }
      );
    }

    if (!response.ok) {
      console.error('BoldSign upload error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      let errorMessage: string;
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data && typeof data === 'object') {
        // BoldSign errors often returned as { error: { message, type } }
        const nestedError = (data as any).error;
        if (nestedError && typeof nestedError === 'object' && typeof nestedError.message === 'string') {
          errorMessage = nestedError.message;
        } else if (typeof (data as any).message === 'string') {
          errorMessage = (data as any).message;
        } else if (typeof (data as any).errorMessage === 'string') {
          errorMessage = (data as any).errorMessage;
        } else if (nestedError && typeof nestedError === 'string') {
          errorMessage = nestedError;
        } else {
          try {
            errorMessage = JSON.stringify(data);
          } catch {
            errorMessage = `Failed to upload document (${response.status})`;
          }
        }
      } else {
        errorMessage = `Failed to upload document (${response.status})`;
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleCORS();
  }

  try {
    let requestBody: any;
    try {
      const text = await req.text();
      requestBody = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { action, ...params } = requestBody;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: action' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Received action:', action);

    switch (action) {
      case 'sendDocument':
        return await handleSendDocument(params);
      case 'sendOnBehalf':
        return await handleSendOnBehalf(params);
      case 'revokeDocument':
        return await handleRevokeDocument(params);
      case 'getDocument':
        return await handleGetDocument(params);
      case 'downloadDocument':
        return await handleDownloadDocument(params);
      case 'generateSigningLink':
        return await handleGenerateSigningLink(params);
      case 'uploadDocument':
        return await handleUploadDocument(params);
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

