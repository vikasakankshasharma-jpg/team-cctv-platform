"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DealConversionPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.leadId as string;
  
  const [lead, setLead] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Negotiation state
  const [discountAmount, setDiscountAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Admin defined minimum margin (could be fetched from settings, hardcoded to 15% for now)
  const MIN_MARGIN_PERCENT = 15;

  useEffect(() => {
    fetchLead();
  }, [quoteId]);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/crm/quotes/${quoteId}`);
      const data = await res.json();
      if (data.success) {
        setLead(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading quote details...</div>;
  if (!lead) return <div className="p-8">Quote not found.</div>;

  // Derive financials
  // Assuming pricingSnapshot contains base_cost and total_payable
  const baseCost = lead.pricingSnapshot?.total_cost || 0; // Total hardware cost
  const listPrice = lead.pricingSnapshot?.total_payable || 0;
  
  const finalPrice = listPrice - discountAmount;
  const grossProfit = finalPrice - baseCost;
  const marginPercent = finalPrice > 0 ? (grossProfit / finalPrice) * 100 : 0;
  
  const requiresApproval = marginPercent < MIN_MARGIN_PERCENT;

  const handleConvert = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: lead.id,
          discountAmount,
          finalPrice,
          grossProfit
        })
      });
      const data = await res.json();
      if (data.success) {
        // Deal created! Redirect to CRM pipeline
        router.push("/admin/sales");
      } else {
        alert(data.message || "Failed to create deal.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating deal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Convert to Deal</h1>
        <p className="text-gray-500 mt-1">Review quote financials and finalize negotiation for {lead.customer_name || "Unknown Customer"}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Base Cost (Hardware + Installation):</span>
              <span className="font-medium text-gray-900">₹{baseCost.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Quoted List Price:</span>
              <span className="font-medium text-gray-900">₹{listPrice.toLocaleString("en-IN")}</span>
            </div>
            
            <div className="col-span-2 flex justify-between items-center bg-gray-50 p-4 rounded-md border mt-2">
              <span className="font-semibold">Apply Discount (₹):</span>
              <Input 
                type="number" 
                value={discountAmount} 
                onChange={e => setDiscountAmount(Number(e.target.value))}
                className="w-48 text-right font-bold text-red-600"
              />
            </div>

            <div className="col-span-2 bg-blue-50 p-4 rounded-md border border-blue-100 flex justify-between items-center mt-2">
              <span className="font-bold text-lg text-blue-900">Final Target Price:</span>
              <span className="font-bold text-2xl text-blue-700">₹{finalPrice.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Margin & Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-md text-center">
              <div className="text-sm text-gray-500 mb-1">Gross Profit (₹)</div>
              <div className="text-xl font-bold text-green-600">₹{grossProfit.toLocaleString("en-IN")}</div>
            </div>
            <div className={`p-4 border rounded-md text-center ${requiresApproval ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              <div className="text-sm text-gray-500 mb-1">Gross Margin (%)</div>
              <div className={`text-xl font-bold ${requiresApproval ? "text-red-600" : "text-green-600"}`}>
                {marginPercent.toFixed(1)}%
              </div>
            </div>
          </div>
          
          {requiresApproval && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <div>
                <h4 className="font-bold text-yellow-800">Admin Approval Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  The requested discount drops the gross margin below the minimum threshold of {MIN_MARGIN_PERCENT}%. 
                  You cannot convert this deal directly.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-4 mt-8">
        <button 
          onClick={() => router.back()} 
          className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        {requiresApproval ? (
          <button 
            disabled={saving}
            className="px-6 py-2 bg-yellow-500 text-white rounded-md font-bold hover:bg-yellow-600 disabled:opacity-50"
          >
            {saving ? "Requesting..." : "Request Discount Approval"}
          </button>
        ) : (
          <button 
            onClick={handleConvert}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Processing..." : "Convert to Deal"}
          </button>
        )}
      </div>
    </div>
  );
}

