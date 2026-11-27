/**
 * Progressive Web App Badging API Utility
 * Supports setting unread badges on Windows Taskbar, macOS Dock, and iOS/Android Home Screen icons.
 */

export async function setAppBadge(count?: number): Promise<boolean> {
  if (typeof window === "undefined" || !("setAppBadge" in navigator)) {
    return false;
  }

  try {
    if (count !== undefined && count > 0) {
      await (navigator as unknown as { setAppBadge: (count: number) => Promise<void> }).setAppBadge(count);
    } else {
      await (navigator as unknown as { setAppBadge: () => Promise<void> }).setAppBadge();
    }
    return true;
  } catch (err) {
    console.debug("PWA App Badging not supported or permission denied:", err);
    return false;
  }
}

export async function clearAppBadge(): Promise<boolean> {
  if (typeof window === "undefined" || !("clearAppBadge" in navigator)) {
    return false;
  }

  try {
    await (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge();
    return true;
  } catch (err) {
    console.debug("PWA App Badging clear error:", err);
    return false;
  }
}
