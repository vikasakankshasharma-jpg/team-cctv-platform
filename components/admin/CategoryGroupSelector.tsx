"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { ProductGroup } from "@/types";
import { ChevronDown, ChevronRight, Plus, Loader2, FolderTree, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface CategoryGroupSelectorProps {
  value: string | null; // Selected group ID or path
  onChange: (groupId: string | null, fullPath: string | null) => void;
  label?: string;
}

const DEFAULT_PATHS = [
  "cctv_camera/hd/HD Camera",
  "cctv_camera/ip/IP Camera",
  "cctv_camera/wifi/WiFi Camera",
  "recorder/hd/DVR",
  "recorder/ip/NVR",
  "recorder/xvr/XVR",
  "storage/HDD",
  "cable/Transmission Cable",
  "power_device/Power Supply",
  "connector/Connectors",
  "network/Network Device",
  "accessories/Accessory"
];

export function CategoryGroupSelector({ value, onChange, label = "Catalog Group" }: CategoryGroupSelectorProps) {
  const [apiGroups, setApiGroups] = useState<ProductGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      setDropdownRect(triggerRef.current.getBoundingClientRect());
    }
  }, [isOpen]);
  
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
        setApiGroups(data.groups);
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, ProductGroup>();
    // Add default paths first
    DEFAULT_PATHS.forEach(path => {
      const parts = path.split("/");
      let currentPath = "";
      parts.forEach(part => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!map.has(currentPath)) {
          map.set(currentPath, {
            id: `default-${Buffer.from(currentPath).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 20)}`,
            name: part,
            full_path: currentPath,
            parent_id: null,
            is_active: true
          });
        }
      });
    });
    // Override with API groups
    apiGroups.forEach(g => {
      if (g.full_path) map.set(g.full_path, g);
    });
    return Array.from(map.values()).sort((a, b) => (a.full_path || "").localeCompare(b.full_path || ""));
  }, [apiGroups]);

  const selectedGroup = groups.find(g => g.id === value || g.full_path === value);
  const filteredGroups = groups.filter(g => (g.full_path || "").toLowerCase().includes(search.toLowerCase()));

  const toggleExpand = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const newSet = new Set(expandedPaths);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
    setExpandedPaths(newSet);
  };

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
        setApiGroups(prev => [...prev, data.group]);
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

  // Build a fast lookup for whether a node has children
  const hasChildren = useMemo(() => {
    const set = new Set<string>();
    filteredGroups.forEach(g => {
      const parts = (g.full_path || "").split("/");
      if (parts.length > 1) {
        const parentPath = parts.slice(0, -1).join("/");
        set.add(parentPath);
      }
    });
    return set;
  }, [filteredGroups]);

  return (
    <div className="relative space-y-2.5">
      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">{label}</label>
      
      {/* Trigger Button */}
      <div 
        ref={triggerRef}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-zinc-200 dark:border-zinc-800'} rounded-2xl px-6 py-4 text-sm font-bold transition-all cursor-pointer dark:text-white`}
      >
        <div className="flex items-center gap-3 truncate">
          <FolderTree className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="truncate">
            {isLoading ? "Loading directory..." : selectedGroup ? (selectedGroup.full_path || selectedGroup.name || "Unnamed Group") : "Select Catalog Group..."}
          </span>
        </div>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-400" /> : <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </div>

      {/* Dropdown Menu via Portal */}
      {isOpen && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
          <div 
            className="fixed z-[120] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md overflow-hidden flex flex-col max-h-[400px]"
            style={{ 
              top: dropdownRect ? dropdownRect.bottom + 8 : 0, 
              left: dropdownRect ? dropdownRect.left : 0, 
              width: dropdownRect ? dropdownRect.width : 0 
            }}
            onClick={e => e.stopPropagation()}
          >
          
          {!isCreating ? (
            <>
              {/* Search Header */}
              <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
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
                    const fullPath = group.full_path || "";
                    const parts = fullPath.split("/");
                    const depth = parts.length - 1;
                    const isParent = hasChildren.has(fullPath);
                    const parentPath = parts.slice(0, -1).join("/");
                    
                    // If searching, show all matches flatly. 
                    // Otherwise, respect tree expansion state.
                    if (!search && depth > 0 && !expandedPaths.has(parentPath)) {
                      return null;
                    }

                    return (
                      <div 
                        key={group.id}
                        onClick={() => {
                          onChange(group.id!, fullPath);
                          setIsOpen(false);
                        }}
                        className={`flex items-center px-4 py-2 mx-2 my-0.5 rounded-lg cursor-pointer transition-colors ${value === group.id || value === fullPath ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'}`}
                      >
                        <div style={{ width: depth * 20 }} className="shrink-0 flex justify-end pr-2">
                          {depth > 0 && <div className="w-3 h-full border-l border-b border-zinc-200 dark:border-zinc-700 rounded-bl -mt-2.5 translate-y-1/2 opacity-50" />}
                        </div>
                        
                        <div 
                          className="p-1 mr-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 shrink-0 flex items-center justify-center cursor-pointer transition-colors"
                          onClick={(e) => {
                            if (isParent) toggleExpand(e, fullPath);
                            else e.stopPropagation();
                          }}
                        >
                          {isParent ? (
                            expandedPaths.has(fullPath) || search ? (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                            )
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-zinc-400 opacity-50" />
                          )}
                        </div>
                        <span className="text-xs font-bold truncate flex-1">{group.name}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Create New Action */}
              <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0">
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
            <div className="p-6 space-y-6 flex-shrink-0 flex flex-col max-h-[400px]">
              <div className="flex items-center justify-between flex-shrink-0">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">New Catalog Group</h4>
                <button type="button" onClick={() => setIsCreating(false)} className="text-zinc-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Under Parent Group (Optional)</label>
                  <select 
                    value={newGroupParentId}
                    onChange={e => setNewGroupParentId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none dark:text-white appearance-none"
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

              <div className="flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Create
                </button>
              </div>
            </div>
          )}
          
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
