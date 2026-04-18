"use client";

import { useState } from "react";
import { BadgeDollarSign, Plus, UserCheck, UserX, Settings2, Phone } from "lucide-react";
import type { Promoter } from "@/types";
import { PromoterModal } from "./PromoterModal";
import { PageHeader } from "./PageHeader";
import { createPromoter, updatePromoter, banPromoter } from "@/app/actions/promoters";

interface PromotersClientProps {
  initialPromoters: Promoter[];
}

export function PromotersClient({ initialPromoters }: PromotersClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null);

  const handleCreateNew = () => {
    setEditingPromoter(null);
    setIsModalOpen(true);
  };

  const handleEdit = (promoter: Promoter) => {
    setEditingPromoter(promoter);
    setIsModalOpen(true);
  };

  const handleBan = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to ban/disable ${name}? They will no longer be able to claim new leads.`)) {
      try {
        await banPromoter(id);
      } catch (error) {
        console.error("Failed to ban promoter:", error);
        alert("Failed to ban promoter");
      }
    }
  };

  const handleSave = async (data: any) => {
    if (editingPromoter?.id) {
      await updatePromoter(editingPromoter.id, data);
    } else {
      await createPromoter(data);
    }
    setIsModalOpen(false);
  };

  const activeCount = initialPromoters.filter(p => p.is_active).length;

  return (
    <>
      <PageHeader
        icon={BadgeDollarSign}
        title="Promoter Network"
        description="Manage referral agents, their unique codes, commission slabs, and performance."
        badge={`${activeCount} Active`}
        action={
          <button
            onClick={handleCreateNew}
            className="group flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            New Promoter
          </button>
        }
      />

      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl backdrop-blur-md transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-black">
              <tr>
                <th className="px-8 py-6">Promoter Identity</th>
                <th className="px-8 py-6 text-center">Referral Cryptogram</th>
                <th className="px-8 py-6 text-right">Aggregate Yield</th>
                <th className="px-8 py-6 text-center">Network Integrity</th>
                <th className="px-8 py-6 text-center">Orchestration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
              {initialPromoters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-[24px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-inner">
                        <BadgeDollarSign className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-zinc-900 dark:text-white font-black text-xl uppercase tracking-widest leading-none">Network Latent</p>
                        <p className="text-zinc-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-tight">Deploy your first referral agent to expand the mesh.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                initialPromoters.map((agent) => (
                  <tr key={agent.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group/row">
                    <td className="px-8 py-6">
                      <div className="font-black text-zinc-900 dark:text-white text-base leading-tight group-hover/row:text-amber-600 dark:group-hover/row:text-amber-500 transition-colors uppercase tracking-tight">{agent.name}</div>
                      {agent.mobile && (
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-600 font-bold mt-2 uppercase tracking-widest">
                          <Phone className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />
                          +91 {agent.mobile}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="bg-amber-50 dark:bg-amber-500/5 text-amber-700 dark:text-amber-500 px-5 py-2 rounded-2xl font-mono font-black text-xs tracking-[0.3em] border border-amber-100 dark:border-amber-500/10 shadow-inner group-hover/row:bg-amber-100 dark:group-hover/row:bg-amber-500/10 transition-colors">
                        {agent.referral_code}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-zinc-900 dark:text-white text-base">₹{(agent.total_ex_tax_business || 0).toLocaleString('en-IN')}</span>
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-1 italic">Total ex-tax business</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {agent.is_active ? (
                        <span className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/10 shadow-inner">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Authorized
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-500/5 text-red-600 dark:text-red-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-500/10 shadow-inner">
                          <UserX className="w-3.5 h-3.5" />
                          Blacklisted
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEdit(agent)}
                          className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:text-blue-600 dark:hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-500/30 flex items-center justify-center transition-all shadow-inner active:scale-90"
                          title="Modify Credentials"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        {agent.is_active && (
                          <button
                            onClick={() => agent.id && handleBan(agent.id, agent.name)}
                            className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30 flex items-center justify-center transition-all shadow-inner active:scale-90"
                            title="Terminate Access"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PromoterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        promoter={editingPromoter}
        onSave={handleSave}
      />
    </>
  );
}

