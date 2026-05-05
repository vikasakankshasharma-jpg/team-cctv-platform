/**
 * Loading skeleton for customer-facing pages.
 * Next.js App Router shows this automatically while the page chunk loads
 * or while server components are fetching data — replacing blank screens
 * with a premium branded shimmer that matches the site's dark/light design.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col animate-pulse">
      {/* Nav skeleton */}
      <div className="h-16 border-b border-zinc-100 dark:border-zinc-800 px-6 flex items-center justify-between">
        <div className="h-5 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
        <div className="flex gap-3">
          <div className="h-9 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          <div className="h-9 w-9 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="flex-1 flex flex-col items-center justify-start pt-16 sm:pt-24 px-6 gap-6 max-w-4xl mx-auto w-full">
        {/* Badge */}
        <div className="h-7 w-40 bg-blue-50 dark:bg-blue-900/20 rounded-full" />
        {/* H1 */}
        <div className="space-y-3 w-full text-center">
          <div className="h-10 sm:h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-full max-w-lg mx-auto" />
          <div className="h-10 sm:h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-4/5 mx-auto" />
        </div>
        {/* Subheadline */}
        <div className="h-5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl w-3/4 max-w-sm mx-auto" />
        {/* CTA buttons */}
        <div className="flex gap-4 mt-2">
          <div className="h-14 w-44 bg-zinc-900/10 dark:bg-zinc-700 rounded-2xl" />
          <div className="h-14 w-36 bg-zinc-50 dark:bg-zinc-800 rounded-2xl" />
        </div>
        {/* Trust badges */}
        <div className="flex gap-6 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
              <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Subtle branded pulse glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
