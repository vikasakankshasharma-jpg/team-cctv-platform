"use client";

import { CheckCircle2, CircleDashed, MapPin, Package, Phone, ShieldCheck, Truck, Wrench } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { motion } from "framer-motion";

export default function TrackingClient({ lead, job, quote }: { lead: any, job: any, quote: any }) {
  const { t } = useTranslation();

  // Determine current step index
  let currentStep = 1; // 1: Order Confirmed
  if (job) currentStep = 2; // 2: Dispatching
  if (job?.status === "dispatched" || job?.status === "in_progress" || lead.assigned_to_installer_id) currentStep = 3; // 3: Installer En-Route
  if (lead.status === "won" && lead.installation_proof_url) currentStep = 4; // 4: Completed

  const steps = [
    { num: 1, label: t("track_step_1", "Order Confirmed"), desc: t("track_step_1_desc", "Payment received & verified."), icon: ShieldCheck },
    { num: 2, label: t("track_step_2", "Equipment Ready"), desc: t("track_step_2_desc", "Your cameras are ready to be sent."), icon: Package },
    { num: 3, label: t("track_step_3", "Installer on the Way"), desc: t("track_step_3_desc", "An installer is assigned to you."), icon: Truck },
    { num: 4, label: t("track_step_4", "Installation Complete"), desc: t("track_step_4_desc", "Your installation is done."), icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-500/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto space-y-8"
      >
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full mb-2">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{t("track_installation", "Track Your Installation")}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">{t("track_order_num", "Order")} #{lead.id?.substring(0,8).toUpperCase()}</p>
        </div>

        {/* OTP Secure Box (Only visible when active & installer assigned, but not yet completed) */}
        {lead.completion_pin && currentStep >= 2 && currentStep < 4 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 border-2 border-emerald-500/20 dark:border-emerald-500/10 rounded-[2rem] p-8 text-center shadow-2xl shadow-emerald-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <h2 className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">{t("track_secret_pin", "Secret Completion PIN")}</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              {t("track_pin_desc", "Please give this 6-digit PIN to your installer only after the installation is fully completed and you are happy with it.")}
            </p>
            <div className="inline-flex items-center justify-center gap-2 sm:gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              {lead.completion_pin.split('').map((digit: string, i: number) => (
                <div key={i} className="w-10 h-12 sm:w-14 sm:h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white shadow-sm">
                  {digit}
                </div>
              ))}
            </div>
            
            {lead.assigned_installer_name && (
              <div className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 py-3 px-6 rounded-full w-fit mx-auto border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" /> {t("track_installer_assigned", "Installer Assigned:")} {lead.assigned_installer_name}
              </div>
            )}
          </motion.div>
        )}

        {/* Progress Stepper */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-zinc-200/20 dark:shadow-none">
          <div className="relative">
            <div className="absolute left-[31px] top-[32px] bottom-[32px] w-0.5 bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-10 relative">
              {steps.map((step, idx) => {
                const isCompleted = currentStep > step.num;
                const isCurrent = currentStep === step.num;
                const isPending = currentStep < step.num;
                const Icon = step.icon;

                return (
                  <div key={idx} className="flex items-start gap-6 group">
                    <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl border-4 border-white dark:border-zinc-900 shadow-sm transition-all duration-500 ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'}`}>
                      {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : <Icon className={`w-7 h-7 ${isCurrent ? 'animate-pulse' : ''}`} />}
                    </div>
                    <div className="pt-3">
                      <h3 className={`font-black text-xl tracking-tight transition-colors ${isPending ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-white'}`}>
                        {step.label}
                      </h3>
                      <p className={`text-sm mt-1.5 leading-relaxed ${isPending ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-none flex items-start gap-5">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl shrink-0">
            <MapPin className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div>
            <h4 className="font-black text-xs text-zinc-900 dark:text-white uppercase tracking-widest mb-2">{t("track_service_address", "Service Address")}</h4>
            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              <span className="text-zinc-900 dark:text-white">{lead.customer_name}</span><br/>
              {lead.address?.full_address || lead.detected_city || t("track_address_not_provided", "Address not provided")}<br/>
              {lead.mobile_number}
            </p>
          </div>
        </div>
        
        {/* Help */}
        <div className="text-center pt-8">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {t("track_need_help", "Need help? Contact support at")} <a href="tel:18001234567" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold hover:underline transition-all">1800-123-4567</a>
          </p>
        </div>

      </motion.div>
    </div>
  );
}
