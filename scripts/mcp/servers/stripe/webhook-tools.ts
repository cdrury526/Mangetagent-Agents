/**
 * Stripe: Webhook & Event Tools
 *
 * Tools for listing webhook events and checking webhook health.
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ListWebhookEventsInput,
  ListWebhookEventsOutput,
  WebhookHealthInput,
  WebhookHealthOutput,
  StripeEvent,
} from '../../types/stripe.types.js';
import { callStripeAPI, buildQueryString, transformResponse, SUPABASE_CONFIG } from './config.js';

const SERVER = 'stripe';

// =============================================================================
// List Webhook Events
// =============================================================================

const listWebhookEventsInputSchema = z.object({
  type: z.string().optional(),
  createdAfter: z.number().int().optional(),
  createdBefore: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  startingAfter: z.string().optional(),
  endingBefore: z.string().optional(),
  deliverySuccess: z.boolean().optional(),
});

export async function listWebhookEvents(
  input: ListWebhookEventsInput
): Promise<MCPToolResult<ListWebhookEventsOutput>> {
  const startTime = Date.now();
  const validated = listWebhookEventsInputSchema.parse(input);

  try {
    const params: Record<string, unknown> = {
      limit: validated.limit,
    };

    if (validated.type) params.type = validated.type;
    if (validated.startingAfter) params.starting_after = validated.startingAfter;
    if (validated.endingBefore) params.ending_before = validated.endingBefore;
    if (validated.deliverySuccess !== undefined) params.delivery_success = validated.deliverySuccess;

    if (validated.createdAfter || validated.createdBefore) {
      params.created = {};
      if (validated.createdAfter) (params.created as Record<string, number>).gte = validated.createdAfter;
      if (validated.createdBefore) (params.created as Record<string, number>).lte = validated.createdBefore;
    }

    const response = await callStripeAPI(`/events${buildQueryString(params)}`);

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorData.error?.message || `HTTP ${response.status}`,
          details: errorData.error,
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

    const data = await response.json();
    const events = transformResponse<StripeEvent[]>(data.data || []);

    // Calculate summary
    const byType: Record<string, number> = {};
    for (const event of events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
    }

    return {
      success: true,
      data: {
        events,
        hasMore: data.has_more || false,
        summary: {
          total: events.length,
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
  mcpName: 'mcp__stripe__list_webhook_events',
  apiEndpoint: '/v1/events',
  description: 'Query Stripe events for webhook debugging with type and date filters.',
  inputSchema: listWebhookEventsInputSchema,
  tags: ['webhooks', 'events', 'debugging', 'stripe', 'api'],
  examples: [
    {
      description: 'List recent events',
      input: { limit: 10 },
      expectedOutput: '{ events: [...], hasMore: true, summary: {...} }',
    },
    {
      description: 'List payment events',
      input: { type: 'payment_intent.succeeded', limit: 20 },
      expectedOutput: '{ events: [...] }',
    },
    {
      description: 'List failed deliveries',
      input: { deliverySuccess: false },
      expectedOutput: '{ events: [...] }',
    },
  ],
};

// =============================================================================
// Webhook Health
// =============================================================================

const webhookHealthInputSchema = z.object({
  hours: z.number().int().min(1).max(168).default(24),
});

export async function webhookHealth(
  input: WebhookHealthInput
): Promise<MCPToolResult<WebhookHealthOutput>> {
  const startTime = Date.now();
  const validated = webhookHealthInputSchema.parse(input);

  try {
    const hoursAgo = Math.floor(Date.now() / 1000) - validated.hours * 3600;
    const now = Math.floor(Date.now() / 1000);

    // Get recent events from Stripe
    const eventsResponse = await callStripeAPI(
      `/events?created[gte]=${hoursAgo}&created[lte]=${now}&limit=100`
    );

    if (!eventsResponse.ok) {
      const errorData = await eventsResponse.json();
      return {
        success: false,
        error: {
          code: `HTTP_${eventsResponse.status}`,
          message: errorData.error?.message || `HTTP ${eventsResponse.status}`,
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

    const eventsData = await eventsResponse.json();
    const events = eventsData.data || [];
    const totalEvents = events.length;

    // Try to get local webhook processing stats from Supabase if configured
    let processedEvents = 0;
    let failedEvents = 0;
    const recentErrors: Array<{
      eventId: string;
      eventType: string;
      error: string;
      timestamp: string;
    }> = [];

    if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.serviceRoleKey) {
      try {
        // Query local stripe_webhook_logs table if it exists
        const logsResponse = await fetch(
          `${SUPABASE_CONFIG.url}/rest/v1/stripe_webhook_logs?created_at=gte.${new Date(hoursAgo * 1000).toISOString()}&select=*&order=created_at.desc&limit=100`,
          {
            headers: {
              apikey: SUPABASE_CONFIG.serviceRoleKey,
              Authorization: `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
            },
          }
        );

        if (logsResponse.ok) {
          const logs = await logsResponse.json();
          processedEvents = logs.filter((l: { processed: boolean }) => l.processed).length;
          failedEvents = logs.filter((l: { processed: boolean; error?: string }) => !l.processed || l.error).length;

          // Get recent errors
          const errorLogs = logs.filter((l: { error?: string }) => l.error);
          for (const log of errorLogs.slice(0, 5)) {
            recentErrors.push({
              eventId: log.stripe_event_id || log.id,
              eventType: log.event_type || 'unknown',
              error: log.error,
              timestamp: log.created_at,
            });
          }
        }
      } catch {
        // Table might not exist, continue with Stripe-only data
      }
    }

    // Calculate health status
    const successRate = totalEvents > 0
      ? ((processedEvents || totalEvents) / totalEvents) * 100
      : 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (successRate < 95) status = 'degraded';
    if (successRate < 80) status = 'unhealthy';

    // Generate recommendations
    const recommendations: string[] = [];
    if (failedEvents > 0) {
      recommendations.push(`${failedEvents} events failed processing - check webhook logs`);
    }
    if (totalEvents === 0) {
      recommendations.push('No events received in period - verify webhook endpoint configuration');
    }
    if (status === 'unhealthy') {
      recommendations.push('Consider checking webhook endpoint availability and error handling');
    }

    return {
      success: true,
      data: {
        status,
        period: {
          start: new Date(hoursAgo * 1000).toISOString(),
          end: new Date(now * 1000).toISOString(),
          hours: validated.hours,
        },
        metrics: {
          totalEvents,
          processedEvents: processedEvents || totalEvents,
          failedEvents,
          successRate,
        },
        recentErrors,
        recommendations,
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
  mcpName: 'mcp__stripe__webhook_health',
  description: 'Check webhook processing health and metrics over a time period.',
  inputSchema: webhookHealthInputSchema,
  tags: ['webhooks', 'health', 'monitoring', 'debugging', 'stripe', 'api'],
  examples: [
    {
      description: 'Check last 24 hours',
      input: { hours: 24 },
      expectedOutput: '{ status: "healthy", metrics: {...}, recommendations: [] }',
    },
    {
      description: 'Check last week',
      input: { hours: 168 },
      expectedOutput: '{ status: "healthy", metrics: {...} }',
    },
  ],
};
