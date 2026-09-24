"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldCheck, Search, Plus, 
  MapPin, Check, X, Building2, Users, FileBox, Zap, IndianRupee 
} from "lucide-react";

type PermissionGroup = {
  crm_sales: Record<string, boolean>;
  operations: Record<string, boolean>;
  catalog: Record<string, boolean>;
  financial: Record<string, boolean>;
  system: Record<string, boolean>;
};

const DEFAULT_PERMISSIONS: PermissionGroup = {
  crm_sales: { view_all_leads: false, reassign_leads: false, override_quotation_price: false, approve_price_match: false, manage_campaigns: false },
  operations: { manage_dispatch: false, manage_installers: false, manage_hubs: false },
  catalog: { edit_catalog: false, run_imports: false, manage_compatibility: false },
  financial: { edit_global_pricing: false, view_financials: false, process_refunds: false, approve_payouts: false, reconcile_cash: false, export_tax_reports: false },
  system: { manage_staff: false, manage_settings: false, view_audit_logs: false }
};

const ROLE_TEMPLATES: Record<string, PermissionGroup> = {
  "super_admin": {
    crm_sales: { view_all_leads: true, reassign_leads: true, override_quotation_price: true, approve_price_match: true, manage_campaigns: true },
    operations: { manage_dispatch: true, manage_installers: true, manage_hubs: true },
    catalog: { edit_catalog: true, run_imports: true, manage_compatibility: true },
    financial: { edit_global_pricing: true, view_financials: true, process_refunds: true, approve_payouts: true, reconcile_cash: true, export_tax_reports: true },
    system: { manage_staff: true, manage_settings: true, view_audit_logs: true }
  },
  "sales_manager": {
    ...DEFAULT_PERMISSIONS,
    crm_sales: { view_all_leads: true, reassign_leads: true, override_quotation_price: true, approve_price_match: true, manage_campaigns: true },
  },
  "dispatch_coordinator": {
    ...DEFAULT_PERMISSIONS,
    operations: { manage_dispatch: true, manage_installers: false, manage_hubs: false },
  },
  "inventory_admin": {
    ...DEFAULT_PERMISSIONS,
    catalog: { edit_catalog: true, run_imports: true, manage_compatibility: false },
  },
  "internal_accountant": {
    ...DEFAULT_PERMISSIONS,
    financial: { edit_global_pricing: false, view_financials: true, process_refunds: true, approve_payouts: true, reconcile_cash: true, export_tax_reports: true },
  },
  "external_ca": {
    ...DEFAULT_PERMISSIONS,
    financial: { edit_global_pricing: false, view_financials: true, process_refunds: false, approve_payouts: false, reconcile_cash: false, export_tax_reports: true },
  }
};

const PERMISSION_LABELS: Record<string, string> = {
  view_all_leads: "View All Leads (Global)",
  reassign_leads: "Re-assign Leads",
  override_quotation_price: "Override Quotes / Discounts",
  approve_price_match: "Approve Price Matches",
  manage_campaigns: "Manage Marketing Campaigns",
  manage_dispatch: "Manage Dispatch & Logistics",
  manage_installers: "Manage Verified Installers",
  manage_hubs: "Manage City Hubs & Geographies",
  edit_catalog: "Edit Product Catalog Specs",
  run_imports: "Run Vendor CSV Imports",
  manage_compatibility: "Manage Hardware Compatibility Rules",
  edit_global_pricing: "Edit Global Pricing & Margins",
  view_financials: "View Profitability & Financials",
  process_refunds: "Process Payment Refunds",
  approve_payouts: "Approve Commission Payouts",
  reconcile_cash: "Reconcile Offline Cash",
  export_tax_reports: "Export Tax & Govt Reports (GSTR, TDS)",
  manage_staff: "Manage Staff Roles & Access",
  manage_settings: "Manage System Settings (API Keys)",
  view_audit_logs: "View System Audit Logs",
};

export function StaffManagementClient() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "", email: "", mobile_number: "", role_template: "custom", hub_id: "all", is_active: true
  });
  const [permissions, setPermissions] = useState<PermissionGroup>(DEFAULT_PERMISSIONS);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      if (data.success) setStaffList(data.staffList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = e.target.value;
    setFormData({ ...formData, role_template: template });
    if (ROLE_TEMPLATES[template]) {
      // Deep copy to avoid mutation
      setPermissions(JSON.parse(JSON.stringify(ROLE_TEMPLATES[template])));
    } else {
      setPermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
    }
  };

  const togglePermission = (group: keyof PermissionGroup, key: string) => {
    setFormData({ ...formData, role_template: "custom" }); // Switch to custom if manually toggled
    setPermissions(prev => ({
      ...prev,
      [group]: { ...prev[group], [key]: !prev[group][key] }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { ...formData, permissions };
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchStaff();
      } else {
        alert(data.error || "Failed to save.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (staff: any) => {
    setFormData({
      name: staff.name,
      email: staff.email,
      mobile_number: staff.mobile_number,
      role_template: staff.role || "custom",
      hub_id: staff.hub_id || "all",
      is_active: staff.is_active ?? true,
    });
    setPermissions(staff.permissions || JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setFormData({ name: "", email: "", mobile_number: "", role_template: "custom", hub_id: "all", is_active: true });
    setPermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-blue-600" />
            Staff & Access Control
          </h1>
          <p className="text-gray-500 mt-2">Manage internal roles, granular permissions, and territory scoping.</p>
        </div>
        <button onClick={openNewModal} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Invite Staff Member
        </button>
      </div>

      {/* Staff Grid */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search staff..." className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading staff directory...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-sm font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name & Contact</th>
                <th className="px-6 py-4">Role Template</th>
                <th className="px-6 py-4">Territory / Hub</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{staff.name}</div>
                    <div className="text-gray-500 text-xs mt-1">{staff.email}</div>
                    <div className="text-gray-500 text-xs">{staff.mobile_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                      {staff.role?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {staff.hub_id === "all" ? "All Regions (Global)" : staff.hub_id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {staff.is_active ? (
                      <span className="flex items-center gap-1.5 text-green-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditModal(staff)} className="text-blue-600 font-medium hover:underline">Edit Powers</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-over / Modal for Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-gray-50 h-full overflow-y-auto shadow-2xl flex flex-col slide-in-from-right-full duration-300">
            
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{formData.email ? "Edit Staff Powers" : "Invite New Staff"}</h2>
                <p className="text-sm text-gray-500">Configure role templates and granular authorizations.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 space-y-8 flex-1">
              
              {/* Identity & Scope */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-gray-400"/> Identity & Territory Scope</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Rahul Sharma" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address (Login ID)</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!formData.email && formData.email !== ""} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" placeholder="rahul@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Mobile Number</label>
                    <input type="text" value={formData.mobile_number} onChange={e => setFormData({...formData, mobile_number: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="9876543210" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Territory / Hub Scoping</label>
                    <select value={formData.hub_id} onChange={e => setFormData({...formData, hub_id: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="all">Global Access (All Hubs)</option>
                      <option value="hub_delhi">Hub: Delhi NCR</option>
                      <option value="hub_mumbai">Hub: Mumbai</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Roles & Powers */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-gray-400"/> Granular Access Control</h3>
                  <select value={formData.role_template} onChange={handleTemplateChange} className="p-2 border rounded-lg font-medium text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="custom">Custom Permissions</option>
                    <option value="super_admin">Template: Super Admin</option>
                    <option value="sales_manager">Template: Sales Manager</option>
                    <option value="dispatch_coordinator">Template: Dispatch Coordinator</option>
                    
                    <option value="inventory_admin">Template: Inventory Admin</option>
                    <option value="internal_accountant">Template: Internal Accountant</option>
                    <option value="external_ca">Template: External CA (Auditor)</option>

                  </select>
                </div>

                {/* Permissions Grid */}
                <div className="space-y-8">
                  {/* CRM & Sales */}
                  <div>
                    <h4 className="text-sm font-bold text-blue-800 bg-blue-50 p-2 px-3 rounded-lg mb-3 flex items-center gap-2"><Zap className="w-4 h-4"/> CRM & Sales Powers</h4>
                    <div className="grid grid-cols-2 gap-3 px-2">
                      {Object.keys(permissions.crm_sales).map(key => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.crm_sales[key] ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
                            {permissions.crm_sales[key] && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={permissions.crm_sales[key]} onChange={() => togglePermission("crm_sales", key)} />
                          <span className="text-sm text-gray-700 font-medium select-none">{PERMISSION_LABELS[key] || key}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Operations */}
                  <div>
                    <h4 className="text-sm font-bold text-orange-800 bg-orange-50 p-2 px-3 rounded-lg mb-3 flex items-center gap-2"><Building2 className="w-4 h-4"/> Operations & Dispatch</h4>
                    <div className="grid grid-cols-2 gap-3 px-2">
                      {Object.keys(permissions.operations).map(key => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.operations[key] ? 'bg-orange-600 border-orange-600' : 'bg-white border-gray-300 group-hover:border-orange-400'}`}>
                            {permissions.operations[key] && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={permissions.operations[key]} onChange={() => togglePermission("operations", key)} />
                          <span className="text-sm text-gray-700 font-medium select-none">{PERMISSION_LABELS[key] || key}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Catalog */}
                  <div>
                    <h4 className="text-sm font-bold text-purple-800 bg-purple-50 p-2 px-3 rounded-lg mb-3 flex items-center gap-2"><FileBox className="w-4 h-4"/> Catalog & Inventory</h4>
                    <div className="grid grid-cols-2 gap-3 px-2">
                      {Object.keys(permissions.catalog).map(key => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.catalog[key] ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300 group-hover:border-purple-400'}`}>
                            {permissions.catalog[key] && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={permissions.catalog[key]} onChange={() => togglePermission("catalog", key)} />
                          <span className="text-sm text-gray-700 font-medium select-none">{PERMISSION_LABELS[key] || key}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Financial (HIGH RISK) */}
                  <div>
                    <h4 className="text-sm font-bold text-red-800 bg-red-50 p-2 px-3 rounded-lg mb-3 flex items-center gap-2"><IndianRupee className="w-4 h-4"/> Financial & Pricing (High Risk)</h4>
                    <div className="grid grid-cols-2 gap-3 px-2">
                      {Object.keys(permissions.financial).map(key => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.financial[key] ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300 group-hover:border-red-400'}`}>
                            {permissions.financial[key] && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={permissions.financial[key]} onChange={() => togglePermission("financial", key)} />
                          <span className="text-sm text-gray-700 font-medium select-none">{PERMISSION_LABELS[key] || key}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* System (CRITICAL) */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 bg-gray-200 p-2 px-3 rounded-lg mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> System Administration (Critical)</h4>
                    <div className="grid grid-cols-2 gap-3 px-2">
                      {Object.keys(permissions.system).map(key => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${permissions.system[key] ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-300 group-hover:border-gray-500'}`}>
                            {permissions.system[key] && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={permissions.system[key]} onChange={() => togglePermission("system", key)} />
                          <span className="text-sm text-gray-700 font-medium select-none">{PERMISSION_LABELS[key] || key}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-gray-700">Account is Active</span>
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-50">
                  {isSaving ? "Saving Powers..." : "Save & Assign Powers"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
