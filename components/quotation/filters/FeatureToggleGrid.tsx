"use client";

import { useMemo } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { Zap, ShieldCheck, Mic, Moon, Maximize, Camera, Sparkles } from "lucide-react";

export function FeatureToggleGrid() {
  const { selection, updateSelection, products } = useConfiguratorStore();

  const toggleFeature = (feature: string) => {
    const current = selection.requested_features || [];
    if (current.includes(feature)) {
      updateSelection({ requested_features: current.filter(f => f !== feature) });
    } else {
      updateSelection({ requested_features: [...current, feature] });
    }
  };

  const dynamicFeatures = useMemo(() => {
    const featureSet = new Set<string>();
    products.forEach(p => {
      if (p.category === "camera" && Array.isArray(p.features)) {
        p.features.forEach(f => {
          if (f.trim() !== "") featureSet.add(f.trim().toLowerCase());
        });
      }
    });

    const uniqueFeatures = Array.from(featureSet).sort();

    const mappedFeatures = uniqueFeatures.map(feat => {
      let label = feat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      let id = feat;
      let icon = <Sparkles className="w-3.5 h-3.5" />;
      
      if (feat.includes("mic") || feat.includes("audio")) {
        label = "Mic / Audio";
        id = "mic";
        icon = <Mic className="w-3.5 h-3.5" />;
      } else if (feat.includes("color") || feat.includes("night")) {
        label = "Color Night";
        id = "color";
        icon = <Moon className="w-3.5 h-3.5" />;
      } else if (feat.includes("ptz") || feat.includes("pan") || feat.includes("360")) {
        label = "PTZ";
        id = "ptz";
        icon = <Maximize className="w-3.5 h-3.5" />;
      } else if (feat.includes("ultra") || feat.includes("4mp") || feat.includes("5mp") || feat.includes("8mp") || feat.includes("4k")) {
        label = "Ultra HD";
        id = "4mp";
        icon = <Camera className="w-3.5 h-3.5" />;
      } else if (feat.includes("ai") || feat.includes("smart")) {
        label = "AI Smart";
        id = "ai";
        icon = <Zap className="w-3.5 h-3.5" />;
      }
      
      return { id, label, icon };
    });

    const deduped = [];
    const seen = new Set<string>();
    for (const f of mappedFeatures) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        deduped.push(f);
      }
    }
    return deduped;
  }, [products]);

  if (dynamicFeatures.length === 0) return null;

  return (
    <div className="space-y-3">
      <label className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-blue-600" /> Must-Have Features
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {dynamicFeatures.map(feat => {
          const isActive = (selection.requested_features || []).includes(feat.id);
          return (
            <button
              key={feat.id}
              onClick={() => toggleFeature(feat.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                isActive
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-500"
              }`}
            >
               {isActive ? <ShieldCheck className="w-3.5 h-3.5" /> : feat.icon}
              <span className="text-[9px] font-black uppercase tracking-widest truncate">{feat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
