import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { ShieldAlert, Terminal, User, Clock, Globe } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requireAdmin();

  // Fetch recent audit logs
  const logsSnap = await adminDb.collection("audit_logs")
    .orderBy("timestamp", "desc")
    .limit(50)
    .get();

  const logs = logsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: (data.timestamp as any)?.toDate?.() ?? new Date(data.timestamp)
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        icon={ShieldAlert} 
        title="Enterprise Audit Trail" 
        description="Immutable record of all administrative and security events on the platform."
      />

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Event / Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Actor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Action</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-zinc-400 font-bold italic">
                    No security events recorded in this period.
                  </td>
                </tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${log.action.includes('FAILURE') ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</div>
                        <div className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {format(log.timestamp, "MMM d, yyyy \u00B7 HH:mm:ss")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <User className="w-3 h-3 text-zinc-500" />
                      </div>
                      <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        {log.actor_email || log.actor_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                      log.resource_type === 'auth' ? 'bg-amber-500/10 text-amber-500' :
                      log.resource_type === 'quote' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {log.resource_type}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {log.ip_address || "Unknown IP"}
                      </div>
                      {log.metadata && (
                        <div className="text-[10px] text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-950/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 hidden group-hover:block absolute z-10 max-w-xs shadow-xl">
                          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
