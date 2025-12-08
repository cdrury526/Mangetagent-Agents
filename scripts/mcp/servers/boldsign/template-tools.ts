/**
 * BoldSign: Template Tools
 *
 * Tools for managing document templates:
 * - list-templates: List available templates
 * - get-template: Get template details
 * - send-from-template: Send document using a template
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { ListTemplatesInput, ListTemplatesOutput, BoldSignTemplate } from '../../types/boldsign.types.js';
import { callBoldSignAPI } from './config.js';

const SERVER = 'boldsign';

// =============================================================================
// List Templates
// =============================================================================

const listTemplatesInputSchema = z.object({
  searchTerm: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

/**
 * List available templates
 */
export async function listTemplates(
  input: ListTemplatesInput
): Promise<MCPToolResult<ListTemplatesOutput>> {
  const startTime = Date.now();
  const validated = listTemplatesInputSchema.parse(input);

  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', String(validated.page));
    params.append('pageSize', String(validated.pageSize));

    if (validated.searchTerm) {
      params.append('searchKey', validated.searchTerm);
    }

    // Call BoldSign API
    const response = await callBoldSignAPI(`/template/list?${params.toString()}`, {
      method: 'GET',
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
          tool: 'list-templates',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = (await response.json()) as {
      result?: Array<{
        templateId: string;
        title: string;
        description?: string;
        createdDate: string;
        modifiedDate?: string;
        roles?: Array<{
          roleId: string;
          roleName: string;
          roleIndex: number;
        }>;
        formFields?: Array<{
          fieldId: string;
          fieldType: string;
          pageNumber: number;
          roleId: string;
          isRequired: boolean;
        }>;
      }>;
      pageDetails?: {
        page: number;
        pageSize: number;
        totalRecordsCount: number;
        totalPages: number;
      };
    };

    // Transform response
    const templates: BoldSignTemplate[] = (data.result || []).map((t) => ({
      templateId: t.templateId,
      title: t.title,
      description: t.description,
      createdDate: t.createdDate,
      modifiedDate: t.modifiedDate,
      roles:
        t.roles?.map((r) => ({
          roleId: r.roleId,
          roleName: r.roleName,
          roleIndex: r.roleIndex,
        })) || [],
      formFields:
        t.formFields?.map((f) => ({
          fieldId: f.fieldId,
          fieldType: f.fieldType,
          pageNumber: f.pageNumber,
          roleId: f.roleId,
          required: f.isRequired,
        })) || [],
    }));

    const pagination = data.pageDetails || {
      page: validated.page,
      pageSize: validated.pageSize,
      totalRecordsCount: templates.length,
      totalPages: 1,
    };

    return {
      success: true,
      data: {
        templates,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalCount: pagination.totalRecordsCount,
          totalPages: pagination.totalPages,
        },
      },
      metadata: {
        tool: 'list-templates',
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
        tool: 'list-templates',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const listTemplatesDefinition: MCPToolDefinition = {
  name: 'list-templates',
  mcpName: 'mcp__boldsign__list_templates',
  apiEndpoint: '/v1/template/list',
  description: 'List available BoldSign document templates with search and pagination.',
  inputSchema: listTemplatesInputSchema,
  tags: ['templates', 'list', 'search', 'boldsign', 'api'],
  examples: [
    {
      description: 'List all templates',
      input: { pageSize: 10 },
      expectedOutput: '{ templates: [...], pagination: { totalCount: 5 } }',
    },
    {
      description: 'Search for purchase agreement',
      input: { searchTerm: 'purchase agreement' },
      expectedOutput: '{ templates: [...] }',
    },
  ],
};

// =============================================================================
// Get Template Details
// =============================================================================

const getTemplateInputSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
});

export interface GetTemplateInput {
  templateId: string;
}

export interface GetTemplateOutput {
  template: BoldSignTemplate;
  previewUrl?: string;
}

/**
 * Get template details
 */
export async function getTemplate(
  input: GetTemplateInput
): Promise<MCPToolResult<GetTemplateOutput>> {
  const startTime = Date.now();
  const validated = getTemplateInputSchema.parse(input);

  try {
    const response = await callBoldSignAPI(`/template/${validated.templateId}`, {
      method: 'GET',
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
          tool: 'get-template',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = (await response.json()) as {
      templateId: string;
      title: string;
      description?: string;
      createdDate: string;
      modifiedDate?: string;
      roles?: Array<{
        roleId: string;
        roleName: string;
        roleIndex: number;
      }>;
      formFields?: Array<{
        fieldId: string;
        fieldType: string;
        pageNumber: number;
        roleId: string;
        isRequired: boolean;
      }>;
    };

    const template: BoldSignTemplate = {
      templateId: data.templateId,
      title: data.title,
      description: data.description,
      createdDate: data.createdDate,
      modifiedDate: data.modifiedDate,
      roles:
        data.roles?.map((r) => ({
          roleId: r.roleId,
          roleName: r.roleName,
          roleIndex: r.roleIndex,
        })) || [],
      formFields:
        data.formFields?.map((f) => ({
          fieldId: f.fieldId,
          fieldType: f.fieldType,
          pageNumber: f.pageNumber,
          roleId: f.roleId,
          required: f.isRequired,
        })) || [],
    };

    return {
      success: true,
      data: {
        template,
      },
      metadata: {
        tool: 'get-template',
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
        tool: 'get-template',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const getTemplateDefinition: MCPToolDefinition = {
  name: 'get-template',
  mcpName: 'mcp__boldsign__get_template',
  apiEndpoint: '/v1/template/{templateId}',
  description: 'Get detailed information about a BoldSign template including roles and form fields.',
  inputSchema: getTemplateInputSchema,
  tags: ['templates', 'details', 'roles', 'fields', 'boldsign', 'api'],
  examples: [
    {
      description: 'Get template details',
      input: { templateId: 'abc-123' },
      expectedOutput: '{ template: { title: "Purchase Agreement", roles: [...], formFields: [...] } }',
    },
  ],
};

// =============================================================================
// Send From Template
// =============================================================================

const sendFromTemplateInputSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  title: z.string().optional(),
  message: z.string().optional(),
  roles: z.array(
    z.object({
      roleId: z.string(),
      signerEmail: z.string().email(),
      signerName: z.string(),
    })
  ),
  expiryDays: z.number().int().min(1).max(180).optional(),
});

export interface SendFromTemplateInput {
  templateId: string;
  title?: string;
  message?: string;
  roles: Array<{
    roleId: string;
    signerEmail: string;
    signerName: string;
  }>;
  expiryDays?: number;
}

export interface SendFromTemplateOutput {
  success: boolean;
  documentId: string;
  templateId: string;
  signers: Array<{
    roleId: string;
    email: string;
    name: string;
  }>;
}

/**
 * Send document from template
 */
export async function sendFromTemplate(
  input: SendFromTemplateInput
): Promise<MCPToolResult<SendFromTemplateOutput>> {
  const startTime = Date.now();
  const validated = sendFromTemplateInputSchema.parse(input);

  try {
    const payload = {
      templateId: validated.templateId,
      title: validated.title,
      message: validated.message,
      roles: validated.roles.map((r) => ({
        roleId: r.roleId,
        signerEmail: r.signerEmail,
        signerName: r.signerName,
      })),
      expiryDays: validated.expiryDays || 30,
    };

    const response = await callBoldSignAPI('/template/send', {
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
          tool: 'send-from-template',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = (await response.json()) as {
      documentId: string;
    };

    return {
      success: true,
      data: {
        success: true,
        documentId: data.documentId,
        templateId: validated.templateId,
        signers: validated.roles.map((r) => ({
          roleId: r.roleId,
          email: r.signerEmail,
          name: r.signerName,
        })),
      },
      metadata: {
        tool: 'send-from-template',
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
        tool: 'send-from-template',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const sendFromTemplateDefinition: MCPToolDefinition = {
  name: 'send-from-template',
  mcpName: 'mcp__boldsign__send_from_template',
  apiEndpoint: '/v1/template/send',
  description: 'Send a document for signature using a BoldSign template.',
  inputSchema: sendFromTemplateInputSchema,
  tags: ['templates', 'send', 'documents', 'boldsign', 'api'],
  examples: [
    {
      description: 'Send purchase agreement from template',
      input: {
        templateId: 'abc-123',
        roles: [
          { roleId: 'buyer', signerEmail: 'buyer@example.com', signerName: 'John Buyer' },
          { roleId: 'seller', signerEmail: 'seller@example.com', signerName: 'Jane Seller' },
        ],
      },
      expectedOutput: '{ success: true, documentId: "doc-xyz-123" }',
    },
  ],
};
