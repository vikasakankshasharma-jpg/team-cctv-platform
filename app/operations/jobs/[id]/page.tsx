"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Job, InvoiceItemSnapshot } from "@/types";
import { SiteSurveyRevisionModal } from "@/components/operations/SiteSurveyRevisionModal";
import { useTranslation } from "@/hooks/useTranslation";

export default function JobCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = useState<Job | null>(null);
  const [materials, setMaterials] = useState<InvoiceItemSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Transition state
  const [transitioning, setTransitioning] = useState(false);
  const [checklist, setChecklist] = useState({
    installed: false,
    site_clean: false,
    customer_handover: false
  });

  // Site survey revision modal state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

  useEffect(() => {
    fetchJobCard();
  }, [jobId]);

  const fetchJobCard = async () => {
    try {
      const res = await fetch(`/api/operations/jobs/${jobId}`);
      if (!res.ok) throw new Error(t("ops_job_load_err", "Failed to load Job Card"));
      const json = await res.json();
      setJob(json.data.job);
      setMaterials(json.data.materials || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async (nextStatus: string) => {
    if (nextStatus === "COMPLETED") {
      if (!checklist.installed || !checklist.site_clean || !checklist.customer_handover) {
        alert(t("ops_checklist_req", "Please complete the checklist before finishing the job."));
        return;
      }
    }

    setTransitioning(true);
    try {
      const res = await fetch(`/api/operations/jobs/${jobId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, note: `Transitioned to ${nextStatus} via Installer App` })
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || t("ops_transition_fail", "Transition failed"));
      }
      await fetchJobCard(); // reload data
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) return <div className="p-4 md:p-8 text-center text-teal-400">{t("ops_loading_job", "Loading Job Card...")}</div>;
  if (error) return <div className="p-4 md:p-8 text-red-400">{error}</div>;
  if (!job) return <div className="p-4 md:p-8">{t("ops_job_not_found", "Job not found")}</div>;

  const isAlert = job.status === "BACKORDERED" || job.status === "MATERIAL_SHORTAGE";

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Link href="/operations" className="text-gray-400 hover:text-white">{t("ops_back_dash", "← Dashboard")}</Link>
        <h2 className="text-xl sm:text-2xl font-bold">{t("ops_job_card", "Job Card")}</h2>
        <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${isAlert ? 'bg-orange-900 text-orange-200' : 'bg-teal-900 text-teal-200'}`}>
          {job.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Col: Site Survey */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">{t("ops_survey_snap", "Site Survey Snapshot")}</h3>
          {job.site_survey ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-400 text-xs">{t("ops_mount_height", "Mounting Height")}</dt>
                <dd className="font-medium text-gray-200">{job.site_survey.mounting_height}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">{t("ops_surface_type", "Surface Type")}</dt>
                <dd className="font-medium text-gray-200">{job.site_survey.surface_type}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">{t("ops_ladder_req", "Ladder Required?")}</dt>
                <dd className="font-medium text-gray-200">{job.site_survey.ladder_required ? t("ops_ladder_yes", "Yes (Bring 15ft+)") : t("ops_no", "No")}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">{t("ops_wall_pen", "Wall Penetration")}</dt>
                <dd className="font-medium text-gray-200">{job.site_survey.wall_penetration}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">{t("ops_site_status", "Site Status")}</dt>
                <dd className="font-medium text-gray-200">{job.site_survey.furnishing_status}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">{t("ops_cameras_lbl", "Cameras")}</dt>
                <dd className="font-medium text-gray-200">{t("ops_cam_counts", "{inCount} In / {outCount} Out", {
                  inCount: String(job.site_survey.indoor_camera_count ?? 0),
                  outCount: String(job.site_survey.outdoor_camera_count ?? 0),
                })}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-gray-500 text-sm">{t("ops_no_survey_data", "No site survey data available.")}</p>
          )}

          <div className="pt-2 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setIsRevisionModalOpen(true)}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2 px-4 rounded text-sm transition shadow-sm whitespace-normal"
            >
              {t("ops_revise_quote_btn", "Report Site Difficulties & Revise Quote")}
            </button>
          </div>
        </div>

        {/* Right Col: Materials */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-700 pb-2">
             <h3 className="text-lg font-semibold text-white">{t("ops_req_materials", "Required Materials")}</h3>
             <span className="text-xs text-gray-400">{t("ops_bring_to_site", "Bring to site")}</span>
          </div>
          
          <ul className="space-y-3">
            {materials.map((m, idx) => (
              <li key={idx} className="flex justify-between items-start gap-2 text-sm bg-gray-900 p-3 rounded">
                <div>
                  <span className="font-medium text-gray-200">{m.display_name}</span>
                  {m.product_id.startsWith('surcharge') && <span className="ml-2 text-xs text-orange-400 border border-orange-400 px-1 rounded">{t("ops_service_badge", "SERVICE")}</span>}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-teal-400">x{m.qty}</span>
                </div>
              </li>
            ))}
            {materials.length === 0 && <p className="text-gray-500 text-sm">{t("ops_no_materials", "No materials listed.")}</p>}
          </ul>

          <div className="mt-4 pt-4 border-t border-gray-700">
             <button onClick={() => alert(t("ops_change_order_stub", "Change Order API call would happen here"))} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm font-medium whitespace-normal">
               {t("ops_add_extra_mat", "+ Add Extra Material (Change Order)")}
             </button>
             <p className="text-xs text-gray-500 mt-2 text-center">{t("ops_no_cash_warning", "Do not collect cash without generating a change order.")}</p>
          </div>
        </div>

      </div>

      {/* Action Bar */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">{t("ops_exec_controls", "Execution Controls")}</h3>
        
        {job.status === "ASSIGNED" && (
          <button 
            disabled={transitioning}
            onClick={() => handleTransition("IN_PROGRESS")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-bold text-lg disabled:opacity-50 whitespace-normal"
          >
            {transitioning ? t("ops_processing", "Processing...") : t("ops_start_work", "Start Work (Mark In-Progress)")}
          </button>
        )}

        {job.status === "IN_PROGRESS" && (
          <div className="space-y-4 border-t border-gray-700 pt-4">
            <h4 className="font-medium text-gray-300 mb-2">{t("ops_comp_checklist", "Completion Checklist")}</h4>
            <div className="space-y-2 text-sm text-gray-200 bg-gray-900 p-4 rounded border border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded text-teal-500 focus:ring-teal-500 bg-gray-700 border-gray-600 shrink-0" 
                  checked={checklist.installed} onChange={e => setChecklist({...checklist, installed: e.target.checked})} />
                <span>{t("ops_chk_tested", "All cameras and DVR installed and tested successfully")}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded text-teal-500 focus:ring-teal-500 bg-gray-700 border-gray-600 shrink-0" 
                  checked={checklist.site_clean} onChange={e => setChecklist({...checklist, site_clean: e.target.checked})} />
                <span>{t("ops_chk_cleaned", "Site cleaned up, ladder/debris removed")}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded text-teal-500 focus:ring-teal-500 bg-gray-700 border-gray-600 shrink-0" 
                  checked={checklist.customer_handover} onChange={e => setChecklist({...checklist, customer_handover: e.target.checked})} />
                <span>{t("ops_chk_app", "Customer app configured and handover complete")}</span>
              </label>
            </div>
            <button 
              disabled={transitioning || !checklist.installed || !checklist.site_clean || !checklist.customer_handover}
              onClick={() => handleTransition("COMPLETED")}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-bold text-lg disabled:opacity-50 disabled:bg-gray-600 whitespace-normal"
            >
              {transitioning ? t("ops_processing", "Processing...") : t("ops_finish_job", "Finish Job")}
            </button>
          </div>
        )}

        {job.status === "COMPLETED" && (
          <div className="text-center p-4 bg-green-900/30 text-green-400 rounded font-semibold">
            {t("ops_job_locked", "Job is completed and locked.")}
          </div>
        )}
      </div>

      {job && isRevisionModalOpen && (
        <SiteSurveyRevisionModal
          isOpen={isRevisionModalOpen}
          onClose={() => setIsRevisionModalOpen(false)}
          leadId={job.lead_id}
          parentQuoteId={(job as any).quote_id || (job as any).latest_quote_id || job.id!}
          currentVersion={(job as any).quote_version || 1}
          initialFlags={(job.site_survey as any)?.site_surcharge_flags}
          onSuccess={() => {
            fetchJobCard();
            setIsRevisionModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
