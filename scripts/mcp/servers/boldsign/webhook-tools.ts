/**
 * BoldSign: Webhook Tools
 *
 * Tools for debugging and monitoring webhook events:
 * - list-webhook-events: Query webhook event history from database
 * - webhook-health: Check webhook processing health and metrics
 * - test-webhook: Send test webhook payloads
 *
 * These tools query the local Supabase database where webhook events are stored.
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ListWebhookEventsInput,
  ListWebhookEventsOutput,
  WebhookHealthInput,
  WebhookHealthOutput,
  TestWebhookInput,
  TestWebhookOutput,
  WebhookEvent,
  EnhancedWebhookHealthInput,
  EnhancedWebhookHealthOutput,
  WebhookAlert,
} from '../../types/boldsign.types.js';
import { SUPABASE_CONFIG, WEBHOOK_CONFIG } from './config.js';

const SERVER = 'boldsign';

// =============================================================================
// List Webhook Events
// =============================================================================

const listEventsInputSchema = z.object({
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
  processed: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

/**
 * List webhook events from database
 */
export async function listWebhookEvents(
  input: ListWebhookEventsInput
): Promise<MCPToolResult<ListWebhookEventsOutput>> {
  const startTime = Date.now();
  const validated = listEventsInputSchema.parse(input);

  try {
    // Build PostgREST query for bold_sign_events table
    const params = new URLSearchParams();

    // Select fields
    params.append('select', '*');

    // Filters
    if (validated.documentId) {
      params.append('document_id', `eq.${validated.documentId}`);
    }
    if (validated.eventType) {
      params.append('event_type', `eq.${validated.eventType}`);
    }
    if (validated.processed !== undefined) {
      params.append('processed', `eq.${validated.processed}`);
    }
    if (validated.startDate) {
      params.append('created_at', `gte.${validated.startDate}`);
    }
    if (validated.endDate) {
      params.append('created_at', `lte.${validated.endDate}`);
    }

    // Pagination and ordering
    params.append('order', 'created_at.desc');
    params.append('limit', String(validated.limit));
    params.append('offset', String(validated.offset));

    // Query Supabase
    const response = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/bold_sign_events?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_CONFIG.serviceRoleKey,
          Authorization: `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'count=exact',
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
          tool: 'list-webhook-events',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = (await response.json()) as Array<{
      id: string;
      event_type: string;
      document_id: string;
      created_at: string;
      processed: boolean;
      processing_error?: string;
      payload: Record<string, unknown>;
      signer_email?: string;
      ip_address?: string;
    }>;

    // Get total count from header
    const totalCount = parseInt(response.headers.get('content-range')?.split('/')[1] || '0', 10);

    // Transform to output format
    const events: WebhookEvent[] = data.map((row) => ({
      id: row.id,
      eventType: row.event_type as WebhookEvent['eventType'],
      documentId: row.document_id,
      timestamp: row.created_at,
      processed: row.processed,
      processingError: row.processing_error,
      payload: row.payload,
      signerEmail: row.signer_email,
      ipAddress: row.ip_address,
    }));

    // Calculate summary
    const processed = events.filter((e) => e.processed).length;
    const failed = events.filter((e) => !e.processed && e.processingError).length;
    const byType: Record<string, number> = {};
    events.forEach((e) => {
      byType[e.eventType] = (byType[e.eventType] || 0) + 1;
    });

    return {
      success: true,
      data: {
        events,
        summary: {
          total: totalCount || events.length,
          processed,
          failed,
          byType,
        },
      },
      metadata: {
        tool: 'list-webhook-events',
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
        tool: 'list-webhook-events',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const listWebhookEventsDefinition: MCPToolDefinition = {
  name: 'list-webhook-events',
  mcpName: 'mcp__boldsign__list_webhook_events',
  apiEndpoint: '/rest/v1/bold_sign_events',
  description:
    'List and filter BoldSign webhook events from the database for debugging and audit purposes.',
  inputSchema: listEventsInputSchema,
  tags: ['webhooks', 'events', 'debugging', 'audit', 'boldsign', 'api'],
  examples: [
    {
      description: 'List recent events for a document',
      input: { documentId: 'abc-123', limit: 10 },
      expectedOutput: '{ events: [...], summary: { total: 5, processed: 4, failed: 1 } }',
    },
    {
      description: 'List failed webhook events',
      input: { processed: false, limit: 20 },
      expectedOutput: '{ events: [...] }',
    },
  ],
};

// =============================================================================
// Webhook Health Check
// =============================================================================

const webhookHealthInputSchema = z.object({
  hours: z.number().int().min(1).max(168).default(24), // Max 7 days
  alertThresholds: z
    .object({
      errorRatePercent: z.number().min(0).max(100).optional(),
      processingTimeMs: z.number().min(0).optional(),
      backlogCount: z.number().int().min(0).optional(),
    })
    .optional(),
});

/**
 * Check webhook processing health
 */
export async function webhookHealth(
  input: EnhancedWebhookHealthInput
): Promise<MCPToolResult<EnhancedWebhookHealthOutput>> {
  const startTime = Date.now();
  const validated = webhookHealthInputSchema.parse(input);

  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - validated.hours * 60 * 60 * 1000);

    // Query webhook_metrics table for health data
    const metricsResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/webhook_metrics?` +
        `created_at=gte.${startDate.toISOString()}&` +
        `created_at=lte.${endDate.toISOString()}&` +
        `order=created_at.desc&limit=1000`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_CONFIG.serviceRoleKey,
          Authorization: `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Query recent errors from bold_sign_events
    const errorsResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/bold_sign_events?` +
        `processed=eq.false&` +
        `processing_error=not.is.null&` +
        `created_at=gte.${startDate.toISOString()}&` +
        `order=created_at.desc&limit=10`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_CONFIG.serviceRoleKey,
          Authorization: `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Count total events in period
    const totalResponse = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/bold_sign_events?` +
        `created_at=gte.${startDate.toISOString()}&` +
        `created_at=lte.${endDate.toISOString()}&` +
        `select=id,processed`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_CONFIG.serviceRoleKey,
          Authorization: `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'count=exact',
        },
      }
    );

    const metrics = metricsResponse.ok
      ? ((await metricsResponse.json()) as Array<{
          processing_time_ms: number;
          success: boolean;
        }>)
      : [];

    const errors = errorsResponse.ok
      ? ((await errorsResponse.json()) as Array<{
          id: string;
          event_type: string;
          processing_error: string;
          created_at: string;
        }>)
      : [];

    const totalEvents = totalResponse.ok
      ? ((await totalResponse.json()) as Array<{ id: string; processed: boolean }>)
      : [];

    // Calculate metrics
    const totalCount = totalEvents.length;
    const processedCount = totalEvents.filter((e) => e.processed).length;
    const failedCount = totalCount - processedCount;
    const successRate = totalCount > 0 ? (processedCount / totalCount) * 100 : 100;

    const processingTimes = metrics.map((m) => m.processing_time_ms).filter((t) => t > 0);
    const avgProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

    // Calculate P95
    const sortedTimes = [...processingTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95ProcessingTime = sortedTimes[p95Index] || avgProcessingTime;

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    const recommendations: string[] = [];

    if (successRate >= 99 && avgProcessingTime < 1000) {
      status = 'healthy';
    } else if (successRate >= 95 && avgProcessingTime < 3000) {
      status = 'degraded';
      if (successRate < 99) {
        recommendations.push(`Success rate is ${successRate.toFixed(1)}% - investigate failed events`);
      }
      if (avgProcessingTime >= 1000) {
        recommendations.push(`Average processing time is ${avgProcessingTime.toFixed(0)}ms - consider optimization`);
      }
    } else {
      status = 'unhealthy';
      if (successRate < 95) {
        recommendations.push(`Critical: Success rate is only ${successRate.toFixed(1)}%`);
      }
      if (avgProcessingTime >= 3000) {
        recommendations.push(`Critical: Average processing time is ${avgProcessingTime.toFixed(0)}ms`);
      }
      if (failedCount > 0) {
        recommendations.push(`${failedCount} events failed in the last ${validated.hours} hours`);
      }
    }

    if (errors.length > 0) {
      recommendations.push(`${errors.length} recent errors need attention`);
    }

    // Generate alerts based on thresholds
    const alerts: WebhookAlert[] = [];

    if (validated.alertThresholds?.errorRatePercent !== undefined) {
      const errorRate = 100 - successRate;
      if (errorRate > validated.alertThresholds.errorRatePercent) {
        alerts.push({
          type: 'error_rate',
          threshold: validated.alertThresholds.errorRatePercent,
          actual: Math.round(errorRate * 100) / 100,
          severity:
            errorRate > validated.alertThresholds.errorRatePercent * 2 ? 'critical' : 'warning',
          message: `Error rate ${errorRate.toFixed(1)}% exceeds threshold ${validated.alertThresholds.errorRatePercent}%`,
        });
      }
    }

    if (validated.alertThresholds?.processingTimeMs !== undefined) {
      if (p95ProcessingTime > validated.alertThresholds.processingTimeMs) {
        alerts.push({
          type: 'latency',
          threshold: validated.alertThresholds.processingTimeMs,
          actual: Math.round(p95ProcessingTime),
          severity:
            p95ProcessingTime > validated.alertThresholds.processingTimeMs * 2
              ? 'critical'
              : 'warning',
          message: `P95 processing time ${p95ProcessingTime.toFixed(0)}ms exceeds threshold ${validated.alertThresholds.processingTimeMs}ms`,
        });
      }
    }

    if (validated.alertThresholds?.backlogCount !== undefined) {
      if (failedCount > validated.alertThresholds.backlogCount) {
        alerts.push({
          type: 'backlog',
          threshold: validated.alertThresholds.backlogCount,
          actual: failedCount,
          severity:
            failedCount > validated.alertThresholds.backlogCount * 2 ? 'critical' : 'warning',
          message: `Backlog of ${failedCount} failed events exceeds threshold ${validated.alertThresholds.backlogCount}`,
        });
      }
    }

    return {
      success: true,
      data: {
        status,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          hours: validated.hours,
        },
        metrics: {
          totalEvents: totalCount,
          processedEvents: processedCount,
          failedEvents: failedCount,
          successRate: Math.round(successRate * 100) / 100,
          averageProcessingTimeMs: Math.round(avgProcessingTime),
          p95ProcessingTimeMs: Math.round(p95ProcessingTime),
        },
        recentErrors: errors.map((e) => ({
          eventId: e.id,
          eventType: e.event_type,
          error: e.processing_error,
          timestamp: e.created_at,
        })),
        recommendations,
        alerts: alerts.length > 0 ? alerts : undefined,
      },
      metadata: {
        tool: 'webhook-health',
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
        tool: 'webhook-health',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const webhookHealthDefinition: MCPToolDefinition = {
  name: 'webhook-health',
  mcpName: 'mcp__boldsign__webhook_health',
  apiEndpoint: '/rest/v1/webhook_metrics',
  description:
    'Check BoldSign webhook processing health including success rates, latency, recent errors, and configurable alert thresholds.',
  inputSchema: webhookHealthInputSchema,
  tags: ['webhooks', 'health', 'monitoring', 'debugging', 'alerts', 'boldsign', 'api'],
  examples: [
    {
      description: 'Check last 24 hours',
      input: { hours: 24 },
      expectedOutput:
        '{ status: "healthy", metrics: { successRate: 99.5, ... }, recommendations: [] }',
    },
    {
      description: 'Check last week',
      input: { hours: 168 },
      expectedOutput: '{ status: "degraded", recommendations: ["..."] }',
    },
    {
      description: 'Check with alert thresholds',
      input: {
        hours: 24,
        alertThresholds: { errorRatePercent: 5, processingTimeMs: 2000, backlogCount: 10 },
      },
      expectedOutput:
        '{ status: "healthy", metrics: {...}, alerts: [{ type: "latency", severity: "warning", ... }] }',
    },
  ],
};

// =============================================================================
// Test Webhook
// =============================================================================

const testWebhookInputSchema = z.object({
  eventType: z.enum([
    'document.sent',
    'document.completed',
    'document.declined',
    'document.expired',
    'document.revoked',
    'signer.viewed',
    'signer.signed',
    'signer.completed',
    'signer.declined',
  ]),
  documentId: z.string().optional(),
  signerEmail: z.string().email().optional(),
});

/**
 * Send a test webhook payload to verify webhook handler
 */
export async function testWebhook(
  input: TestWebhookInput
): Promise<MCPToolResult<TestWebhookOutput>> {
  const startTime = Date.now();
  const validated = testWebhookInputSchema.parse(input);

  try {
    // Generate test document ID if not provided
    const documentId = validated.documentId || `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const eventId = `test_event_${Date.now()}`;

    // Build test payload matching BoldSign webhook format
    const payload: Record<string, unknown> = {
      event: {
        type: validated.eventType,
        date: new Date().toISOString(),
      },
      data: {
        documentId,
        documentTitle: 'Test Document',
        status: validated.eventType.includes('completed')
          ? 'Completed'
          : validated.eventType.includes('declined')
          ? 'Declined'
          : validated.eventType.includes('expired')
          ? 'Expired'
          : validated.eventType.includes('revoked')
          ? 'Revoked'
          : 'InProgress',
        senderDetail: {
          emailAddress: 'test@example.com',
          name: 'Test Sender',
        },
      },
    };

    // Add signer info for signer events
    if (validated.eventType.startsWith('signer.') && validated.signerEmail) {
      (payload.data as Record<string, unknown>).signerDetail = {
        signerEmail: validated.signerEmail,
        signerName: 'Test Signer',
        status: validated.eventType.includes('signed')
          ? 'Signed'
          : validated.eventType.includes('viewed')
          ? 'Viewed'
          : validated.eventType.includes('declined')
          ? 'Declined'
          : 'Pending',
      };
    }

    // Send to webhook endpoint
    const webhookUrl = WEBHOOK_CONFIG.webhookUrl;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BoldSign-Event': validated.eventType,
        'X-BoldSign-Test': 'true',
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text();

    return {
      success: true,
      data: {
        success: response.ok,
        eventId,
        webhookUrl,
        requestPayload: payload,
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 500),
        processingTimeMs: Date.now() - startTime,
      },
      metadata: {
        tool: 'test-webhook',
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
        tool: 'test-webhook',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const testWebhookDefinition: MCPToolDefinition = {
  name: 'test-webhook',
  mcpName: 'mcp__boldsign__test_webhook',
  apiEndpoint: WEBHOOK_CONFIG.webhookUrl,
  description:
    'Send a test webhook payload to verify webhook handler is working correctly.',
  inputSchema: testWebhookInputSchema,
  tags: ['webhooks', 'testing', 'debugging', 'boldsign', 'api'],
  examples: [
    {
      description: 'Test document.completed event',
      input: { eventType: 'document.completed' },
      expectedOutput: '{ success: true, responseStatus: 200 }',
    },
    {
      description: 'Test signer.signed event',
      input: { eventType: 'signer.signed', signerEmail: 'test@example.com' },
      expectedOutput: '{ success: true, responseStatus: 200 }',
    },
  ],
};
