"use client";

import { useState, useEffect } from "react";
import { ProductGroup } from "@/types";
import { ChevronDown, Plus, Loader2, FolderTree, X } from "lucide-react";
import { toast } from "sonner";

interface CategoryGroupSelectorProps {
  value: string | null; // Selected group ID
  onChange: (groupId: string | null, fullPath: string | null) => void;
  label?: string;
}

export function CategoryGroupSelector({ value, onChange, label = "Catalog Group" }: CategoryGroupSelectorProps) {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Inline Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupParentId, setNewGroupParentId] = useState<string | "root">("root");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/admin/product-groups");
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedGroup = groups.find(g => g.id === value);
  const filteredGroups = groups.filter(g => g.full_path.toLowerCase().includes(search.toLowerCase()));

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      setIsSaving(true);
      const res = await fetch("/api/admin/product-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          parent_id: newGroupParentId === "root" ? null : newGroupParentId
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setGroups(prev => [...prev, data.group].sort((a, b) => a.full_path.localeCompare(b.full_path)));
        onChange(data.group.id!, data.group.full_path);
        setIsCreating(false);
        setIsOpen(false);
        setNewGroupName("");
        toast.success(`Group "${data.group.name}" created`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative space-y-2.5">
      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">{label}</label>
      
      {/* Trigger Button */}
      <div 
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-zinc-200 dark:border-zinc-800'} rounded-2xl px-6 py-4 text-sm font-bold transition-all cursor-pointer dark:text-white`}
      >
        <div className="flex items-center gap-3 truncate">
          <FolderTree className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="truncate">
            {isLoading ? "Loading directory..." : selectedGroup ? selectedGroup.full_path : "Select Catalog Group..."}
          </span>
        </div>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[110] top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md overflow-hidden flex flex-col max-h-[400px]">
          
          {!isCreating ? (
            <>
              {/* Search Header */}
              <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                <input
                  type="text"
                  placeholder="Search paths..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none dark:text-white"
                />
              </div>

              {/* Group List */}
              <div className="flex-1 overflow-y-auto py-2">
                {filteredGroups.length === 0 ? (
                  <div className="px-6 py-8 text-center text-zinc-400 text-xs font-bold">
                    No groups found matching "{search}"
                  </div>
                ) : (
                  filteredGroups.map(group => {
                    // Calculate visual indentation based on path depth
                    const depth = group.full_path.split("/").length - 1;
                    return (
                      <div 
                        key={group.id}
                        onClick={() => {
                          onChange(group.id!, group.full_path);
                          setIsOpen(false);
                        }}
                        className={`flex items-center px-4 py-2.5 mx-2 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${value === group.id ? 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                      >
                        <div style={{ width: depth * 16 }} className="shrink-0" />
                        {depth > 0 && <div className="w-3 h-3 border-l-2 border-b-2 border-zinc-300 dark:border-zinc-700 rounded-bl mr-3 shrink-0" />}
                        {!depth && <FolderTree className="w-3.5 h-3.5 mr-3 shrink-0 text-zinc-400" />}
                        <span className="text-xs font-bold truncate">{group.name}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Create New Action */}
              <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Create New Group
                </button>
              </div>
            </>
          ) : (
            /* Inline Create Form */
            <form onSubmit={handleCreateGroup} className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">New Catalog Group</h4>
                <button type="button" onClick={() => setIsCreating(false)} className="text-zinc-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Under Parent Group (Optional)</label>
                  <select 
                    value={newGroupParentId}
                    onChange={e => setNewGroupParentId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none dark:text-white"
                  >
                    <option value="root">-- Top Level (No Parent) --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.full_path}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Group Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="e.g. 5MP ColorVu"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none dark:text-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Create
                </button>
              </div>
            </form>
          )}
          
        </div>
      )}
      
      {/* Click outside overlay (simple hack since we don't have a useClickOutside hook) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
