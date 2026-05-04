"use client";

import { Shield, Eye, Lock, MapPin } from "lucide-react";

interface SecurityBlueprintProps {
  cameraCount: number;
  propertyType: string;
}

export function SecurityBlueprint({ cameraCount, propertyType }: SecurityBlueprintProps) {
  // Generate pseudo-random positions for cameras based on property type
  const getCameraPositions = () => {
    const positions = [];
    const count = Math.min(cameraCount, 8); // Cap visualization for UI clarity
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      const radius = 35 + ((i * 13) % 5);
      positions.push({
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        rotation: (angle * 180) / Math.PI + 90
      });
    }
    return positions;
  };

  const positions = getCameraPositions();

  return (
    <div className="relative w-full max-w-md aspect-square bg-zinc-50 dark:bg-zinc-900/50 rounded-[48px] border border-zinc-100 dark:border-zinc-800 p-8 overflow-hidden group shadow-inner">
      {/* Blueprint Grid */}
      <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
      
      {/* Property Outline */}
      <div className="absolute inset-12 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-3xl flex items-center justify-center">
         <div className="flex flex-col items-center gap-2 opacity-20 dark:opacity-40 group-hover:opacity-100 transition-opacity duration-500">
            {propertyType === "warehouse" ? <Lock className="w-12 h-12" /> : <Shield className="w-12 h-12" />}
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{propertyType}</span>
         </div>
      </div>

      {/* Radar Pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full animate-ping pointer-events-none" />

      {/* Cameras */}
      {positions.map((pos, i) => (
        <div 
          key={i}
          className="absolute w-8 h-8 -ml-4 -mt-4 transition-all duration-700 ease-out flex items-center justify-center"
          style={{ 
            left: `${pos.x}%`, 
            top: `${pos.y}%`,
            transform: `rotate(${pos.rotation}deg)`
          }}
        >
          <div className="relative group/cam">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-500/10 rounded-full scale-0 group-hover/cam:scale-100 transition-transform duration-500" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-16 h-32 bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent clip-path-cone origin-top opacity-0 group-hover/item:opacity-100 transition-opacity" 
                 style={{ transform: 'scaleY(1.5)' }} />
            <div className="relative bg-zinc-900 dark:bg-blue-600 p-2 rounded-xl shadow-2xl border border-white/20 group-hover:scale-110 transition-transform duration-300">
               <Eye className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      ))}

      {/* HUD Info */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
         <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
               <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-500" />
               <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Coverage Layout</span>
            </div>
            <div className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight">
               {cameraCount} Points of Interest
            </div>
         </div>
         <div className="px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-full text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest shadow-sm">
            Optimal View
         </div>
      </div>
    </div>
  );
}
