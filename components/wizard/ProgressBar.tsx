"use client";

interface ProgressBarProps {
  currentStepIndex: number;
  totalSteps: number;
}

export function ProgressBar({ currentStepIndex, totalSteps }: ProgressBarProps) {
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 block mb-1">
            Your Quote Progress
          </span>
          <div className="text-2xl font-black text-zinc-900 tracking-tighter">
            Step <span className="text-zinc-400 font-medium">{currentStepIndex + 1} of {totalSteps}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black text-blue-600 leading-none">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      
      {/* Track */}
      <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50 shadow-inner">
        {/* Fill */}
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 transition-all duration-700 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      <div className="flex justify-between gap-2 px-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 h-1 rounded-full transition-all duration-500 ${
              i <= currentStepIndex ? "bg-blue-600/40" : "bg-zinc-200"
            }`} 
          />
        ))}
      </div>
    </div>
  );
}
