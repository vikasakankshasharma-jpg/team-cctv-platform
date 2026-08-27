"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type FollowUp = {
  note: string;
  nextFollowUpDate: string | null;
  priority: string;
  timestamp: string;
  author: string;
};

export function FollowUpManager({ quoteId, followUps = [], onAdded }: { quoteId: string, followUps?: FollowUp[], onAdded?: () => void }) {
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [actionType, setActionType] = useState("call");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!note) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/quotes/${quoteId}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          note, 
          nextFollowUpDate: date,
          nextActionType: actionType 
        })
      });
      
      // Also update the quote explicitly to sync Lead Intelligence fields
      if (date) {
        await fetch(`/api/crm/quotes/${quoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nextActionDate: date,
            nextActionType: actionType
          })
        });
      }
      
      if (res.ok) {
        setNote("");
        setDate("");
        if (onAdded) onAdded();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg border-b pb-2">Sales Notes & Follow-ups</h3>
      
      <div className="bg-muted/50 p-4 rounded-md space-y-4 border border-gray-200">
        <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"  
          placeholder="Add conversation notes, negotiation details..." 
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="col-span-1">
            <label className="text-xs text-muted-foreground block mb-1">Schedule Next Action</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" />
          </div>
          <div className="col-span-1">
            <label className="text-xs text-muted-foreground block mb-1">Action Type</label>
            <select 
              value={actionType} 
              onChange={(e) => setActionType(e.target.value)}
              className="w-full p-2 border rounded-md text-sm bg-white h-10"
            >
              <option value="call">Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="meeting">Meeting</option>
              <option value="visit">Site Visit</option>
            </select>
          </div>
          <div className="col-span-1 text-right">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleAdd} disabled={!note || loading}>
              {loading ? "Adding..." : "Save Note"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        {followUps.length === 0 && <p className="text-sm text-muted-foreground italic">No follow-ups recorded yet.</p>}
        {followUps.slice().reverse().map((f: any, i) => (
          <div key={i} className="border p-3 rounded-md text-sm space-y-2">
            <div className="flex justify-between items-start">
              <span className="font-semibold text-gray-800">{f.author}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(f.timestamp), "MMM d, h:mm a")}</span>
            </div>
            <p className="whitespace-pre-wrap text-gray-700">{f.note}</p>
            {f.nextFollowUpDate && (
              <Badge variant="outline" className="mt-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                Next Action: {format(new Date(f.nextFollowUpDate), "MMM d, yyyy")} {f.nextActionType ? `(${f.nextActionType})` : ""}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


