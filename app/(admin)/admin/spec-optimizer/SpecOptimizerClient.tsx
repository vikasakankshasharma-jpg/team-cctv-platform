"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, ChevronRight, CheckSquare, Square, RefreshCw, Layers } from "lucide-react";
import Image from "next/image";

interface Suggestion {
  id: string;
  display_name: string;
  category: string;
  existing_technologies: string[];
  suggested_technologies: string[];
  image_url: string;
  deep_specs?: any;
}

export default function SpecOptimizerClient() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/vendor/optimize-specs");
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions || []);
        // Select all by default to make bulk updating easy
        setSelectedIds(new Set((data.suggestions || []).map((s: Suggestion) => s.id)));
      } else {
        toast.error(data.error || "Failed to load suggestions");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === suggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suggestions.map(s => s.id)));
    }
  };

  const handleApproveSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);

    const updates = suggestions
      .filter(s => selectedIds.has(s.id))
      .map(s => ({
        id: s.id,
        technologies: [...s.existing_technologies, ...s.suggested_technologies],
        deep_specs: s.deep_specs
      }));

    try {
      const res = await fetch("/api/admin/vendor/optimize-specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Successfully updated ${data.updatedCount} products!`);
        // Remove approved from the UI
        setSuggestions(suggestions.filter(s => !selectedIds.has(s.id)));
        setSelectedIds(new Set());
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (err) {
      toast.error("Failed to approve optimizations");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Sparkles className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-foreground">AI Knowledge Base Scanning...</h2>
        <p className="text-muted-foreground mt-2">Checking your live catalog against newly learned specifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Retroactive Spec Optimizer</h1>
          <p className="text-sm text-muted-foreground">Apply newly learned AI specifications to older products in your catalog.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm font-medium hover:text-indigo-500 transition-colors"
            >
              {selectedIds.size === suggestions.length && suggestions.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-indigo-500" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Select All
            </button>
            <span className="text-sm text-muted-foreground">
              {suggestions.length} products found missing specifications
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchSuggestions}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={handleApproveSelected}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Selected ({selectedIds.size})
            </button>
          </div>
        </div>

        {suggestions.length === 0 && !isLoading ? (
          <div className="text-center py-20 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-emerald-500 opacity-50" />
            <p className="font-medium text-foreground">Your catalog is perfectly optimized!</p>
            <p className="text-sm mt-1">The AI couldn't find any missing specifications on existing products.</p>
          </div>
        ) : (
          <div className="divide-y">
            {suggestions.map(product => {
              const isSelected = selectedIds.has(product.id);
              return (
                <div key={product.id} className={`p-4 flex items-center gap-6 transition-colors ${isSelected ? "bg-indigo-500/5" : "hover:bg-muted/30"}`}>
                  <button onClick={() => handleToggleSelect(product.id)} className="flex-shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-500" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  <div className="w-16 h-16 relative rounded-lg overflow-hidden border bg-white flex-shrink-0 flex items-center justify-center p-1">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.display_name} fill className="object-contain" />
                    ) : (
                      <Layers className="w-6 h-6 text-muted-foreground/30" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate" title={product.display_name}>{product.display_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-md capitalize">{product.category}</span>
                      {product.existing_technologies.map(t => (
                        <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground">{t}</span>
                      ))}
                      <ChevronRight className="w-3 h-3 text-muted-foreground mx-1" />
                      {product.suggested_technologies.map(t => (
                        <span key={t} className="text-xs bg-indigo-500/10 text-indigo-500 font-medium px-2 py-0.5 rounded-md ring-1 ring-indigo-500/30">
                          + {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
