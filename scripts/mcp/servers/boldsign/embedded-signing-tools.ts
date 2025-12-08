/**
 * BoldSign: Embedded Signing Tools
 *
 * Tools for generating embedded signing links:
 * - get-embedded-sign-link: Generate URL for in-app signing
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  GetEmbeddedSignLinkInput,
  GetEmbeddedSignLinkOutput,
} from '../../types/boldsign.types.js';
import { callBoldSignAPI } from './config.js';

const SERVER = 'boldsign';

// =============================================================================
// Get Embedded Sign Link
// =============================================================================

const getEmbeddedSignLinkInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  signerEmail: z.string().email('Valid email address is required'),
  redirectUrl: z.string().url().optional(),
  linkExpiryMinutes: z.number().int().min(1).max(1440).default(30),
});

/**
 * Generate an embedded signing link for in-app document signing
 */
export async function getEmbeddedSignLink(
  input: GetEmbeddedSignLinkInput
): Promise<MCPToolResult<GetEmbeddedSignLinkOutput>> {
  const startTime = Date.now();
  const validated = getEmbeddedSignLinkInputSchema.parse(input);

  try {
    // Calculate expiry timestamp
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + validated.linkExpiryMinutes);

    // Prepare request payload
    const payload: Record<string, unknown> = {
      documentId: validated.documentId,
      signerEmail: validated.signerEmail,
      linkValidTill: expiryDate.toISOString(),
    };

    if (validated.redirectUrl) {
      payload.redirectUrl = validated.redirectUrl;
    }

    // Call BoldSign API
    const response = await callBoldSignAPI('/document/getEmbeddedSignLink', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }

      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorMessage,
        },
        metadata: {
          tool: 'get-embedded-sign-link',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = (await response.json()) as {
      signLink?: string;
      signingUrl?: string;
    };

    // BoldSign API may return either 'signLink' or 'signingUrl'
    const signUrl = data.signLink || data.signingUrl;

    if (!signUrl) {
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'BoldSign API did not return a signing link',
        },
        metadata: {
          tool: 'get-embedded-sign-link',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      data: {
        signUrl,
        expiresAt: expiryDate.toISOString(),
        signerEmail: validated.signerEmail,
        documentId: validated.documentId,
      },
      metadata: {
        tool: 'get-embedded-sign-link',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      metadata: {
        tool: 'get-embedded-sign-link',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const getEmbeddedSignLinkDefinition: MCPToolDefinition = {
  name: 'get-embedded-sign-link',
  mcpName: 'mcp__boldsign__get_embedded_sign_link',
  apiEndpoint: '/v1/document/getEmbeddedSignLink',
  description:
    'Generate an embedded signing link for in-app document signing. The link can be used in an iframe or opened in a new window.',
  inputSchema: getEmbeddedSignLinkInputSchema,
  tags: ['documents', 'embedded', 'signing', 'iframe', 'boldsign', 'api'],
  examples: [
    {
      description: 'Generate embedded signing link with 30-minute expiry',
      input: {
        documentId: 'abc-123',
        signerEmail: 'buyer@example.com',
        linkExpiryMinutes: 30,
      },
      expectedOutput:
        '{ signUrl: "https://app.boldsign.com/document/sign/...", expiresAt: "2025-12-01T12:30:00Z" }',
    },
    {
      description: 'Generate link with custom redirect URL',
      input: {
        documentId: 'abc-123',
        signerEmail: 'buyer@example.com',
        redirectUrl: 'https://myapp.com/signing-complete',
        linkExpiryMinutes: 60,
      },
      expectedOutput:
        '{ signUrl: "https://app.boldsign.com/document/sign/...", expiresAt: "2025-12-01T13:00:00Z" }',
    },
  ],
};
