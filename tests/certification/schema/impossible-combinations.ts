import type { CanonicalRequirement } from "./canonical-requirement.ts";

export type RequirementIssueSeverity = "INVALID" | "MANUAL_QUOTE" | "WARNING";

export interface RequirementIssue {
  code: string;
  severity: RequirementIssueSeverity;
  message: string;
}

export interface ImpossibleCombinationResult {
  valid: boolean;
  requires_manual_quote: boolean;
  issues: RequirementIssue[];
}

function normalizedText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isAnalogOnlyRecorder(technology: unknown): boolean {
  const value = normalizedText(technology);
  return value === "analog" || value === "analogue" || value === "analog-only" || value === "dvr";
}

function isAnalogOnlyPowerSupply(technology: unknown): boolean {
  const value = normalizedText(technology);
  return (
    value === "analog" ||
    value === "analogue" ||
    value === "analog-only" ||
    value === "dvr" ||
    value === "12v_analog"
  );
}

function cameraCountByTechnology(
  requirement: CanonicalRequirement,
): Record<"HD" | "IP" | "Wireless", number> {
  const counts = { HD: 0, IP: 0, Wireless: 0 };
  for (const camera of requirement.cameras) {
    counts[camera.technology] += camera.count;
  }
  return counts;
}

function addIssue(
  issues: RequirementIssue[],
  severity: RequirementIssueSeverity,
  code: string,
  message: string,
): void {
  issues.push({ code, severity, message });
}

/**
 * Classifies semantic impossibilities (`INVALID`) separately from automated
 * quotation capacity boundaries (`MANUAL_QUOTE`).
 */
export function detectImpossibleCombinations(
  requirement: CanonicalRequirement,
): ImpossibleCombinationResult {
  const issues: RequirementIssue[] = [];

  if (requirement.camera_count <= 0 || !Number.isInteger(requirement.camera_count)) {
    addIssue(
      issues,
      "INVALID",
      "INVALID_CAMERA_COUNT",
      "camera_count must be a positive integer.",
    );
  }

  if (requirement.camera_count > 128) {
    addIssue(
      issues,
      "INVALID",
      "CAMERA_COUNT_EXCEEDS_CERTIFICATION_BOUND",
      "camera_count above 128 is outside the supported certification domain.",
    );
  }

  if (requirement.cameras.length > 0) {
    const cameraArrayCount = requirement.cameras.reduce((total, camera) => total + camera.count, 0);
    if (cameraArrayCount !== requirement.camera_count) {
      addIssue(
        issues,
        "INVALID",
        "CAMERA_COUNT_MISMATCH",
        `cameras[].count total (${cameraArrayCount}) does not equal camera_count (${requirement.camera_count}).`,
      );
    }
  }

  if (
    requirement.cabling_mode === "mixed" &&
    (requirement.cabling_needed_cameras === undefined || requirement.cabling_needed_cameras <= 0)
  ) {
    addIssue(
      issues,
      "INVALID",
      "MIXED_CABLING_REQUIRES_NEW_CAMERAS",
      "mixed cabling requires cabling_needed_cameras greater than zero.",
    );
  }

  if (
    requirement.cabling_needed_cameras !== undefined &&
    requirement.cabling_needed_cameras > requirement.camera_count
  ) {
    addIssue(
      issues,
      "INVALID",
      "CABLING_CAMERA_COUNT_EXCEEDED",
      "cabling_needed_cameras cannot exceed camera_count.",
    );
  }

  if (requirement.cable_length_meters !== undefined && requirement.cable_length_meters < 0) {
    addIssue(issues, "INVALID", "NEGATIVE_CABLE_LENGTH", "cable_length_meters cannot be negative.");
  }

  if (
    requirement.recording_days !== undefined &&
    (requirement.recording_days < 0 ||
      requirement.recording_days > 365 ||
      !Number.isInteger(requirement.recording_days))
  ) {
    addIssue(
      issues,
      "INVALID",
      "INVALID_RECORDING_DAYS",
      "recording_days must be an integer from 0 through 365.",
    );
  }

  const effectiveRecorderChannels =
    requirement.recorder_channels ?? requirement.recorder?.channel_capacity;
  const effectiveStorageSelected =
    requirement.storage_selected === true || requirement.storage?.selected === true;

  if (
    requirement.camera_count === 0 &&
    (effectiveRecorderChannels !== undefined || effectiveStorageSelected)
  ) {
    addIssue(
      issues,
      "INVALID",
      "ZERO_CAMERAS_WITH_RECORDER_OR_STORAGE",
      "A zero-camera requirement cannot contain a recorder or selected storage.",
    );
  }

  const technologyCounts = cameraCountByTechnology(requirement);

  if (technologyCounts.HD > 16) {
    addIssue(
      issues,
      "MANUAL_QUOTE",
      "HD_CAMERA_CAP_EXCEEDED",
      `HD camera count ${technologyCounts.HD} exceeds the 16-camera catalog cap.`,
    );
  }

  if (technologyCounts.IP > 32) {
    addIssue(
      issues,
      "MANUAL_QUOTE",
      "IP_CAMERA_CAP_EXCEEDED",
      `IP camera count ${technologyCounts.IP} exceeds the 32-camera catalog cap.`,
    );
  }

  if (technologyCounts.Wireless > 16) {
    addIssue(
      issues,
      "MANUAL_QUOTE",
      "WIRELESS_CAMERA_CAP_EXCEEDED",
      `Wireless camera count ${technologyCounts.Wireless} exceeds the 16-camera catalog cap.`,
    );
  }

  if (requirement.cameras.length === 0 && requirement.technology !== undefined) {
    if (requirement.technology === "HD" && requirement.camera_count > 16) {
      addIssue(
        issues,
        "MANUAL_QUOTE",
        "HD_CAMERA_CAP_EXCEEDED",
        `HD camera count ${requirement.camera_count} exceeds the 16-camera catalog cap.`,
      );
    }
    if (requirement.technology === "IP" && requirement.camera_count > 32) {
      addIssue(
        issues,
        "MANUAL_QUOTE",
        "IP_CAMERA_CAP_EXCEEDED",
        `IP camera count ${requirement.camera_count} exceeds the 32-camera catalog cap.`,
      );
    }
    if (requirement.technology === "Wireless" && requirement.camera_count > 16) {
      addIssue(
        issues,
        "MANUAL_QUOTE",
        "WIRELESS_CAMERA_CAP_EXCEEDED",
        `Wireless camera count ${requirement.camera_count} exceeds the 16-camera catalog cap.`,
      );
    }
  }

  if (requirement.camera_count > 64) {
    addIssue(
      issues,
      "MANUAL_QUOTE",
      "CAMERA_COUNT_OVER_64",
      `Camera count ${requirement.camera_count} exceeds the standard 64-camera quotation boundary.`,
    );
  }

  if (effectiveRecorderChannels !== undefined) {
    const recorderTechnology = normalizedText(
      requirement.recorder_technology ?? requirement.recorder?.technology,
    );

    if (effectiveRecorderChannels > 64) {
      addIssue(
        issues,
        "MANUAL_QUOTE",
        "UI_RECORDER_CAP_EXCEEDED",
        `Recorder channel capacity ${effectiveRecorderChannels} exceeds the 64-camera UI cap.`,
      );
    } else if (
      (recorderTechnology === "hd" ||
        recorderTechnology === "analog" ||
        recorderTechnology === "dvr") &&
      effectiveRecorderChannels > 16
    ) {
      addIssue(
        issues,
        "MANUAL_QUOTE",
        "HD_RECORDER_CAP_EXCEEDED",
        `HD recorder channel capacity ${effectiveRecorderChannels} exceeds the 16-camera catalog cap.`,
      );
    } else if (recorderTechnology === "ip" && effectiveRecorderChannels > 32) {
      addIssue(
        issues,
        "MANUAL_QUOTE",
        "IP_RECORDER_CAP_EXCEEDED",
        `IP recorder channel capacity ${effectiveRecorderChannels} exceeds the 32-camera catalog cap.`,
      );
    } else if (recorderTechnology === "wireless" && effectiveRecorderChannels > 16) {
      addIssue(
        issues,
        "MANUAL_QUOTE",
        "WIRELESS_RECORDER_CAP_EXCEEDED",
        `Wireless recorder channel capacity ${effectiveRecorderChannels} exceeds the 16-camera catalog cap.`,
      );
    }
  }

  const effectiveRecorderTechnology =
    requirement.recorder_technology ?? requirement.recorder?.technology;

  if (
    (technologyCounts.Wireless > 0 ||
      (requirement.cameras.length === 0 && requirement.technology === "Wireless")) &&
    isAnalogOnlyRecorder(effectiveRecorderTechnology)
  ) {
    addIssue(
      issues,
      "INVALID",
      "WIRELESS_WITH_ANALOG_RECORDER",
      "Wireless cameras cannot use an analog-only recorder.",
    );
  }

  if (
    isAnalogOnlyPowerSupply(requirement.power_supply_technology) &&
    (technologyCounts.IP > 0 ||
      (requirement.cameras.length === 0 && requirement.technology === "IP"))
  ) {
    addIssue(
      issues,
      "INVALID",
      "IP_WITH_ANALOG_POWER_SUPPLY",
      "IP camera configuration cannot use an analog-only power supply.",
    );
  }

  if (requirement.hybrid_wired_technology !== undefined) {
    const hybridTechnology = requirement.hybrid_wired_technology;
    const hybridCount = technologyCounts[hybridTechnology];
    if (hybridTechnology === "HD" && hybridCount > 16) {
      addIssue(
        issues,
        "MANUAL_QUOTE",
        "HYBRID_HD_CAP_EXCEEDED",
        `Hybrid HD camera count ${hybridCount} exceeds the 16-camera cap.`,
      );
    }
    if (hybridTechnology === "IP" && hybridCount > 32) {
      addIssue(
        issues,
        "MANUAL_QUOTE",
        "HYBRID_IP_CAP_EXCEEDED",
        `Hybrid IP camera count ${hybridCount} exceeds the 32-camera cap.`,
      );
    }
  }

  if (
    requirement.legacy_plan_type ||
    requirement.legacy_tier ||
    requirement.legacy_selected_plan ||
    requirement.legacy_plan ||
    requirement.plan_type ||
    requirement.tier ||
    requirement.selected_plan ||
    requirement.plan
  ) {
    addIssue(
      issues,
      "WARNING",
      "LEGACY_PLAN_DRIFT",
      "Legacy plan/tier fields are present; certification uses technology × resolution × brand instead of business-plan tiers.",
    );
  }

  const invalid = issues.some((issue) => issue.severity === "INVALID");
  const requiresManualQuote = issues.some((issue) => issue.severity === "MANUAL_QUOTE");

  return {
    valid: !invalid,
    requires_manual_quote: requiresManualQuote,
    issues,
  };
}

export function isImpossibleCombination(requirement: CanonicalRequirement): boolean {
  return !detectImpossibleCombinations(requirement).valid;
}
