import {
  useQuery,
} from '@tanstack/react-query'

import {
  getAuditLogsPage,
} from '../../../api/audit'

import {
  PageHeader,
} from '../../../components/layout'

import {
  Badge,
  Card,
  ErrorState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui'

import {
  formatInternalDate,
} from '../utils/internalFormat'


export function ActivityPage() {
  const query =
    useQuery({
      queryKey: [
        'internal',
        'activity',
      ],
      queryFn: () =>
        getAuditLogsPage({
          limit: 50,
          offset: 0,
        }),
      staleTime: 10_000,
    })

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <PageHeader
        eyebrow="Internal"
        title="Platform activity"
        description="A concise live view of recent authenticated and audited activity across Averlen."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="font-semibold text-slate-950">
            Recent activity
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest 50 audited requests.
          </p>
        </div>

        {query.isLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {Array.from({
              length: 8,
            }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 rounded-xl"
              />
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-5 sm:p-6">
            <ErrorState
              title="Unable to load platform activity"
              description="Averlen couldn't load recent audit activity."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {query.data?.items.map(
                (item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="text-sm text-slate-500">
                        {formatInternalDate(
                          item.created_at,
                        )}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="max-w-60 truncate text-sm text-slate-700">
                          {item.email ?? 'Unauthenticated'}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.organization_id
                            ? `Org ${item.organization_id}`
                            : 'No organization'}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex max-w-xl items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-600">
                          {item.method}
                        </span>
                        <span className="truncate text-sm text-slate-800">
                          {item.path}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          item.status_code >= 400
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {item.status_code}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-slate-500">
                        {item.duration_ms.toFixed(0)} ms
                      </span>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
