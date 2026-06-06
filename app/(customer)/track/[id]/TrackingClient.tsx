"use client";

import { CheckCircle2, CircleDashed, MapPin, Package, Phone, ShieldCheck, Truck, Wrench } from "lucide-react";

export default function TrackingClient({ lead, job, quote }: { lead: any, job: any, quote: any }) {
  // Determine current step index
  let currentStep = 1; // 1: Order Confirmed
  if (job) currentStep = 2; // 2: Dispatching
  if (job?.status === "dispatched" || job?.status === "in_progress" || lead.assigned_to_installer_id) currentStep = 3; // 3: Installer En-Route
  if (lead.status === "won" && lead.installation_proof_url) currentStep = 4; // 4: Completed

  const steps = [
    { num: 1, label: "Order Confirmed", desc: "Payment received & verified.", icon: ShieldCheck },
    { num: 2, label: "Hardware Prepared", desc: "Equipment staged for dispatch.", icon: Package },
    { num: 3, label: "Installer En-Route", desc: "Technician assigned.", icon: Truck },
    { num: 4, label: "Installation Complete", desc: "Job closed successfully.", icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Track Your Installation</h1>
          <p className="text-muted-foreground">Order #{lead.id?.substring(0,8).toUpperCase()}</p>
        </div>

        {/* OTP Secure Box (Only visible when active & installer assigned, but not yet completed) */}
        {lead.completion_pin && currentStep >= 2 && currentStep < 4 && (
          <div className="bg-white border-2 border-primary/20 rounded-3xl p-8 text-center shadow-xl shadow-primary/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Secure Completion PIN</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Please provide this 6-digit PIN to your installer <strong className="text-foreground">only after</strong> the installation is completed to your absolute satisfaction.
            </p>
            <div className="inline-flex items-center justify-center gap-3 bg-muted/50 p-4 rounded-2xl border border-border">
              {lead.completion_pin.split('').map((digit: string, i: number) => (
                <div key={i} className="w-12 h-14 bg-white border border-border rounded-xl flex items-center justify-center text-3xl font-black text-foreground shadow-sm">
                  {digit}
                </div>
              ))}
            </div>
            
            {lead.assigned_installer_name && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-500/10 py-2 px-4 rounded-full w-fit mx-auto">
                <CheckCircle2 className="w-4 h-4" /> Installer Assigned: {lead.assigned_installer_name}
              </div>
            )}
          </div>
        )}

        {/* Progress Stepper */}
        <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
          <div className="relative">
            <div className="absolute left-[27px] top-[32px] bottom-[32px] w-0.5 bg-muted" />
            <div className="space-y-8 relative">
              {steps.map((step, idx) => {
                const isCompleted = currentStep > step.num;
                const isCurrent = currentStep === step.num;
                const isPending = currentStep < step.num;
                const Icon = step.icon;

                return (
                  <div key={idx} className="flex items-start gap-6">
                    <div className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-4 border-white shadow-sm transition-colors duration-500 ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-primary text-white animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <div className="pt-3">
                      <h3 className={`font-bold text-lg ${isPending ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {step.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white border border-border rounded-3xl p-6 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-muted rounded-xl">
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground uppercase tracking-wider mb-1">Service Address</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lead.customer_name}<br/>
              {lead.address?.full_address || lead.detected_city || "Address not provided"}<br/>
              {lead.mobile_number}
            </p>
          </div>
        </div>
        
        {/* Help */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">Need help? Contact support at <a href="tel:18001234567" className="text-primary font-medium hover:underline">1800-123-4567</a></p>
        </div>

      </div>
    </div>
  );
}
