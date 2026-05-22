"use client";

import { useState } from "react";
import { Plus, Pencil, Trash, Blocks } from "lucide-react";
import type { Addon } from "@/types";
import { AddonModal } from "./AddonModal";
import { PageHeader } from "./PageHeader";
import { createAddon, updateAddon, deleteAddon } from "@/app/actions/addons";
import { toast } from "sonner";

interface AddonsClientProps {
  initialAddons: (Addon & { technical_name?: string })[];
}

export function AddonsClient({ initialAddons }: AddonsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<(Addon & { technical_name?: string }) | null>(null);

  const handleCreateNew = () => {
    setEditingAddon(null);
    setIsModalOpen(true);
  };

  const handleEdit = (addon: Addon) => {
    setEditingAddon(addon);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteAddon(id);
      toast.success(`${name} deleted successfully`);
    } catch (error) {
      console.error("Failed to delete addon:", error);
      toast.error("Failed to delete addon");
    }
  };

  const handleSave = async (data: any) => {
    if (editingAddon?.id) {
      await updateAddon(editingAddon.id, data as any);
    } else {
      await createAddon(data as any);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <PageHeader
        icon={Blocks}
        title="Add-ons Manager"
        description="Configure optional or mandatory hardware upgrades for the pricing engine."
        badge={`${initialAddons.length} Items`}
        action={
          <button
            onClick={handleCreateNew}
            className="group flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            New Add-on
          </button>
        }
      />

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md dark:shadow-md transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-black">
              <tr>
                <th className="px-8 py-6">Add-on Name</th>
                <th className="px-8 py-6 text-right">Price</th>
                <th className="px-8 py-6 text-center">Pricing Type</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
              {initialAddons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-[24px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-inner">
                        <Blocks className="w-8 h-8 text-zinc-300 dark:text-zinc-800" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-zinc-900 dark:text-white font-black text-xl uppercase tracking-widest leading-none">No Add-ons Yet</p>
                        <p className="text-zinc-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-tight">Create your first add-on to begin.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                initialAddons.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group/row">
                    <td className="px-8 py-6">
                      <div className="font-black text-zinc-900 dark:text-white text-base leading-tight group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400 transition-colors uppercase tracking-tight">{item.display_name}</div>
                      {item.technical_name && (
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                           <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" /> {item.technical_name}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-zinc-900 dark:text-white text-base">₹{item.price.toLocaleString('en-IN')}</span>
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-1">Net Base</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {item.unit_multiplier === "camera_count" ? (
                        <span className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/5 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
                          Per Camera
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-700 text-[10px] font-black uppercase tracking-widest">Fixed Price</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/10 shadow-inner">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-100 dark:border-zinc-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-500/30 flex items-center justify-center transition-all shadow-inner active:scale-90"
                          title="Edit Add-on"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => item.id && handleDelete(item.id, item.display_name)}
                          className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30 flex items-center justify-center transition-all shadow-inner active:scale-90"
                          title="Delete Add-on"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addon={editingAddon}
        onSave={handleSave}
      />
    </>
  );
}

