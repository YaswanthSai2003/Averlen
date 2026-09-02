import { z } from 'zod'

import {
  apiRequest,
} from './client'


// Accept legacy source values in stored insight history.
const insightSourceSchema =
  z.string()
    .min(1)


const insightConfidenceSchema =
  z.enum([
    'low',
    'medium',
    'high',
  ])


const insightResponseSchema =
  z.object({
    question:
      z.string(),

    answer:
      z.string(),

    supporting_facts:
      z.array(
        z.string(),
      ),

    confidence:
      insightConfidenceSchema,

    context_summary:
      z.string(),

    source:
      insightSourceSchema,
  })


const insightHistoryItemSchema =
  insightResponseSchema.extend({
    id:
      z.number(),

    organization_id:
      z.number(),

    user_id:
      z.number()
        .nullable(),

    is_pinned:
      z.boolean(),

    created_at:
      z.string(),
  })


const insightHistoryResponseSchema =
  z.object({
    items:
      z.array(
        insightHistoryItemSchema,
      ),

    total:
      z.number(),

    limit:
      z.number(),

    offset:
      z.number(),
  })


const deleteInsightResponseSchema =
  z.object({
    message:
      z.string(),
  })


export type InsightSource =
  z.infer<
    typeof insightSourceSchema
  >


export type InsightConfidence =
  z.infer<
    typeof insightConfidenceSchema
  >


export type InsightResponse =
  z.infer<
    typeof insightResponseSchema
  >


export type InsightHistoryItem =
  z.infer<
    typeof insightHistoryItemSchema
  >


export type InsightHistoryResponse =
  z.infer<
    typeof insightHistoryResponseSchema
  >


export type InsightHistoryQuery = {
  pinnedOnly?: boolean
  limit?: number
  offset?: number
}


export async function queryInsight(
  question: string,
): Promise<InsightResponse> {
  const raw =
    await apiRequest<unknown>(
      '/api/insights/query',
      {
        method: 'POST',

        body: {
          question,
        },
      },
    )

  return insightResponseSchema.parse(
    raw,
  )
}


export async function getInsightHistory(
  query: InsightHistoryQuery = {},
): Promise<InsightHistoryResponse> {
  const params =
    new URLSearchParams()

  if (query.pinnedOnly) {
    params.set(
      'pinned_only',
      'true',
    )
  }

  params.set(
    'limit',
    String(
      query.limit ??
      20,
    ),
  )

  params.set(
    'offset',
    String(
      query.offset ??
      0,
    ),
  )

  const raw =
    await apiRequest<unknown>(
      `/api/insights/history?${params.toString()}`,
    )

  return insightHistoryResponseSchema
    .parse(
      raw,
    )
}


export async function toggleInsightPin(
  insightId: number,
): Promise<InsightHistoryItem> {
  const raw =
    await apiRequest<unknown>(
      `/api/insights/history/${insightId}/pin`,
      {
        method: 'PATCH',
      },
    )

  return insightHistoryItemSchema
    .parse(
      raw,
    )
}


export async function deleteInsight(
  insightId: number,
): Promise<{
  message: string
}> {
  const raw =
    await apiRequest<unknown>(
      `/api/insights/history/${insightId}`,
      {
        method: 'DELETE',
      },
    )

  return deleteInsightResponseSchema
    .parse(
      raw,
    )
}