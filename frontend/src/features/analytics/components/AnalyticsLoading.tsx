import {
  Skeleton,
} from '../../../components/ui'


export function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <Skeleton className="mt-8 h-40 rounded-xl" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <Skeleton className="mt-6 h-96 rounded-xl" />
      <Skeleton className="mt-6 h-80 rounded-xl" />
    </div>
  )
}
