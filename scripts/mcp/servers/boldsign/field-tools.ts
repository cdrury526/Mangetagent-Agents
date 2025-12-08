/**
 * BoldSign: Field Management Tools
 *
 * Tools for managing document form fields:
 * - prefill-fields: Pre-fill form field values before sending
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { PrefillFieldsInput, PrefillFieldsOutput } from '../../types/boldsign.types.js';
import { callBoldSignAPI } from './config.js';

const SERVER = 'boldsign';

// =============================================================================
// Prefill Fields
// =============================================================================

const prefillFieldsInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  fields: z
    .array(
      z.object({
        fieldId: z.string().min(1, 'Field ID is required'),
        value: z.string(),
      })
    )
    .min(1, 'At least one field is required'),
});

/**
 * Pre-fill form field values in a BoldSign document
 */
export async function prefillFields(
  input: PrefillFieldsInput
): Promise<MCPToolResult<PrefillFieldsOutput>> {
  const startTime = Date.now();
  const validated = prefillFieldsInputSchema.parse(input);

  try {
    // First, get document details to validate it exists and is in draft state
    const docResponse = await callBoldSignAPI(`/document/${validated.documentId}`, {
      method: 'GET',
    });

    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      return {
        success: false,
        error: {
          code: `HTTP_${docResponse.status}`,
          message: errorText || 'Failed to get document details',
        },
        metadata: {
          tool: 'prefill-fields',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const docData = (await docResponse.json()) as {
      documentId: string;
      status: string;
      formFields?: Array<{
        fieldId: string;
        fieldType: string;
        value?: string;
      }>;
    };

    // Check if document is in a state that allows field updates
    if (docData.status !== 'draft' && docData.status !== 'Draft') {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot prefill fields for document in status: ${docData.status}. Document must be in draft state.`,
        },
        metadata: {
          tool: 'prefill-fields',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Prepare payload for prefilling fields
    const payload = {
      documentId: validated.documentId,
      formFields: validated.fields.map((field) => ({
        fieldId: field.fieldId,
        value: field.value,
      })),
    };

    // Call BoldSign API to prefill fields
    const response = await callBoldSignAPI('/document/prefillFields', {
      method: 'PUT',
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
          tool: 'prefill-fields',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Build field results
    const fieldResults = validated.fields.map((field) => ({
      fieldId: field.fieldId,
      success: true,
    }));

    return {
      success: true,
      data: {
        success: true,
        documentId: validated.documentId,
        fieldsUpdated: validated.fields.length,
        fieldResults,
      },
      metadata: {
        tool: 'prefill-fields',
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
        tool: 'prefill-fields',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const prefillFieldsDefinition: MCPToolDefinition = {
  name: 'prefill-fields',
  mcpName: 'mcp__boldsign__prefill_fields',
  apiEndpoint: '/v1/document/prefillFields',
  description:
    'Pre-fill form field values in a BoldSign document. Document must be in draft state. Useful for populating buyer/seller names, addresses, and transaction details.',
  inputSchema: prefillFieldsInputSchema,
  tags: ['documents', 'fields', 'prefill', 'forms', 'automation', 'boldsign', 'api'],
  examples: [
    {
      description: 'Prefill buyer and seller names in purchase agreement',
      input: {
        documentId: 'abc-123',
        fields: [
          { fieldId: 'buyer_name', value: 'John Doe' },
          { fieldId: 'seller_name', value: 'Jane Smith' },
          { fieldId: 'property_address', value: '123 Main St, Austin TX 78701' },
        ],
      },
      expectedOutput: '{ success: true, fieldsUpdated: 3, fieldResults: [...] }',
    },
    {
      description: 'Prefill transaction details',
      input: {
        documentId: 'abc-123',
        fields: [
          { fieldId: 'purchase_price', value: '$350,000' },
          { fieldId: 'closing_date', value: '2025-12-15' },
          { fieldId: 'earnest_money', value: '$10,000' },
        ],
      },
      expectedOutput: '{ success: true, fieldsUpdated: 3 }',
    },
  ],
};
