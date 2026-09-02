import {
  Skeleton,
} from '../../../components/ui'


export function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (_, index) => (
            <Skeleton
              key={index}
              className="h-40 rounded-xl"
            />
          ),
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
        <Skeleton className="h-[390px] rounded-xl" />
        <Skeleton className="h-[390px] rounded-xl" />
      </div>

      <Skeleton className="mt-6 h-80 rounded-xl" />
    </div>
  )
}
