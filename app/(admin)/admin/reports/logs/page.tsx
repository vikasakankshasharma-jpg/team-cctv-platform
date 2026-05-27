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

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-secondary/40 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event / Timestamp</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actor</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground font-medium italic">
                    No security events recorded in this period.
                  </td>
                </tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-secondary/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${log.action.includes('FAILURE') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground tracking-tight">{log.action.replace(/_/g, ' ')}</div>
                        <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5" /> {format(log.timestamp, "MMM d, yyyy \u00B7 HH:mm:ss")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="text-[12px] font-medium text-foreground">
                        {log.actor_email || log.actor_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      log.resource_type === 'auth' ? 'bg-warning/10 text-warning' :
                      log.resource_type === 'quote' ? 'bg-success/10 text-success' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {log.resource_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 relative">
                      <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> {log.ip_address || "Unknown IP"}
                      </div>
                      {log.metadata && (
                        <div className="text-[11px] text-muted-foreground font-mono bg-card p-3 rounded-xl border border-border hidden group-hover:block absolute z-10 max-w-xs shadow-md mt-1 right-0 sm:left-0 sm:right-auto">
                          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(log.metadata, null, 2)}</pre>
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
