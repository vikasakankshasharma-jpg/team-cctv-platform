import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";

export async function shrinkRequirement(
  input: CanonicalRequirement,
  fails: (candidate: CanonicalRequirement) => Promise<boolean>,
): Promise<CanonicalRequirement> {
  const candidates: CanonicalRequirement[] = [];
  const x = input as any;
  const currentCount = Number(x.camera_count ?? (Array.isArray(x.cameras) ? x.cameras.reduce((n: number, c: any) => n + Number(c?.count ?? 0), 0) : 0));
  const firstCamera = Array.isArray(x.cameras) && x.cameras[0] ? x.cameras[0] : undefined;
  if (currentCount > 1) {
    const next = Math.max(1, Math.floor(currentCount / 2));
    candidates.push({ ...x, camera_count: next, cameras: [{ ...(firstCamera ?? {}), count: next }] });
  }
  if (Number(x.recording_days ?? 0) > 0) candidates.push({ ...x, recording_days: 0 });
  if (Number(x.cable_length_meters ?? x.total_cable_length_meters ?? 0) > 0) {
    candidates.push({ ...x, cable_length_meters: 0 });
  }
  for (const candidate of candidates) {
    if (await fails(candidate)) return shrinkRequirement(candidate, fails);
  }
  return input;
}
