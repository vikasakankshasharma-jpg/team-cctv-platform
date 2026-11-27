/**
 * Offline-First Field Storage & Background Queue
 * Allows technicians and couriers to operate in zero-signal basements and auto-sync on reconnection.
 */

export interface QueuedOfflineAction {
  id: string;
  type: "JOB_CHECKLIST" | "DELIVERY_NOTE" | "SITE_SURVEY_NOTE";
  jobId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

class OfflineStorageManager {
  private queueKey = "team_cctv_offline_queue";

  public isOnline(): boolean {
    if (typeof window === "undefined") return true;
    return window.navigator.onLine;
  }

  public getQueue(): QueuedOfflineAction[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.queueKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public enqueueAction(action: Omit<QueuedOfflineAction, "id" | "timestamp">): QueuedOfflineAction {
    const item: QueuedOfflineAction = {
      ...action,
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    const current = this.getQueue();
    current.push(item);

    if (typeof window !== "undefined") {
      localStorage.setItem(this.queueKey, JSON.stringify(current));
    }

    return item;
  }

  public clearQueue(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.queueKey);
    }
  }

  /**
   * Flushes pending offline actions to the backend when network reconnects
   */
  public async syncPendingActions(): Promise<{ synced: number; failed: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: QueuedOfflineAction[] = [];

    for (const item of queue) {
      try {
        const res = await fetch("/api/installer/sync-offline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        if (res.ok) {
          synced++;
        } else {
          failed++;
          remaining.push(item);
        }
      } catch (err) {
        console.warn("Failed to sync item:", item.id, err);
        failed++;
        remaining.push(item);
      }
    }

    if (typeof window !== "undefined") {
      if (remaining.length > 0) {
        localStorage.setItem(this.queueKey, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(this.queueKey);
      }
    }

    return { synced, failed };
  }
}

export const offlineStorage = new OfflineStorageManager();
