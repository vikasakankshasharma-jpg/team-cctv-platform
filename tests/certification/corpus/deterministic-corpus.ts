import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import { parseCanonicalRequirement } from "../schema/canonical-requirement.ts";
import { sha256Json } from "../fixtures/frozen-context.ts";

export interface CorpusCase { caseId: string; seed: number; requirement: CanonicalRequirement; expectedClassification: "VALID" | "MANUAL_QUOTE" | "INVALID"; }

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 0x100000000; };
}

function classification(count: number, technology: string): CorpusCase["expectedClassification"] {
  if (count <= 0 || count > 128) return "INVALID";
  if (technology === "IP" && count > 32) return "MANUAL_QUOTE";
  if ((technology === "HD" || technology === "Wireless") && count > 16) return "MANUAL_QUOTE";
  return "VALID";
}

function validCameraType(index: number, technology: string): { technology: string; count: number; resolution: string; wireless_family?: string; requested_features: string[] } {
  const families = ["4g_solar", "outdoor_ptz", "indoor_fixed", undefined];
  const family = technology === "Wireless" ? families[index % families.length] : undefined;
  const features = index % 3 === 0 ? ["outdoor"] : index % 5 === 0 ? ["ptz"] : [];
  return { technology, count: 1, resolution: technology === "IP" ? "4MP" : "2MP", wireless_family: family, requested_features: features };
}

function buildRequirement(index: number, rnd: () => number): CanonicalRequirement {
  const scenarios = [
    { technology: "HD", count: 1, cabling_mode: "all_new", installation_preference: "pro", wiring_type: "open", cable_type: "RG59" },
    { technology: "IP", count: 4, cabling_mode: "all_new", installation_preference: "pro", wiring_type: "conduit", cable_type: "CAT6" },
    { technology: "Wireless", count: 4, cabling_mode: "all_existing", installation_preference: "diy", wiring_type: "open" },
    { technology: "HD", count: 8, cabling_mode: "mixed", installation_preference: "pro", wiring_type: "conduit", cable_type: "RG59" },
    { technology: "IP", count: 16, cabling_mode: "all_new", installation_preference: "diy", wiring_type: "open", cable_type: "CAT6" },
    { technology: "Wireless", count: 17, cabling_mode: "all_existing", installation_preference: "pro", wiring_type: "open" },
    { technology: "IP", count: 33, cabling_mode: "all_new", installation_preference: "pro", wiring_type: "conduit", cable_type: "CAT6" },
    { technology: "HD", count: 17, cabling_mode: "all_new", installation_preference: "pro", wiring_type: "open", cable_type: "RG59" },
    { technology: "IP", count: 64, cabling_mode: "all_new", installation_preference: "pro", wiring_type: "conduit", cable_type: "CAT6" },
    { technology: "HD", count: 128, cabling_mode: "mixed", installation_preference: "diy", wiring_type: "conduit", cable_type: "RG59" },
    { technology: "IP", count: 129, cabling_mode: "all_new", installation_preference: "pro", wiring_type: "conduit", cable_type: "CAT6" },
    { technology: "HD", count: 0, cabling_mode: "all_existing", installation_preference: "diy", wiring_type: "open", cable_type: "RG59" },
    { technology: "HD", count: 2, cabling_mode: "mixed", installation_preference: "pro", wiring_type: "open", cable_type: "RG59", cameraSet: [
      { technology: "HD", count: 1, resolution: "2MP", requested_features: ["indoor"] },
      { technology: "HD", count: 1, resolution: "2MP", requested_features: ["outdoor"] },
    ] },
  ] as const;
  const scenario = scenarios[index % scenarios.length];
  const count = scenario.count;
  const technology = scenario.technology;
  const cameras = "cameraSet" in scenario ? scenario.cameraSet.map((camera) => ({ ...camera })) : [{ ...validCameraType(index, technology), count }];
  const recordingDays = index % 4 === 0 ? 0 : Math.floor(rnd() * 31);
  const cablingMode = scenario.cabling_mode === "mixed" ? "mixed" : scenario.cabling_mode;
  const cableLength = cablingMode === "all_existing" ? 0 : Math.floor(rnd() * 401);
  const requirement = {
    technology,
    camera_count: count,
    recording_days: recordingDays,
    cabling_mode: cablingMode,
    cable_length_meters: cableLength,
    requested_features: [],
    installation_preference: scenario.installation_preference,
    cable_type: 'cable_type' in scenario ? scenario.cable_type : undefined,
    wiring_type: scenario.wiring_type,
    cameras,
  } as CanonicalRequirement;

  if (count > 0 && count <= 128) return parseCanonicalRequirement(requirement);
  return requirement;
}

export function generateCorpus(seed: number, count: number): CorpusCase[] {
  const rnd = lcg(seed); const cases: CorpusCase[] = [];
  for (let i = 0; i < count; i += 1) {
    const requirement = buildRequirement(i, rnd);
    const total = Number(requirement.camera_count ?? requirement.cameras.reduce((sum, camera) => sum + camera.count, 0));
    const technology = String(requirement.technology ?? requirement.cameras[0]?.technology ?? "HD");
    const expectedClassification = classification(total, technology);
    cases.push({ caseId: `seed-${seed}-${i}-${sha256Json(requirement).slice(0, 10)}`, seed, requirement, expectedClassification });
  }
  return cases;
}
