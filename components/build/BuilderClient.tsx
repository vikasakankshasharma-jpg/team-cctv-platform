"use client";

import React, { useState, useEffect } from "react";
import { Product, BuilderSelection } from "@/types";
import { useRouter } from "next/navigation";

export default function BuilderClient() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [selections, setSelections] = useState<BuilderSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        source: "builder",
        eventType: "SESSION_START",
        step: 0
      })
    }).catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    if (step > 0) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          source: "builder",
          eventType: "STEP_VIEWED",
          step
        })
      }).catch(console.error);
    }
  }, [step, sessionId]);
  useEffect(() => {
    // Fetch builder products
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/build/products");
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleSelection = (productId: string, delta: number, type: "main" | "accessory" = "main") => {
    setSelections(prev => {
      const existing = prev.find(s => s.product_id === productId);
      if (existing) {
        const nextQty = existing.quantity + delta;
        if (nextQty <= 0) return prev.filter(s => s.product_id !== productId);
        return prev.map(s => s.product_id === productId ? { ...s, quantity: nextQty } : s);
      } else {
        if (delta <= 0) return prev;
        return [...prev, { product_id: productId, quantity: delta, type }];
      }
    });
  };

  const getQty = (productId: string) => {
    return selections.find(s => s.product_id === productId)?.quantity || 0;
  };

  const [existingEquipment, setExistingEquipment] = useState({ cameras: 0, recorderChannels: 0 });

  const calculateSystem = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/build/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections, existingEquipment })
      });
      const data = await res.json();
      if (data.success) {
        setPricingResult(data.pricing);
        setWarnings(data.warnings);
        if (data.warnings.length === 0) {
          setStep(7); // Go to Review
        } else {
          alert("Compatibility Warnings:\n" + data.warnings.join("\n"));
        }
      } else {
        alert("Calculation failed: " + data.message);
      }
    } catch (e) {
      console.error(e);
    }
    setCalculating(false);
  };

  const handleSaveQuote = async () => {
    const mobile = prompt("Please enter your mobile number to save and receive the quotation:");
    if (!mobile) return;
    
    setCalculating(true);
    try {
      const totalCameras = selections.length + existingEquipment.cameras;
      const res = await fetch("/api/quote/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_mobile: mobile,
          requirementSnapshot: { camera_count: totalCameras, is_upgrade: true, existing_equipment: existingEquipment }, // Mock requirement
          configurationSnapshot: selections,
          pricingSnapshot: pricingResult,
          selectedPlan: "recommended", // Unified logic relies on a selected plan
          source: "builder"
        })
      });
      const data = await res.json();
      if (data.success) {
        setSavedQuoteId(data.quoteId);
        
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            source: "builder",
            eventType: "QUOTE_GENERATED",
            metadata: { quoteId: data.quoteId }
          })
        }).catch(console.error);

        // Fire PDF generation in background
        fetch(`/api/quote/${data.quoteId}/pdf`);
      } else {
        alert("Failed to save quote.");
      }
    } catch (e) {
      console.error(e);
    }
    setCalculating(false);
  };

  const renderProducts = (category: string) => {
    return products.filter(p => p.category === category).map(p => (
      <div key={p.id} className="border p-4 rounded-xl flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold">{p.display_name}</h3>
          <p className="text-sm text-gray-500">₹{p.unit_price}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => handleSelection(p.id!, -1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">-</button>
          <span className="font-medium">{getQty(p.id!)}</span>
          <button onClick={() => handleSelection(p.id!, 1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">+</button>
        </div>
      </div>
    ));
  };

  if (savedQuoteId) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-3xl font-bold mb-4">System Built & Quote Ready!</h2>
        <p className="mb-6">Your Quote ID: {savedQuoteId}</p>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-full mr-4">Download PDF</button>
        <button className="bg-green-600 text-white px-6 py-3 rounded-full">Send on WhatsApp</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-8">
      {/* Main Builder Area */}
      <div className="flex-1">
        <div className="mb-8">
          <div className="flex space-x-2 text-sm font-medium text-gray-400 overflow-x-auto pb-2">
            {["Mode", "Existing", "Cameras", "Recorder", "Storage", "Cable", "Accessories", "Review"].map((name, i) => (
              <span key={name} className={step === i ? "text-blue-600 font-bold" : ""}>{i}. {name}</span>
            ))}
          </div>
        </div>

        {loading ? (
          <div>Loading products...</div>
        ) : (
          <div>
            {step === 0 && (
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold mb-8">What are you looking to build?</h2>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <div 
                    onClick={() => setStep(2)}
                    className="border-2 border-gray-200 hover:border-blue-600 rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg w-full max-w-sm"
                  >
                    <div className="text-4xl mb-4">🆕</div>
                    <h3 className="text-xl font-bold mb-2">New Installation</h3>
                    <p className="text-gray-500">I want to build a complete CCTV system from scratch.</p>
                  </div>
                  <div 
                    onClick={() => setStep(1)}
                    className="border-2 border-gray-200 hover:border-blue-600 rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg w-full max-w-sm"
                  >
                    <div className="text-4xl mb-4">🔄</div>
                    <h3 className="text-xl font-bold mb-2">Existing System / Upgrade</h3>
                    <p className="text-gray-500">I already have some equipment and want to add more to it.</p>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">What do you already have?</h2>
                <p className="text-gray-500 mb-6">Select the equipment you already own. We will check compatibility when you add new items.</p>
                
                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Existing Cameras</label>
                    <input 
                      type="number" 
                      min="0" 
                      placeholder="e.g. 4" 
                      className="w-full border rounded-lg p-3" 
                      value={existingEquipment.cameras}
                      onChange={(e) => setExistingEquipment(prev => ({ ...prev, cameras: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Existing Recorder Channels</label>
                    <select 
                      className="w-full border rounded-lg p-3"
                      value={existingEquipment.recorderChannels}
                      onChange={(e) => setExistingEquipment(prev => ({ ...prev, recorderChannels: parseInt(e.target.value) || 0 }))}
                    >
                      <option value="0">I don't have a recorder</option>
                      <option value="4">4 Channel</option>
                      <option value="8">8 Channel</option>
                      <option value="16">16 Channel</option>
                      <option value="32">32 Channel</option>
                    </select>
                  </div>
                </div>

                <button onClick={() => setStep(2)} className="mt-8 bg-black text-white px-6 py-3 rounded-xl w-full max-w-xl">
                  Save Existing Equipment & Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Select Cameras</h2>
                {renderProducts("cctv_camera")}
                <button onClick={() => setStep(3)} className="mt-6 bg-black text-white px-6 py-3 rounded-xl w-full">Continue to Recorder</button>
              </div>
            )}
            
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Select Recorder</h2>
                {renderProducts("recorder")}
                <button onClick={() => setStep(4)} className="mt-6 bg-black text-white px-6 py-3 rounded-xl w-full">Continue to Storage</button>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Select Storage (HDD)</h2>
                {renderProducts("storage")}
                <button onClick={() => setStep(5)} className="mt-6 bg-black text-white px-6 py-3 rounded-xl w-full">Continue to Cable</button>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Select Cable</h2>
                {renderProducts("cable")}
                <button onClick={() => setStep(6)} className="mt-6 bg-black text-white px-6 py-3 rounded-xl w-full">Continue to Accessories</button>
              </div>
            )}

            {step === 6 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Select Power & Accessories</h2>
                {renderProducts("power_supply")}
                {renderProducts("accessory")}
                <button onClick={calculateSystem} disabled={calculating} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl w-full">
                  {calculating ? "Checking Compatibility..." : "Check System & Review"}
                </button>
              </div>
            )}

            {step === 7 && pricingResult && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Review Your System</h2>
                
                <div className="bg-green-50 text-green-800 p-4 rounded-xl mb-6 flex items-start">
                  <svg className="w-5 h-5 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <div>
                    <h4 className="font-bold">System is ready to quote</h4>
                    <p className="text-sm">Camera count supported, recorder capacity verified.</p>
                  </div>
                </div>

                <div className="border rounded-xl divide-y">
                  {pricingResult.items.map((item: any, i: number) => (
                    <div key={i} className="p-4 flex justify-between">
                      <div>
                        <div className="font-medium">{item.display_name}</div>
                        <div className="text-sm text-gray-500">Qty: {item.qty}</div>
                      </div>
                      <div className="font-medium">₹{item.line_total}</div>
                    </div>
                  ))}
                  <div className="p-4 bg-gray-50 flex justify-between font-bold text-lg rounded-b-xl">
                    <span>Total Payable</span>
                    <span className="text-blue-600">₹{pricingResult.total_payable}</span>
                  </div>
                </div>

                <button onClick={handleSaveQuote} disabled={calculating} className="mt-6 bg-black text-white px-6 py-3 rounded-xl w-full text-lg font-bold">
                  {calculating ? "Saving..." : "Get My Quotation"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Summary */}
      <div className="w-full md:w-80 shrink-0">
        <div className="bg-gray-50 rounded-2xl p-6 sticky top-6">
          <h3 className="font-bold mb-4 uppercase text-xs tracking-wider text-gray-500">System Summary</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span>Items Selected</span>
              <span className="font-medium">{selections.reduce((acc, s) => acc + s.quantity, 0)}</span>
            </div>
            {warnings.length > 0 && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                ⚠ Compatibility issues detected
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Estimated Total (Pending Calculate)</div>
            <div className="text-2xl font-bold">
              ₹{selections.reduce((acc, sel) => {
                const p = products.find(p => p.id === sel.product_id);
                return acc + (p ? p.unit_price * sel.quantity : 0);
              }, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
