import {
  apiRequest,
} from './client'


export type SearchResultType =
  | 'property'
  | 'upload_job'
  | 'workspace_member'
  | 'ai_insight'
  | 'pricing_recommendation'


export type SearchResult = {
  type:
    SearchResultType

  id:
    number

  title:
    string

  subtitle:
    string |
    null

  extra:
    Record<
      string,
      unknown
    >
}


export type SearchResponse = {
  query:
    string

  results:
    SearchResult[]
}


export async function searchAverlen(
  query: string,
  limit = 20,
) {
  const params =
    new URLSearchParams({
      q:
        query.trim(),

      limit:
        String(
          limit,
        ),
    })

  return apiRequest<SearchResponse>(
    `/api/search?${params.toString()}`,
  )
}
