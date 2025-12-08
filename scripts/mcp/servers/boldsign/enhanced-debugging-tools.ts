/**
 * BoldSign: Enhanced Debugging Tools
 *
 * Advanced debugging and monitoring tools:
 * - replay-webhook: Re-process failed webhook events
 * - get-api-credits: Check API credit usage and quota
 * - debug-document-timeline: Analyze document signing progress with timing
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ReplayWebhookInput,
  ReplayWebhookOutput,
  GetApiCreditsInput,
  GetApiCreditsOutput,
  DebugDocumentTimelineInput,
  DebugDocumentTimelineOutput,
} from '../../types/boldsign.types.js';
import { callBoldSignAPI, SUPABASE_CONFIG, WEBHOOK_CONFIG } from './config.js';

const SERVER = 'boldsign';

// =============================================================================
// Replay Webhook
// =============================================================================

const replayWebhookInputSchema = z.object({
  eventId: z.string().optional(),
  documentId: z.string().optional(),
  eventType: z
    .enum([
      'document.sent',
      'document.completed',
      'document.declined',
      'document.expired',
      'document.revoked',
      'signer.viewed',
      'signer.signed',
      'signer.completed',
      'signer.declined',
    ])
    .optional(),
  limit: z.number().int().min(1).max(100).default(10),
});

/**
 * Replay failed webhook events
 */
export async function replayWebhook(
  input: ReplayWebhookInput
): Promise<MCPToolResult<ReplayWebhookOutput>> {
  const startTime = Date.now();
  const validated = replayWebhookInputSchema.parse(input);

  try {
    // Build query for failed webhook events
    const params = new URLSearchParams();
    params.append('select', '*');
    params.append('processed', 'eq.false'); // Only failed events

    // Apply filters
    if (validated.eventId) {
      params.append('id', `eq.${validated.eventId}`);
    }
    if (validated.documentId) {
      params.append('document_id', `eq.${validated.documentId}`);
    }
    if (validated.eventType) {
      params.append('event_type', `eq.${validated.eventType}`);
    }

    // Limit results
    params.append('order', 'created_at.desc');
    params.append('limit', String(validated.limit));

    // Query Supabase for failed events
    const response = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/bold_sign_events?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_CONFIG.serviceRoleKey,
          Authorization: `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorText || 'Failed to query webhook events',
        },
        metadata: {
          tool: 'replay-webhook',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const events = (await response.json()) as Array<{
      id: string;
      event_type: string;
      document_id: string;
      payload: Record<string, unknown>;
      created_at: string;
    }>;

    if (events.length === 0) {
      return {
        success: true,
        data: {
          replayedCount: 0,
          successCount: 0,
          failedCount: 0,
          results: [],
        },
        metadata: {
          tool: 'replay-webhook',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Replay each event
    const results: ReplayWebhookOutput['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const event of events) {
      const replayStartTime = Date.now();
      try {
        // Send event to webhook handler
        const webhookResponse = await fetch(WEBHOOK_CONFIG.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BoldSign-Event': event.event_type,
            'X-BoldSign-Replay': 'true',
          },
          body: JSON.stringify(event.payload),
        });

        const success = webhookResponse.ok;
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }

        results.push({
          eventId: event.id,
          eventType: event.event_type,
          success,
          error: success ? undefined : `HTTP ${webhookResponse.status}`,
          processingTimeMs: Date.now() - replayStartTime,
        });
      } catch (error) {
        failedCount++;
        results.push({
          eventId: event.id,
          eventType: event.event_type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTimeMs: Date.now() - replayStartTime,
        });
      }
    }

    return {
      success: true,
      data: {
        replayedCount: events.length,
        successCount,
        failedCount,
        results,
      },
      metadata: {
        tool: 'replay-webhook',
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
        tool: 'replay-webhook',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const replayWebhookDefinition: MCPToolDefinition = {
  name: 'replay-webhook',
  mcpName: 'mcp__boldsign__replay_webhook',
  apiEndpoint: '/rest/v1/bold_sign_events',
  description:
    'Re-process failed webhook events by resending them to the webhook handler.',
  inputSchema: replayWebhookInputSchema,
  tags: ['webhooks', 'debugging', 'retry', 'recovery', 'boldsign', 'api'],
  examples: [
    {
      description: 'Replay specific event',
      input: { eventId: 'evt_123' },
      expectedOutput: '{ replayedCount: 1, successCount: 1, failedCount: 0 }',
    },
    {
      description: 'Replay all failed events for a document',
      input: { documentId: 'doc_abc', limit: 10 },
      expectedOutput: '{ replayedCount: 3, successCount: 2, failedCount: 1 }',
    },
    {
      description: 'Replay failed document.completed events',
      input: { eventType: 'document.completed', limit: 5 },
      expectedOutput: '{ replayedCount: 2, successCount: 2, results: [...] }',
    },
  ],
};

// =============================================================================
// Get API Credits
// =============================================================================

const getApiCreditsInputSchema = z.object({});

/**
 * Get BoldSign API credit usage and quota
 */
export async function getApiCredits(
  input: GetApiCreditsInput
): Promise<MCPToolResult<GetApiCreditsOutput>> {
  const startTime = Date.now();

  try {
    // Call BoldSign API to get credit information
    const response = await callBoldSignAPI('/plan/apiCreditsCount');

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorText || 'Failed to get API credits',
        },
        metadata: {
          tool: 'get-api-credits',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = (await response.json()) as {
      totalCredits?: number;
      usedCredits?: number;
      remainingCredits?: number;
      planType?: string;
      resetsAt?: string;
      usageByOperation?: Record<string, number>;
    };

    // Calculate usage percentage
    const totalCredits = data.totalCredits || 0;
    const usedCredits = data.usedCredits || 0;
    const remainingCredits = data.remainingCredits || totalCredits - usedCredits;
    const usagePercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;

    return {
      success: true,
      data: {
        totalCredits,
        usedCredits,
        remainingCredits,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        resetsAt: data.resetsAt,
        planType: data.planType,
        usageByOperation: data.usageByOperation,
      },
      metadata: {
        tool: 'get-api-credits',
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
        tool: 'get-api-credits',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const getApiCreditsDefinition: MCPToolDefinition = {
  name: 'get-api-credits',
  mcpName: 'mcp__boldsign__get_api_credits',
  apiEndpoint: '/v1/plan/apiCreditsCount',
  description:
    'Check BoldSign API credit usage, quota, and remaining credits for monitoring.',
  inputSchema: getApiCreditsInputSchema,
  tags: ['api', 'credits', 'usage', 'quota', 'monitoring', 'boldsign'],
  examples: [
    {
      description: 'Get current API credit usage',
      input: {},
      expectedOutput:
        '{ totalCredits: 1000, usedCredits: 450, remainingCredits: 550, usagePercentage: 45 }',
    },
  ],
};

// =============================================================================
// Debug Document Timeline
// =============================================================================

const debugDocumentTimelineInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
});

/**
 * Analyze document signing timeline and identify bottlenecks
 */
export async function debugDocumentTimeline(
  input: DebugDocumentTimelineInput
): Promise<MCPToolResult<DebugDocumentTimelineOutput>> {
  const startTime = Date.now();
  const validated = debugDocumentTimelineInputSchema.parse(input);

  try {
    // Get document details
    const docResponse = await callBoldSignAPI(`/document/${validated.documentId}`);

    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      return {
        success: false,
        error: {
          code: `HTTP_${docResponse.status}`,
          message: errorText || 'Failed to get document details',
        },
        metadata: {
          tool: 'debug-document-timeline',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const document = (await docResponse.json()) as {
      documentId: string;
      title: string;
      status: string;
      createdDate: string;
      completedDate?: string;
      signers?: Array<{
        signerEmail: string;
        signerName: string;
        status: string;
        signedDate?: string;
        viewedDate?: string;
      }>;
    };

    // Get audit trail events
    const auditResponse = await callBoldSignAPI(`/document/${validated.documentId}/auditTrail`);

    let events: Array<{
      timestamp: string;
      event: string;
      actor: string;
      actorEmail?: string;
      details?: Record<string, unknown>;
    }> = [];

    if (auditResponse.ok) {
      const auditData = (await auditResponse.json()) as {
        events?: Array<{
          eventType: string;
          eventDate: string;
          actor: string;
          details?: string;
        }>;
      };

      events =
        auditData.events?.map((e) => ({
          timestamp: e.eventDate,
          event: e.eventType,
          actor: e.actor,
          details: e.details ? { description: e.details } : undefined,
        })) || [];
    }

    // Build timeline with durations
    const timeline = events.map((event, index) => {
      const currentTime = new Date(event.timestamp).getTime();
      const previousTime =
        index > 0 ? new Date(events[index - 1].timestamp).getTime() : currentTime;
      const durationSinceLastMs = currentTime - previousTime;

      return {
        timestamp: event.timestamp,
        event: event.event,
        actor: event.actor,
        actorEmail: event.actorEmail,
        durationSinceLastMs,
        details: event.details,
      };
    });

    // Calculate metrics
    const createdTime = new Date(document.createdDate).getTime();
    const completedTime = document.completedDate
      ? new Date(document.completedDate).getTime()
      : Date.now();
    const totalDurationMs = completedTime - createdTime;

    // Find first view
    const firstViewEvent = events.find((e) => e.event.toLowerCase().includes('view'));
    const timeToFirstViewMs = firstViewEvent
      ? new Date(firstViewEvent.timestamp).getTime() - createdTime
      : undefined;

    // Calculate time to completion
    const timeToCompletionMs = document.completedDate ? totalDurationMs : undefined;

    // Calculate average signing time per signer
    const signingTimes: number[] = [];
    document.signers?.forEach((signer) => {
      if (signer.viewedDate && signer.signedDate) {
        const viewTime = new Date(signer.viewedDate).getTime();
        const signTime = new Date(signer.signedDate).getTime();
        signingTimes.push(signTime - viewTime);
      }
    });

    const averageSigningTimeMs =
      signingTimes.length > 0
        ? signingTimes.reduce((a, b) => a + b, 0) / signingTimes.length
        : undefined;

    // Identify bottlenecks (pending signers with long wait times)
    const bottlenecks =
      document.signers
        ?.filter((s) => s.status === 'pending' || s.status === 'viewed')
        .map((signer) => {
          const signerViewTime = signer.viewedDate
            ? new Date(signer.viewedDate).getTime()
            : createdTime;
          const waitTimeMs = Date.now() - signerViewTime;

          return {
            signer: signer.signerName,
            signerEmail: signer.signerEmail,
            waitTimeMs,
            status: signer.status,
          };
        })
        .sort((a, b) => b.waitTimeMs - a.waitTimeMs) || [];

    return {
      success: true,
      data: {
        documentId: document.documentId,
        documentTitle: document.title,
        currentStatus: document.status,
        timeline,
        metrics: {
          totalDurationMs,
          timeToFirstViewMs,
          timeToCompletionMs,
          averageSigningTimeMs,
          bottlenecks,
        },
      },
      metadata: {
        tool: 'debug-document-timeline',
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
        tool: 'debug-document-timeline',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const debugDocumentTimelineDefinition: MCPToolDefinition = {
  name: 'debug-document-timeline',
  mcpName: 'mcp__boldsign__debug_document_timeline',
  apiEndpoint: '/v1/document/{documentId}',
  description:
    'Visualize document signing timeline with event durations and identify signing bottlenecks.',
  inputSchema: debugDocumentTimelineInputSchema,
  tags: ['debugging', 'timeline', 'performance', 'analytics', 'boldsign', 'api'],
  examples: [
    {
      description: 'Debug document timeline',
      input: { documentId: 'doc_abc123' },
      expectedOutput:
        '{ timeline: [...events], metrics: { totalDurationMs: 86400000, bottlenecks: [...] } }',
    },
  ],
};
