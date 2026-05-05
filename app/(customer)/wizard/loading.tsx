/**
 * Wizard route loading skeleton.
 * Shown while WizardClient fetches /api/wizard and /api/settings on mount.
 */
export default function WizardLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white dark:bg-zinc-950 animate-pulse">
      {/* Progress bar skeleton */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-8 sm:pt-14">
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full mb-10">
          <div className="h-full w-1/3 bg-blue-100 dark:bg-blue-900/40 rounded-full" />
        </div>

        {/* Step badge */}
        <div className="h-7 w-36 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6" />

        {/* Step title */}
        <div className="space-y-3 mb-12">
          <div className="h-9 sm:h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-full max-w-xl" />
          <div className="h-9 sm:h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-3/4 max-w-md" />
        </div>

        {/* Sub-description */}
        <div className="h-5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl w-1/2 max-w-xs mb-10" />

        {/* Option cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[28px]"
            />
          ))}
        </div>
      </div>

      {/* Sticky nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 pb-5 pt-3 bg-gradient-to-t from-white/95 dark:from-zinc-950/95 to-transparent">
        <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl flex items-center justify-between p-3 h-16">
          <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          <div className="h-10 w-36 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
