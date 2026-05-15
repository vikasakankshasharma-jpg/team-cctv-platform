"use client";

import { useConfiguratorStore } from "@/store/configurator";
import { Zap, ShieldCheck, Mic, Moon, Maximize, Camera } from "lucide-react";

export function FeatureToggleGrid() {
  const { selection, updateSelection } = useConfiguratorStore();

  const toggleFeature = (feature: string) => {
    const current = selection.requested_features || [];
    if (current.includes(feature)) {
      updateSelection({ requested_features: current.filter(f => f !== feature) });
    } else {
      updateSelection({ requested_features: [...current, feature] });
    }
  };

  const FEATURES = [
    { id: "mic", label: "Mic", icon: <Mic className="w-3.5 h-3.5" /> },
    { id: "color_night", label: "Night", icon: <Moon className="w-3.5 h-3.5" /> },
    { id: "ptz", label: "PTZ", icon: <Maximize className="w-3.5 h-3.5" /> },
    { id: "4mp", label: "Ultra HD", icon: <Camera className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-blue-600" /> Must-Have Features
      </label>
      <div className="grid grid-cols-2 gap-2">
        {FEATURES.map(feat => {
          const isActive = (selection.requested_features || []).includes(feat.id);
          return (
            <button
              key={feat.id}
              onClick={() => toggleFeature(feat.id)}
              className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${
                isActive
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-500"
              }`}
            >
               {isActive ? <ShieldCheck className="w-3.5 h-3.5" /> : feat.icon}
              <span className="text-[9px] font-black uppercase tracking-widest">{feat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
