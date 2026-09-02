import {
  useEffect,
} from 'react'

import {
  useQuery,
} from '@tanstack/react-query'

import {
  RefreshCw,
} from 'lucide-react'

import {
  useNavigate,
  useParams,
} from 'react-router'

import {
  getAuditLogsPage,
} from '../../api/audit'

import {
  ApiError,
} from '../../api/client'

import {
  PageHeader,
} from '../../components/layout'

import {
  Button,
} from '../../components/ui'

import {
  AuditLogTable,
} from './components/AuditLogTable'

import {
  AuditSummary,
} from './components/AuditSummary'


const AUDIT_PAGE_SIZE =
  50


function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof
    ApiError
  ) {
    return error.message
  }

  if (
    error instanceof
    Error
  ) {
    return error.message
  }

  return fallback
}


function parsePageNumber(
  value:
    string |
    undefined,
): number | null {
  if (!value) {
    return 1
  }

  if (
    !/^\d+$/.test(
      value,
    )
  ) {
    return null
  }

  const parsed =
    Number.parseInt(
      value,
      10,
    )

  if (
    !Number.isFinite(
      parsed,
    ) ||
    parsed < 1
  ) {
    return null
  }

  return parsed
}


function getAuditPagePath(
  page: number,
) {
  if (
    page <= 1
  ) {
    return '/internal/audit'
  }

  return (
    `/internal/audit/${page}`
  )
}


export function AuditPage() {
  const {
    page:
      pageParam,
  } =
    useParams<{
      page?: string
    }>()


  const navigate =
    useNavigate()


  const parsedPage =
    parsePageNumber(
      pageParam,
    )


  const page =
    parsedPage ??
    1


  const offset =
    (
      page - 1
    ) *
    AUDIT_PAGE_SIZE


  const auditQuery =
    useQuery({
      queryKey: [
        'audit',
        'page',
        {
          limit:
            AUDIT_PAGE_SIZE,

          offset,
        },
      ],

      queryFn: () =>
        getAuditLogsPage({
          limit:
            AUDIT_PAGE_SIZE,

          offset,
        }),

      staleTime:
        10_000,
    })


  const data =
    auditQuery.data


  const items =
    data?.items ??
    []


  const total =
    data?.total ??
    0


  const pageCount =
    Math.max(
      1,
      Math.ceil(
        total /
          AUDIT_PAGE_SIZE,
      ),
    )


  const errorMessage =
    auditQuery.isError
      ? getErrorMessage(
          auditQuery.error,
          "Averlen couldn't load audit activity.",
        )
      : null


  useEffect(
    () => {
      if (
        pageParam &&
        parsedPage ===
          null
      ) {
        navigate(
          '/internal/audit',
          {
            replace:
              true,
          },
        )
      }
    },
    [
      navigate,
      pageParam,
      parsedPage,
    ],
  )


  useEffect(
    () => {
      if (
        pageParam &&
        parsedPage ===
          1
      ) {
        navigate(
          '/internal/audit',
          {
            replace:
              true,
          },
        )
      }
    },
    [
      navigate,
      pageParam,
      parsedPage,
    ],
  )


  useEffect(
    () => {
      if (
        !data ||
        parsedPage ===
          null ||
        page <=
          pageCount
      ) {
        return
      }

      navigate(
        getAuditPagePath(
          pageCount,
        ),
        {
          replace:
            true,
        },
      )
    },
    [
      data,
      navigate,
      page,
      pageCount,
      parsedPage,
    ],
  )


  function handlePageChange(
    nextPage: number,
  ) {
    if (
      nextPage < 1 ||
      nextPage >
        pageCount ||
      nextPage ===
        page
    ) {
      return
    }


    navigate(
      getAuditPagePath(
        nextPage,
      ),
    )


    window.scrollTo({
      top: 0,
      behavior:
        'smooth',
    })
  }


  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Internal"
        title="Audit logs"
        description="Review platform-wide API activity across every Averlen organization."
        actions={
          <Button
            variant="secondary"
            disabled={
              auditQuery
                .isFetching
            }
            onClick={() => {
              void auditQuery
                .refetch()
            }}
          >
            <RefreshCw
              size={16}
              aria-hidden="true"
              className={
                auditQuery
                  .isFetching
                  ? 'animate-spin'
                  : undefined
              }
            />

            {auditQuery
              .isFetching
              ? 'Refreshing'
              : 'Refresh'}
          </Button>
        }
      />


      <AuditSummary
        items={
          items
        }
        total={
          total
        }
        isLoading={
          auditQuery
            .isLoading
        }
      />


      <AuditLogTable
        items={
          items
        }
        total={
          total
        }
        page={
          page
        }
        pageCount={
          pageCount
        }
        limit={
          AUDIT_PAGE_SIZE
        }
        isLoading={
          auditQuery
            .isLoading
        }
        isError={
          auditQuery
            .isError
        }
        errorMessage={
          errorMessage
        }
        onPageChange={
          handlePageChange
        }
        onRetry={() => {
          void auditQuery
            .refetch()
        }}
      />
    </div>
  )
}