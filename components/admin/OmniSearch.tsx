"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { 
  Search, 
  Users, 
  Building2, 
  Package, 
  PlusCircle, 
  FileText, 
  Settings, 
  ArrowRight,
  Zap,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { useOmniSearchStore } from "@/store/omni-search";

export function OmniSearch() {
  const { isOpen: open, setIsOpen: setOpen } = useOmniSearchStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    leads: any[];
    franchises: any[];
    products: any[];
  }>({ leads: [], franchises: [], products: [] });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  // Toggle on Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  // Search logic (debounced)
  useEffect(() => {
    if (query.length < 2) {
      setResults({ leads: [], franchises: [], products: [] });
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
        }
      } catch (err) {
        console.error("OmniSearch Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 sm:px-6 md:px-0"
    >
      <div className="fixed inset-0 bg-zinc-900 animate-in fade-in duration-300" onClick={() => setOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center border-b border-zinc-100 dark:border-zinc-800 px-6 py-5">
          <Search className="w-5 h-5 text-zinc-400 mr-4 shrink-0" />
          <Command.Input 
            autoFocus
            placeholder="Search leads, franchises, products or commands..."
            onValueChange={setQuery}
            className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-white font-medium placeholder:text-zinc-400 placeholder:font-normal"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-4" />}
          <div className="ml-4 flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg shrink-0">
             <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">ESC to exit</span>
          </div>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          <Command.Empty className="py-12 text-center">
            <Zap className="w-8 h-8 text-zinc-200 dark:text-zinc-800 mx-auto mb-3" />
            <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">No results found for &quot;{query}&quot;</p>
          </Command.Empty>

          {/* Quick Actions */}
          {query.length === 0 && (
            <Command.Group heading="Quick Actions" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-2 mb-2">
              <Item icon={PlusCircle} label="Create New Lead" onSelect={() => runCommand(() => router.push("/admin/leads/new"))} />
              <Item icon={Building2} label="Add Franchise Partner" onSelect={() => runCommand(() => router.push("/admin/franchises/new"))} />
              <Item icon={Package} label="Bulk Product Upload" onSelect={() => runCommand(() => router.push("/admin/products/bulk"))} />
              <Item icon={Settings} label="System Settings" onSelect={() => runCommand(() => router.push("/admin/settings"))} />
            </Command.Group>
          )}

          {/* Leads */}
          {results.leads.length > 0 && (
            <Command.Group heading="Authorized Leads" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-2 mb-2">
              {results.leads.map(lead => (
                <Item 
                  key={lead.id} 
                  icon={Users} 
                  label={lead.customer_name} 
                  subtext={`${lead.mobile_number} · ${lead.property_type}`}
                  onSelect={() => runCommand(() => router.push(`/admin/leads/${lead.id}`))} 
                />
              ))}
            </Command.Group>
          )}

          {/* Franchises */}
          {results.franchises.length > 0 && (
            <Command.Group heading="Franchise Nodes" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-2 mb-2">
              {results.franchises.map(f => (
                <Item 
                  key={f.id} 
                  icon={Building2} 
                  label={f.company_name} 
                  subtext={f.owner_name}
                  onSelect={() => runCommand(() => router.push(`/admin/franchises/${f.id}`))} 
                />
              ))}
            </Command.Group>
          )}

          {/* Theme Commands */}
          {query.toLowerCase().includes("theme") && (
            <Command.Group heading="System Interface" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-2 mb-2">
              <Item icon={Zap} label="Switch to Dark Mode" onSelect={() => setTheme("dark")} />
              <Item icon={Zap} label="Switch to Light Mode" onSelect={() => setTheme("light")} />
            </Command.Group>
          )}
        </Command.List>

        <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                 <kbd className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-[10px] font-bold text-zinc-500 shadow-sm">↵</kbd>
                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Select</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <kbd className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-[10px] font-bold text-zinc-500 shadow-sm">↑↓</kbd>
                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Navigate</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-widest">TEAM Elite OmniSearch v1.0</span>
           </div>
        </div>
      </div>
    </Command.Dialog>
  );
}

function Item({ icon: Icon, label, subtext, onSelect }: { icon: any, label: string, subtext?: string, onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center justify-between p-4 rounded-2xl cursor-pointer aria-selected:bg-zinc-50 dark:aria-selected:bg-zinc-800/60 group transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 group-aria-selected:text-blue-500 border border-zinc-100 dark:border-zinc-800 group-aria-selected:border-blue-500/30 transition-all">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none mb-1 group-aria-selected:translate-x-1 transition-transform">{label}</span>
          {subtext && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{subtext}</span>}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-zinc-200 group-aria-selected:text-blue-500 group-aria-selected:translate-x-1 opacity-0 group-aria-selected:opacity-100 transition-all" />
    </Command.Item>
  );
}
