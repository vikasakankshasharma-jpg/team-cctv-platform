/**
 * Quote result page loading skeleton.
 * Shown while the quote page fetches lead + pricing data from Firestore.
 */
export default function QuoteLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 animate-pulse">
      {/* Hero section */}
      <div className="px-4 sm:px-6 pt-12 sm:pt-20 pb-10 sm:pb-16 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="h-7 w-44 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mx-auto mb-6" />
        {/* H1 */}
        <div className="space-y-3 text-center mb-8">
          <div className="h-10 sm:h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-full max-w-lg mx-auto" />
          <div className="h-10 sm:h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-4/5 max-w-sm mx-auto" />
        </div>
        {/* Subtitle */}
        <div className="h-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl w-72 mx-auto mb-10" />

        {/* Price card skeleton */}
        <div className="bg-zinc-900/5 dark:bg-zinc-800/40 rounded-[32px] p-6 sm:p-10 max-w-2xl mx-auto">
          <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-700 rounded-full mb-4" />
          <div className="h-16 w-56 bg-zinc-200 dark:bg-zinc-700 rounded-2xl mb-4" />
          <div className="h-3 w-40 bg-zinc-100 dark:bg-zinc-700 rounded-full" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4 pb-12">
        <div className="h-14 sm:h-16 bg-blue-100/60 dark:bg-blue-900/30 rounded-[28px] w-full" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl" />
          <div className="h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700" />
        </div>
      </div>

      {/* Section skeleton */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-zinc-50 dark:bg-zinc-900 rounded-[32px] p-6 sm:p-8 space-y-4">
            <div className="h-5 w-40 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between items-center">
                  <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                  <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
