const SKIP_ALL_KEY = "team_tour_skip_all";
const PAGE_SKIP_PREFIX = "team_tour_page_skip:";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isTourSkipAllEnabled(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(SKIP_ALL_KEY) === "true";
}

export function setTourSkipAll(enabled: boolean): void {
  if (!isBrowser()) return;
  if (enabled) {
    localStorage.setItem(SKIP_ALL_KEY, "true");
  } else {
    localStorage.removeItem(SKIP_ALL_KEY);
  }
}

export function clearTourSkipAll(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(SKIP_ALL_KEY);
}

export function isPageTourSkipped(pageId: string): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(`${PAGE_SKIP_PREFIX}${pageId}`) === "true";
}

export function setPageTourSkipped(pageId: string, skipped = true): void {
  if (!isBrowser()) return;
  if (skipped) {
    localStorage.setItem(`${PAGE_SKIP_PREFIX}${pageId}`, "true");
  } else {
    localStorage.removeItem(`${PAGE_SKIP_PREFIX}${pageId}`);
  }
}
