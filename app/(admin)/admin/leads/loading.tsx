// Leads CRM loading skeleton
export default function LeadsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="h-8 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="h-4 w-72 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[28px] p-6">
        <div className="flex gap-4 flex-wrap">
          <div className="h-10 w-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 w-28 bg-zinc-100 dark:bg-zinc-800 rounded-xl ml-auto" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[28px] overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
          {[40, 15, 15, 15, 15].map((w, i) => (
            <div key={i} className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" style={{ width: `${w}%` }} />
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
            <div className="flex items-center gap-3 w-[40%]">
              <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg w-3/4" />
                <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/2" />
              </div>
            </div>
            <div className="w-[15%]"><div className="h-6 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" /></div>
            <div className="w-[15%]"><div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full" /></div>
            <div className="w-[15%]"><div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" /></div>
            <div className="w-[15%] flex justify-end"><div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl" /></div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-9 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
