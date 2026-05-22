// Dashboard loading skeleton
export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="h-4 w-80 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[28px] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
              <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            </div>
            <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
            <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart Skeleton */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 min-h-[480px]">
          <div className="mb-8 space-y-2">
            <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
            <div className="h-7 w-40 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
          </div>
          <div className="flex items-end gap-3" style={{ height: "220px" }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3">
                <div
                  className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                  style={{ height: `${30 + Math.random() * 60}%` }}
                />
                <div className="h-2 w-6 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Source Panel Skeleton */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 min-h-[480px] space-y-6">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
            <div className="h-7 w-36 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
          <div className="h-20 bg-zinc-50 dark:bg-zinc-900 rounded-2xl" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                <div className="h-3 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
