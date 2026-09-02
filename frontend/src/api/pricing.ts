import { z } from 'zod'

import {
  apiRequest,
} from './client'


const pricingFactorSchema =
  z.object({
    name: z.string(),
    value: z.string(),
    impact: z.string(),
    explanation: z.string(),
  })


const pricingRecommendationSchema =
  z.object({
    property_id:
      z.number(),

    current_base_price:
      z.number(),

    recommended_price:
      z.number(),

    demand_score:
      z.number(),

    confidence_score:
      z.number(),

    adjustment_type:
      z.string(),

    reason:
      z.string(),

    property_average_price:
      z.number(),

    city_average_price:
      z.number(),

    booking_volume:
      z.number(),

    city_booking_volume:
      z.number(),

    price_change_percent:
      z.number(),

    risk_level:
      z.string(),

    data_quality:
      z.string(),

    explanation_summary:
      z.string(),

    pricing_factors:
      z.array(
        pricingFactorSchema,
      ),
  })


const pricingHistoryItemSchema =
  pricingRecommendationSchema.extend({
    id:
      z.number(),

    organization_id:
      z.number(),

    created_by_user_id:
      z.number()
        .nullable(),

    status:
      z.string(),

    created_at:
      z.string(),
  })


const pricingHistoryResponseSchema =
  z.object({
    items:
      z.array(
        pricingHistoryItemSchema,
      ),

    total:
      z.number(),

    limit:
      z.number(),

    offset:
      z.number(),
  })


export type PricingFactor =
  z.infer<
    typeof pricingFactorSchema
  >


export type PricingRecommendation =
  z.infer<
    typeof pricingRecommendationSchema
  >


export type PricingRecommendationHistory =
  z.infer<
    typeof pricingHistoryItemSchema
  >


export type PricingHistoryResponse =
  z.infer<
    typeof pricingHistoryResponseSchema
  >


export type PricingHistoryStatus =
  | 'generated'
  | 'accepted'
  | 'rejected'
  | 'applied'


export async function getPricingRecommendation(
  propertyId: number,
): Promise<PricingRecommendation> {
  const raw =
    await apiRequest<unknown>(
      `/api/recommendations/pricing/${propertyId}`,
    )

  return pricingRecommendationSchema.parse(
    raw,
  )
}


export async function generatePricingRecommendation(
  propertyId: number,
): Promise<PricingRecommendationHistory> {
  const raw =
    await apiRequest<unknown>(
      `/api/recommendations/pricing/${propertyId}/generate`,
      {
        method: 'POST',
      },
    )

  return pricingHistoryItemSchema.parse(
    raw,
  )
}


export async function getPricingHistory(
  propertyId: number,
  limit = 10,
  offset = 0,
): Promise<PricingHistoryResponse> {
  const params =
    new URLSearchParams({
      limit:
        String(limit),

      offset:
        String(offset),
    })

  const raw =
    await apiRequest<unknown>(
      `/api/recommendations/pricing/${propertyId}/history?${params.toString()}`,
    )

  return pricingHistoryResponseSchema.parse(
    raw,
  )
}


export async function updatePricingRecommendationStatus(
  historyId: number,
  status: PricingHistoryStatus,
): Promise<PricingRecommendationHistory> {
  const raw =
    await apiRequest<unknown>(
      `/api/recommendations/pricing/history/${historyId}/status`,
      {
        method: 'PATCH',

        body: {
          status,
        },
      },
    )

  return pricingHistoryItemSchema.parse(
    raw,
  )
}