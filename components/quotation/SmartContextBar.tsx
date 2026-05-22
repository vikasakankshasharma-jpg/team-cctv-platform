"use client";

import { useState } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { Camera, Calendar, HardDrive, Edit2, ChevronDown, Minus, Plus, Cpu, Monitor } from "lucide-react";

interface SmartContextBarProps {
  totalPrice: number;
}

export function SmartContextBar({ totalPrice }: SmartContextBarProps) {
  const { selection, updateSelection } = useConfiguratorStore();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="sticky top-0 z-50 w-full px-4 py-3 bg-zinc-900/90 dark:bg-black/90 backdrop-blur-xl border-b border-zinc-800 shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Core Settings Summary */}
        <div className="flex items-center gap-3 sm:gap-6 text-white overflow-x-auto no-scrollbar w-full sm:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Camera className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-black uppercase tracking-widest">{selection.camera_count} Cameras</span>
          </div>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-2 shrink-0">
            {selection.technology === "IP" ? <Cpu className="w-4 h-4 text-emerald-400" /> : <Monitor className="w-4 h-4 text-emerald-400" />}
            <span className="text-xs font-black uppercase tracking-widest">{selection.technology} System</span>
          </div>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest">{selection.recording_days} Days</span>
          </div>
        </div>

        {/* Live Total & Edit Button */}
        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
          <div className="flex flex-col sm:items-end">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Live Estimate</span>
            <div className="flex items-baseline gap-1 text-white">
              <span className="text-xs font-black">₹</span>
              <span className="text-lg font-black tracking-tighter">{totalPrice.toLocaleString("en-IN")}</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit Scope
          </button>
        </div>

      </div>

      {/* Inline Editor Dropdown */}
      {isEditing && (
        <div className="absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 shadow-2xl p-4 sm:p-6 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
            
            {/* Camera Count Edit */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex justify-between">
                <span>Camera Count</span>
                <span className="text-white">{selection.camera_count}</span>
              </label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => updateSelection({ camera_count: Math.max(1, selection.camera_count - 1) })}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                ><Minus className="w-4 h-4" /></button>
                <input 
                  type="range" min="1" max="32" step="1"
                  value={selection.camera_count}
                  onChange={(e) => updateSelection({ camera_count: parseInt(e.target.value) })}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-blue-500"
                />
                <button 
                  onClick={() => updateSelection({ camera_count: Math.min(32, selection.camera_count + 1) })}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                ><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Recording Days Edit */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex justify-between">
                <span>Recording Days</span>
                <span className="text-white">{selection.recording_days}</span>
              </label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => updateSelection({ recording_days: Math.max(7, selection.recording_days - 7) })}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                ><Minus className="w-4 h-4" /></button>
                <input 
                  type="range" min="7" max="90" step="1"
                  value={selection.recording_days}
                  onChange={(e) => updateSelection({ recording_days: parseInt(e.target.value) })}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-blue-500"
                />
                <button 
                  onClick={() => updateSelection({ recording_days: Math.min(90, selection.recording_days + 7) })}
                  className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                ><Plus className="w-4 h-4" /></button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
