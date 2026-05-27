import { type LucideIcon } from "lucide-react";
import { BackButton } from "./BackButton";
interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  action?: React.ReactNode;
}

/**
 * Elite reusable page header for all admin catalog/management pages.
 * Fully optimized for Dual-Mode (Day & Night).
 */
export function PageHeader({ icon: Icon, title, description, badge, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 mb-6 border-b border-border">
      <div className="flex items-center gap-4">
        <BackButton />

        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="text-xl font-semibold text-foreground tracking-tight leading-none">{title}</h1>
            {badge && (
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary border border-border px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm font-medium">{description}</p>
        </div>
      </div>
      
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
