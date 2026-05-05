"use client";

interface ProgressBarProps {
  currentStepIndex: number;
  totalSteps: number;
}

export function ProgressBar({ currentStepIndex, totalSteps }: ProgressBarProps) {
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="w-full space-y-3">
      {/* Labels row */}
      <div className="flex justify-between items-baseline">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-500 mb-1">
            Your Progress
          </span>
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Question{" "}
            <span className="text-zinc-900 dark:text-white font-bold">
              {currentStepIndex + 1}
            </span>{" "}
            of {totalSteps}
          </p>
        </div>
        <span
          className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none"
          aria-label={`${Math.round(progress)} percent complete`}
        >
          {Math.round(progress)}%
        </span>
      </div>

      {/* Track */}
      <div
        className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step dot indicators */}
      <div className="flex items-center gap-1 px-0.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={[
              "flex-1 h-1 rounded-full transition-all duration-500",
              i < currentStepIndex
                ? "bg-blue-500/60 dark:bg-blue-500/50"
                : i === currentStepIndex
                ? "bg-blue-600 dark:bg-blue-400"
                : "bg-zinc-200 dark:bg-zinc-700",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

