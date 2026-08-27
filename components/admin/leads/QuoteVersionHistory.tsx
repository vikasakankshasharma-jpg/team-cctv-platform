"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

type QuoteSnapshot = any;

export function QuoteVersionHistory({ currentQuote }: { currentQuote: QuoteSnapshot }) {
  // In a real implementation, we would fetch all quotes where parentQuoteId === currentQuote.parentQuoteId
  // or fetch by id/parent relations. For now we will display the current version.
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Quote Version History</h3>
      <div className="flex items-center gap-4 border p-4 rounded-md bg-muted/20">
        <div className="flex-1">
          <p className="font-medium">Version {currentQuote.version}</p>
          <p className="text-sm text-muted-foreground">Current Selection: {currentQuote.selectedPlan} plan</p>
        </div>
        <div className="text-right">
          <p className="font-bold">₹{currentQuote.pricingSnapshot?.total_payable?.toLocaleString("en-IN")}</p>
          <Badge variant="outline" className="mt-1">Active</Badge>
        </div>
      </div>
      {currentQuote.parentQuoteId && (
        <p className="text-xs text-muted-foreground">
          Derived from Quote: {currentQuote.parentQuoteId}
        </p>
      )}
    </div>
  );
}
