export async function installSnapshot(snapshot) {
  const modules = [
    "./firebase-admin-firestore.mjs",
    "./cached-catalog.mjs",
    "./cached-settings.mjs",
  ];
  for (const specifier of modules) {
    const mod = await import(new URL(specifier, import.meta.url).href);
    if (typeof mod.__setSnapshot === "function") mod.__setSnapshot(snapshot);
    if (typeof mod.__resetWrites === "function") mod.__resetWrites();
  }
}
