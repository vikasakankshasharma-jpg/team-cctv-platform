import {
  CanonicalRequirementSchema,
  type CanonicalRequirement,
  type RecorderRequirement,
  type StorageRequirement,
  type WirelessPower,
} from "./canonical-requirement.ts";
import {
  TECHNOLOGIES,
  type PowerWiringOption,
  type Technology,
  type WirelessFamily,
} from "./enums.ts";

export interface NormalizationWarning {
  code: string;
  message: string;
  path?: string;
}

export interface NormalizationResult {
  requirement: CanonicalRequirement;
  warnings: NormalizationWarning[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstDefined<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "yes") return true;
    if (normalized === "false" || normalized === "no") return false;
  }
  return undefined;
}

export function normalizeTechnology(value: unknown): Technology | undefined {
  const normalized = asString(value)?.toLowerCase();
  if (!normalized) return undefined;

  if (
    normalized === "hd" ||
    normalized === "analog" ||
    normalized === "analog hd" ||
    normalized === "ahd" ||
    normalized === "tvi" ||
    normalized === "cvi" ||
    normalized === "analogue" ||
    normalized === "dvr"
  ) {
    return "HD";
  }

  if (
    normalized === "ip" ||
    normalized === "network" ||
    normalized === "network ip" ||
    normalized === "nvr"
  ) {
    return "IP";
  }

  if (
    normalized === "wireless" ||
    normalized === "wifi" ||
    normalized === "wi-fi" ||
    normalized === "4g" ||
    normalized === "4g lte" ||
    normalized === "4g/lte"
  ) {
    return "Wireless";
  }

  return undefined;
}

function normalizeTechnologyStrict(value: unknown): Technology | undefined {
  const normalized = normalizeTechnology(value);
  if (normalized) return normalized;

  const raw = asString(value);
  if (raw && TECHNOLOGIES.includes(raw as Technology)) {
    return raw as Technology;
  }
  return undefined;
}

export function normalizeWirelessFamily(value: unknown): WirelessFamily | undefined {
  const normalized = asString(value)?.toLowerCase();
  switch (normalized) {
    case "indoor_ptz":
    case "indoor-ptz":
    case "indoor ptz":
      return "indoor_ptz";
    case "indoor_fixed":
    case "indoor-fixed":
    case "indoor fixed":
      return "indoor_fixed";
    case "outdoor_bullet":
    case "outdoor-bullet":
    case "outdoor bullet":
      return "outdoor_bullet";
    case "outdoor_ptz":
    case "outdoor-ptz":
    case "outdoor ptz":
      return "outdoor_ptz";
    case "4g_solar":
    case "4g-solar":
    case "4g solar":
      return "4g_solar";
    default:
      return undefined;
  }
}

function asNonNegativeInteger(value: unknown): number | undefined {
  const number = asNumber(value);
  if (number !== undefined && Number.isInteger(number) && number >= 0) {
    return number;
  }
  return undefined;
}

function asPositiveInteger(value: unknown): number | undefined {
  const number = asNumber(value);
  if (number !== undefined && Number.isInteger(number) && number > 0) {
    return number;
  }
  return undefined;
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map(asString).filter((item): item is string => item !== undefined);
  return values.length > 0 ? values : undefined;
}

function normalizePowerWiringOption(value: unknown): PowerWiringOption | undefined {
  const normalized = asString(value)?.toLowerCase();
  if (
    normalized === "socket_available" ||
    normalized === "wire_needed" ||
    normalized === "site_survey"
  ) {
    return normalized;
  }
  return undefined;
}

function normalizeCameraArray(value: unknown): CanonicalRequirement["cameras"] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((camera) => {
    const technology =
      normalizeTechnologyStrict(firstDefined(camera.technology, camera.tech, camera.type)) ?? "IP";
    const count = asNonNegativeInteger(firstDefined(camera.count, camera.quantity)) ?? 0;
    const brand = asString(firstDefined(camera.brand, camera.camera_brand));
    const model = asString(camera.model);
    const resolution = asString(
      firstDefined(camera.resolution, camera.resolution_tier, camera.megapixel, camera.mp),
    );
    const wirelessFamily = normalizeWirelessFamily(
      firstDefined(camera.wireless_family, camera.family, camera.model_family),
    );
    const requestedFeatures = normalizeStringArray(camera.requested_features);

    return {
      technology,
      count,
      ...(brand ? { brand } : {}),
      ...(model ? { model } : {}),
      ...(resolution ? { resolution } : {}),
      ...(wirelessFamily ? { wireless_family: wirelessFamily } : {}),
      ...(requestedFeatures ? { requested_features: requestedFeatures } : {}),
    };
  });
}

function normalizeLocation(raw: Record<string, unknown>): CanonicalRequirement["location"] {
  const nested = isRecord(raw.location) ? raw.location : {};
  const city = asString(firstDefined(nested.city, raw.city, raw.detected_city));
  const state = asString(firstDefined(nested.state, raw.state, raw.detected_state));
  const pincode = asString(firstDefined(nested.pincode, raw.pincode, raw.lead_pincode));

  if (city === undefined && state === undefined && pincode === undefined) {
    return undefined;
  }

  return {
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    ...(pincode ? { pincode } : {}),
  };
}

function normalizeExistingSystem(
  raw: Record<string, unknown>,
): CanonicalRequirement["existing_system"] {
  const value = isRecord(raw.existing_system) ? raw.existing_system : {};

  const existingSystemKnown = asBoolean(
    firstDefined(value.existing_system_known, value.known, raw.existing_system_known),
  );
  const existingTechnology = normalizeTechnologyStrict(
    firstDefined(value.existing_technology, value.technology, raw.existing_technology),
  );
  const existingRecorderChannels = asNonNegativeInteger(
    firstDefined(
      value.existing_recorder_channels,
      value.recorder_channels,
      value.channel_capacity,
      raw.existing_recorder_channels,
    ),
  );
  const existingWorkingCameras = asNonNegativeInteger(
    firstDefined(
      value.existing_working_cameras,
      value.working_cameras,
      raw.existing_working_cameras,
    ),
  );
  const retainExistingStorage = asBoolean(
    firstDefined(value.retain_existing_storage, value.retain_storage, raw.retain_existing_storage),
  );

  if (
    existingSystemKnown === undefined &&
    existingTechnology === undefined &&
    existingRecorderChannels === undefined &&
    existingWorkingCameras === undefined &&
    retainExistingStorage === undefined
  ) {
    return undefined;
  }

  return {
    ...(existingSystemKnown !== undefined ? { existing_system_known: existingSystemKnown } : {}),
    ...(existingTechnology !== undefined ? { existing_technology: existingTechnology } : {}),
    ...(existingRecorderChannels !== undefined
      ? { existing_recorder_channels: existingRecorderChannels }
      : {}),
    ...(existingWorkingCameras !== undefined
      ? { existing_working_cameras: existingWorkingCameras }
      : {}),
    ...(retainExistingStorage !== undefined
      ? { retain_existing_storage: retainExistingStorage }
      : {}),
  };
}

/** Normalizes raw UI/API/wizard quotation requests into `CanonicalRequirement`. */
export function normalizeRequirement(raw: unknown): NormalizationResult {
  const warnings: NormalizationWarning[] = [];

  if (!isRecord(raw)) {
    throw new Error("normalizeRequirement expects a plain object");
  }

  const recording = isRecord(raw.recording) ? raw.recording : {};
  const cabling = isRecord(raw.cabling) ? raw.cabling : {};
  const wirelessPowerRaw = isRecord(raw.wireless_power) ? raw.wireless_power : {};
  const recorderRaw = isRecord(raw.recorder) ? raw.recorder : {};
  const storageRaw = isRecord(raw.storage) ? raw.storage : {};

  const cameras = normalizeCameraArray(raw.cameras);
  const cameraCount =
    asNonNegativeInteger(firstDefined(raw.camera_count, raw.cameraCount, raw.total_cameras)) ??
    cameras.reduce((total, camera) => total + camera.count, 0);

  const topLevelTechnology = normalizeTechnologyStrict(
    firstDefined(raw.technology, raw.camera_technology),
  );

  const recordingMode = asString(firstDefined(raw.recording_mode, recording.mode));
  const recordingDays = asNonNegativeInteger(firstDefined(raw.recording_days, recording.days));
  const installationType = asString(firstDefined(raw.installation_type, raw.installation));
  const installationPreference = asString(
    firstDefined(raw.installation_preference, raw.installationPreference),
  );

  const wiringType = asString(firstDefined(raw.wiring_type, cabling.wiring_type));
  const cablingMode = asString(firstDefined(raw.cabling_mode, cabling.mode, cabling.cabling_mode));
  const cableType = asString(firstDefined(raw.cable_type, cabling.cable_type));
  const cablingNeededCameras = asNonNegativeInteger(
    firstDefined(raw.cabling_needed_cameras, cabling.cabling_needed_cameras, cabling.needed_cameras),
  );
  const cableLengthMeters = asNumber(
    firstDefined(
      raw.cable_length_meters,
      raw.total_cable_length_meters,
      cabling.cable_length_meters,
      cabling.length_meters,
    ),
  );

  const powerWiringOption = normalizePowerWiringOption(
    firstDefined(
      raw.power_wiring_option,
      wirelessPowerRaw.power_wiring_option,
      wirelessPowerRaw.option,
    ),
  );
  const totalPowerCableMeters = asNumber(
    firstDefined(
      raw.total_power_cable_meters,
      raw.power_cable_meters,
      wirelessPowerRaw.total_power_cable_meters,
      wirelessPowerRaw.cable_length_meters,
    ),
  );

  const recorderBrand = asString(firstDefined(raw.recorder_brand, recorderRaw.brand));
  const recorderTechnology = asString(firstDefined(raw.recorder_technology, recorderRaw.technology));
  const recorderChannels = asPositiveInteger(
    firstDefined(raw.recorder_channels, recorderRaw.channel_capacity, recorderRaw.channels),
  );

  const storageBrand = asString(firstDefined(raw.storage_brand, storageRaw.brand));
  const storageSelected = asBoolean(firstDefined(raw.storage_selected, storageRaw.selected));

  const normalizedInput: Record<string, unknown> = {
    camera_count: cameraCount,
    cameras,
  };

  if (topLevelTechnology !== undefined) normalizedInput.technology = topLevelTechnology;
  if (recordingMode !== undefined) normalizedInput.recording_mode = recordingMode;
  if (recordingDays !== undefined) normalizedInput.recording_days = recordingDays;
  if (installationType !== undefined) normalizedInput.installation_type = installationType;
  if (installationPreference !== undefined) {
    normalizedInput.installation_preference = installationPreference;
  }
  if (wiringType !== undefined) normalizedInput.wiring_type = wiringType;
  if (cablingMode !== undefined) normalizedInput.cabling_mode = cablingMode;
  if (cableType !== undefined) normalizedInput.cable_type = cableType;
  if (cablingNeededCameras !== undefined) {
    normalizedInput.cabling_needed_cameras = cablingNeededCameras;
  }
  if (cableLengthMeters !== undefined) normalizedInput.cable_length_meters = cableLengthMeters;
  if (powerWiringOption !== undefined) normalizedInput.power_wiring_option = powerWiringOption;
  if (totalPowerCableMeters !== undefined) {
    normalizedInput.total_power_cable_meters = totalPowerCableMeters;
  }

  const propertyType = asString(raw.property_type);
  if (propertyType !== undefined) normalizedInput.property_type = propertyType;

  const surfaceTypes = normalizeStringArray(raw.surface_types);
  if (surfaceTypes !== undefined) normalizedInput.surface_types = surfaceTypes;

  const ceilingHeight = asString(
    firstDefined(
      raw.ceiling_height,
      isRecord(raw.site_conditions) ? raw.site_conditions.ceiling_height : undefined,
    ),
  );
  if (ceilingHeight === "standard" || ceilingHeight === "high" || ceilingHeight === "very_high") {
    normalizedInput.ceiling_height = ceilingHeight;
  } else if (ceilingHeight !== undefined) {
    warnings.push({
      code: "INVALID_CEILING_HEIGHT",
      message: `Unsupported ceiling_height "${ceilingHeight}" was ignored.`,
      path: "ceiling_height",
    });
  }

  const wantsRemoteViewing = asBoolean(raw.wants_remote_viewing);
  if (wantsRemoteViewing !== undefined) {
    normalizedInput.wants_remote_viewing = wantsRemoteViewing;
  }

  const wantsAmc = asBoolean(raw.wants_amc);
  if (wantsAmc !== undefined) normalizedInput.wants_amc = wantsAmc;

  const broadbandStatus = asString(raw.broadband_status);
  if (broadbandStatus !== undefined) normalizedInput.broadband_status = broadbandStatus;

  const isHybrid = asBoolean(raw.is_hybrid);
  if (isHybrid !== undefined) normalizedInput.is_hybrid = isHybrid;

  const requestedFeatures = normalizeStringArray(raw.requested_features);
  if (requestedFeatures !== undefined) normalizedInput.requested_features = requestedFeatures;

  const sensorPreference = asString(raw.sensor_preference);
  if (sensorPreference !== undefined) normalizedInput.sensor_preference = sensorPreference;

  const targetStorageTb = asNumber(raw.target_storage_tb);
  if (targetStorageTb !== undefined) normalizedInput.target_storage_tb = targetStorageTb;

  const preferredStorageBrand = asString(raw.preferred_storage_brand);
  if (preferredStorageBrand !== undefined) {
    normalizedInput.preferred_storage_brand = preferredStorageBrand;
  }

  const maxBudget = asNumber(raw.max_budget);
  if (maxBudget !== undefined) normalizedInput.max_budget = maxBudget;

  const referralCode = asString(raw.referral_code);
  if (referralCode !== undefined) normalizedInput.referral_code = referralCode;

  const source = asString(raw.source);
  if (source !== undefined) normalizedInput.source = source;

  if (recorderBrand !== undefined) normalizedInput.recorder_brand = recorderBrand;
  if (recorderTechnology !== undefined) normalizedInput.recorder_technology = recorderTechnology;
  if (recorderChannels !== undefined) normalizedInput.recorder_channels = recorderChannels;

  // Build strict-schema-clean nested recorder rather than copying raw alias keys like `channels`.
  if (isRecord(raw.recorder)) {
    const cleanRecorder: RecorderRequirement = {
      ...(recorderBrand !== undefined ? { brand: recorderBrand } : {}),
      ...(asString(recorderRaw.technology) !== undefined
        ? { technology: asString(recorderRaw.technology) }
        : {}),
      ...(recorderChannels !== undefined ? { channel_capacity: recorderChannels } : {}),
    };
    if (Object.keys(cleanRecorder).length > 0) {
      normalizedInput.recorder = cleanRecorder;
    }
  }

  if (storageBrand !== undefined) normalizedInput.storage_brand = storageBrand;
  if (storageSelected !== undefined) normalizedInput.storage_selected = storageSelected;

  if (isRecord(raw.storage)) {
    const cleanStorage: StorageRequirement = {
      ...(storageBrand !== undefined ? { brand: storageBrand } : {}),
      ...(storageSelected !== undefined ? { selected: storageSelected } : {}),
    };
    if (Object.keys(cleanStorage).length > 0) {
      normalizedInput.storage = cleanStorage;
    }
  }

  if (isRecord(raw.wireless_power)) {
    const nestedOption = normalizePowerWiringOption(
      firstDefined(wirelessPowerRaw.power_wiring_option, wirelessPowerRaw.option),
    );
    const nestedMeters = asNumber(
      firstDefined(wirelessPowerRaw.total_power_cable_meters, wirelessPowerRaw.cable_length_meters),
    );
    const cleanWirelessPower: WirelessPower = {
      ...(nestedOption !== undefined ? { power_wiring_option: nestedOption } : {}),
      ...(nestedMeters !== undefined ? { total_power_cable_meters: nestedMeters } : {}),
    };
    if (Object.keys(cleanWirelessPower).length > 0) {
      normalizedInput.wireless_power = cleanWirelessPower;
    }
  }

  const isEconomyStorage = asBoolean(firstDefined(raw.is_economy_storage, raw.economy_storage));
  if (isEconomyStorage !== undefined) normalizedInput.is_economy_storage = isEconomyStorage;

  const powerSupplyTechnology = asString(
    firstDefined(
      raw.power_supply_technology,
      isRecord(raw.power_supply) ? raw.power_supply.technology : undefined,
    ),
  );
  if (powerSupplyTechnology !== undefined) {
    normalizedInput.power_supply_technology = powerSupplyTechnology;
  }

  const hybridWiredTechnology = normalizeTechnologyStrict(raw.hybrid_wired_technology);
  if (hybridWiredTechnology === "HD" || hybridWiredTechnology === "IP") {
    normalizedInput.hybrid_wired_technology = hybridWiredTechnology;
  }

  const existingSystem = normalizeExistingSystem(raw);
  if (existingSystem !== undefined) normalizedInput.existing_system = existingSystem;

  const activeOffer = raw.active_offer;
  if (isRecord(activeOffer)) {
    const offerType = asString(activeOffer.type);
    const campaignId = asString(activeOffer.campaign_id);
    const offerValue = asNumber(activeOffer.value);
    if ((offerType === "discount_percent" || offerType === "free_amc") && campaignId) {
      normalizedInput.active_offer = {
        type: offerType,
        campaign_id: campaignId,
        ...(offerValue !== undefined ? { value: offerValue } : {}),
      };
    }
  }

  const location = normalizeLocation(raw);
  if (location !== undefined) normalizedInput.location = location;

  const rootCity = asString(firstDefined(raw.city, raw.detected_city));
  const rootState = asString(firstDefined(raw.state, raw.detected_state));
  const rootPincode = asString(firstDefined(raw.pincode, raw.lead_pincode));
  if (rootCity !== undefined) normalizedInput.city = rootCity;
  if (rootState !== undefined) normalizedInput.state = rootState;
  if (rootPincode !== undefined) normalizedInput.pincode = rootPincode;

  const legacyPlanType = asString(firstDefined(raw.plan_type, raw.legacy_plan_type));
  const legacyTier = asString(firstDefined(raw.tier, raw.legacy_tier));
  const legacySelectedPlan = asString(firstDefined(raw.selected_plan, raw.legacy_selected_plan));
  const legacyPlan = asString(firstDefined(raw.plan, raw.legacy_plan));

  let legacyPlanDriftDetected = false;
  if (legacyPlanType !== undefined) {
    normalizedInput.legacy_plan_type = legacyPlanType;
    legacyPlanDriftDetected = true;
  }
  if (legacyTier !== undefined) {
    normalizedInput.legacy_tier = legacyTier;
    legacyPlanDriftDetected = true;
  }
  if (legacySelectedPlan !== undefined) {
    normalizedInput.legacy_selected_plan = legacySelectedPlan;
    legacyPlanDriftDetected = true;
  }
  if (legacyPlan !== undefined) {
    normalizedInput.legacy_plan = legacyPlan;
    legacyPlanDriftDetected = true;
  }

  if (legacyPlanDriftDetected) {
    warnings.push({
      code: "LEGACY_PLAN_DRIFT",
      message:
        "Legacy plan/tier fields were detected. Certification uses technology × resolution × brand instead of legacy business-plan tiers.",
      path: "plan_type|tier|selected_plan|plan",
    });
  }

  const parsed = CanonicalRequirementSchema.safeParse(normalizedInput);
  if (!parsed.success) {
    throw new Error(`Canonical requirement normalization failed: ${parsed.error.message}`);
  }

  return {
    requirement: parsed.data,
    warnings,
  };
}
