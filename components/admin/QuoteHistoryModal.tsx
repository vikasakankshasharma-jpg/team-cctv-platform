"use client";

import { useState, useEffect } from "react";
import { X, History, BadgeIndianRupee, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { getLeadQuotes } from "@/app/actions/leads";

interface QuoteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  customerName: string;
}

export function QuoteHistoryModal({ isOpen, onClose, leadId, customerName }: QuoteHistoryModalProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && leadId) {
      const loadQuotes = async () => {
        setIsLoading(true);
        try {
          const data = await getLeadQuotes(leadId);
          setQuotes(data);
        } catch (error) {
          console.error("Failed to load quote history:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadQuotes();
    }
  }, [isOpen, leadId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900 animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-md animate-in zoom-in-95 fade-in duration-500 max-h-[80vh] flex flex-col">
        
        <div className="p-10 pb-6 shrink-0 border-b border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <History className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Quote History</h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">{customerName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white bg-zinc-800 rounded-2xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 gap-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">Retrieving Manifest History...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-20 text-zinc-600">
               <p className="text-[10px] font-black uppercase tracking-widest">No Previous Quotes Found</p>
            </div>
          ) : (
            quotes.map((quote) => (
              <div key={quote.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                      <BadgeIndianRupee className="w-5 h-5" />
                   </div>
                   <div className="space-y-1">
                      <div className="text-lg font-black text-white">₹{quote.quoteData?.total_payable?.toLocaleString('en-IN') || "0"}</div>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                         <Calendar className="w-3 h-3" />
                         {new Date(quote.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                   </div>
                </div>
                
                <a
                  href={`/quote/${leadId}?quoteId=${quote.id}`}
                  target="_blank"
                  className="w-12 h-12 flex items-center justify-center bg-zinc-900 hover:bg-blue-600 text-zinc-500 hover:text-white rounded-2xl transition-all shadow-inner"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
