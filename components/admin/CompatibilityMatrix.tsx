"use client";

import { useState, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import { Folder, FolderOpen, Package, Plus, Link2, RefreshCw, AlertTriangle, Cpu, Tag, Settings, ChevronRight, ChevronDown, Layers, GripVertical } from "lucide-react";
import type { Product } from "@/types";
import { ProductModal } from "./ProductModal";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Build a distinct list of paths from the catalog
function buildTree(products: Product[]) {
  const paths = new Set<string>();
  products.forEach(p => {
    if (p.catalog_path) {
      // Add the path and all parent paths
      const parts = p.catalog_path.split("/");
      let current = "";
      parts.forEach(part => {
        current = current ? `${current}/${part}` : part;
        paths.add(current);
      });
    }
  });
  return Array.from(paths).sort();
}

// Draggable Node Component
function SortableTreeNode({ 
  id, 
  indent, 
  isSelected, 
  isExpanded, 
  hasChildren, 
  onClick, 
  onToggle 
}: { 
  id: string, 
  indent: number, 
  isSelected: boolean, 
  isExpanded: boolean, 
  hasChildren: boolean, 
  onClick: () => void, 
  onToggle: () => void 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${indent * 16}px`,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-center gap-2 py-2 px-2 rounded-xl transition-colors ${
        isSelected ? "bg-indigo-600/10 text-indigo-400" : "hover:bg-zinc-800/30 text-zinc-400"
      } ${isDragging ? "opacity-50 ring-2 ring-indigo-500 bg-zinc-900" : ""}`}
      onClick={onClick}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 opacity-40 hover:opacity-100 text-zinc-500 hover:text-zinc-300"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(); }}
        className="w-5 h-5 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
      >
        {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <div className="w-4 h-4" />}
      </button>
      {isExpanded ? <FolderOpen className={`w-4 h-4 ${isSelected ? "text-indigo-400" : "text-blue-400"}`} /> : <Folder className={`w-4 h-4 ${isSelected ? "text-indigo-400" : "text-zinc-500"}`} />}
      <span className={`text-sm font-bold tracking-wide cursor-pointer ${isSelected ? "text-indigo-100" : "text-zinc-300"}`}>
        {getLeafName(id)}
      </span>
    </div>
  );
}

function getIndent(path: string) {
  return path.split("/").length - 1;
}

function getLeafName(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CompatibilityMatrix({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [customSortOrder, setCustomSortOrder] = useState<string[]>([]);

  // Setup sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    // Load custom order from localStorage
    try {
      const saved = localStorage.getItem("catalog_tree_order");
      if (saved) setCustomSortOrder(JSON.parse(saved));
    } catch(e) {}
  }, []);

  // Sync state if initialProducts changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const treePaths = useMemo(() => {
    const defaultSorted = buildTree(products);
    // If we have a custom sort order, sort by it
    if (customSortOrder.length > 0) {
      return [...defaultSorted].sort((a, b) => {
        const indexA = customSortOrder.indexOf(a);
        const indexB = customSortOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    return defaultSorted;
  }, [products, customSortOrder]);

  // Expand root level by default
  useEffect(() => {
    if (treePaths.length > 0 && expandedPaths.size === 0) {
      const roots = treePaths.filter(p => !p.includes("/"));
      setExpandedPaths(new Set(roots));
      if (!selectedPath) setSelectedPath(roots[0]);
    }
  }, [treePaths, expandedPaths, selectedPath]);

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleSave = async (data: Omit<Product, "id">) => {
    if (!editProduct || !editProduct.id) return;
    try {
      const { updateProduct } = await import("@/app/actions/products");
      await updateProduct(editProduct.id, data);
      setEditProduct(null);
    } catch (error) {
      console.error("Failed to save product", error);
    }
  };

  // Filter products for the selected folder
  const displayedProducts = useMemo(() => {
    if (!selectedPath) return [];
    return products.filter(p => p.catalog_path && p.catalog_path.startsWith(selectedPath));
  }, [products, selectedPath]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = treePaths.indexOf(active.id as string);
      const newIndex = treePaths.indexOf(over.id as string);
      
      const newOrder = [...treePaths];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      
      setCustomSortOrder(newOrder);
      localStorage.setItem("catalog_tree_order", JSON.stringify(newOrder));
    }
  };

  const renderTreeNodes = () => {
    // Basic tree rendering algorithm
    const nodes: ReactNode[] = [];
    
    treePaths.forEach(path => {
      const indent = getIndent(path);
      const parts = path.split("/");
      const parentPath = parts.slice(0, -1).join("/");
      
      // Only show if parent is expanded (or if it's a root node)
      if (indent === 0 || expandedPaths.has(parentPath)) {
        const isExpanded = expandedPaths.has(path);
        const hasChildren = treePaths.some(p => p.startsWith(path + "/") && p.split("/").length === parts.length + 1);
        const isSelected = selectedPath === path;

        nodes.push(
          <SortableTreeNode
            key={path}
            id={path}
            indent={indent}
            isSelected={isSelected}
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            onClick={() => setSelectedPath(path)}
            onToggle={() => toggleExpand(path)}
          />
        );
      }
    });
    
    return nodes;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Link2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Category Rules & Compatibility</h1>
          </div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-lg">
            Manage your hardware inventory hierarchically. Define rules by mapping Recorders or Accessories to compatible Camera groups.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[75vh]">
        
        {/* Left Pane: Taxonomy Tree */}
        <div className="lg:col-span-4 bg-zinc-950/40 border border-zinc-800/60 rounded-[32px] flex flex-col overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/40">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Catalog Directory
            </h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Select a folder to view items</p>
          </div>
          <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-1">
            {treePaths.length === 0 ? (
              <div className="text-center py-10">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3 opacity-50" />
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No Paths Defined</p>
                <p className="text-[10px] text-zinc-600 mt-1 px-4">Edit a product and assign it a Catalog Path (e.g., CCTV/Cameras/IP).</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={treePaths} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col">
                    {renderTreeNodes()}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Right Pane: Products in Category */}
        <div className="lg:col-span-8 bg-zinc-950/40 border border-zinc-800/60 rounded-[32px] flex flex-col overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/40 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Items in {selectedPath ? getLeafName(selectedPath) : "Category"}
              </h2>
              {selectedPath && (
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  {selectedPath.replace(/\//g, " > ")}
                </p>
              )}
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              {displayedProducts.length} Items
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
            {displayedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <Package className="w-12 h-12 text-zinc-600 mb-4" />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Select a populated folder</p>
              </div>
            ) : (
              displayedProducts.map(product => (
                <div key={product.id} onClick={() => setEditProduct(product)} className="group bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800/60 hover:border-indigo-500/30 p-5 rounded-2xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
                        {product.category === 'camera' ? <Package className="w-4 h-4 text-indigo-400" /> : <Cpu className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">{product.display_name}</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{product.technical_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pl-11">
                      {product.catalog_path ? (
                        product.catalog_path.split('/').map((segment, idx, arr) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                              idx === 0 ? "bg-zinc-900 border-zinc-800 text-zinc-500" :
                              idx === 1 ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                              idx === 2 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                              "bg-purple-500/10 border-purple-500/20 text-purple-400"
                            }`}>
                              <span className="opacity-50 mr-1">{idx === 0 ? "DOMAIN:" : idx === 1 ? "CAT:" : idx === 2 ? "TECH:" : "SPEC:"}</span>
                              {segment}
                            </span>
                            {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />}
                          </div>
                        ))
                      ) : (
                        <span className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                          Uncategorized
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compatibility Rules Display */}
                  {(product.category === "recorder" || product.category === "accessory") && (
                    <div className="sm:text-right space-y-2 max-w-xs">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center sm:justify-end gap-1.5">
                        <Link2 className="w-3 h-3" /> Compatible With:
                      </p>
                      <div className="flex flex-wrap sm:justify-end gap-1.5">
                        {(product.compatible_paths ?? []).length > 0 ? (
                          (product.compatible_paths ?? []).map(cp => (
                            <span key={cp} className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest text-right">
                              {cp}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-black text-red-400 uppercase tracking-widest border border-red-500/20 bg-red-500/10 px-2 py-1 rounded">
                            No Rules Defined
                          </span>
                        )}
                      </div>
                      {product.max_cameras && (
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                          Capacity: Max {product.max_cameras} Units
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ProductModal
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        product={editProduct}
        onSave={handleSave}
      />
    </div>
  );
}
