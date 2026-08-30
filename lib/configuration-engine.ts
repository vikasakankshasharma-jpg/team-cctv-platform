import { CCTVRequirement, CCTVConfiguration } from "@/types";

export function generateConfiguration(req: CCTVRequirement): CCTVConfiguration {
  const isLiveOnly = req.recording_mode === "live_only" || req.recording_days === 0;
  
  // Calculate total cameras
  let totalCameras = req.camera_count || 0;
  let indoorCameras = req.indoor_camera_count || 0;
  let outdoorCameras = req.outdoor_camera_count || 0;
  
  // If explicitly provided via indoor/outdoor split
  if (indoorCameras > 0 || outdoorCameras > 0) {
    totalCameras = indoorCameras + outdoorCameras;
  } else if (totalCameras > 0) {
    // Fallback: If only total was provided (old wizard), assume all indoor for safety
    indoorCameras = totalCameras;
    outdoorCameras = 0;
  }
  
  // If specific mixed requirements are provided, sum them up
  if (req.mixed_camera_requirements && req.mixed_camera_requirements.length > 0) {
    totalCameras = req.mixed_camera_requirements.reduce((sum: number, r: any) => sum + r.count, 0);
  }

  // Determine Wireless vs Wired
  const techLower = (req.technology_preference || "").toLowerCase();
  const isWireless = techLower.includes("wifi") || techLower.includes("wireless") || techLower.includes("4g");
  
  let wiredCameras = totalCameras;
  let wirelessCameras = 0;

  if (isWireless) {
    wirelessCameras = totalCameras;
    wiredCameras = 0;
  } else if (req.mixed_camera_requirements) {
    wiredCameras = 0;
    wirelessCameras = 0;
    req.mixed_camera_requirements.forEach((r: any) => {
      const rtLower = r.type.toLowerCase();
      const isRWireless = rtLower.includes("wifi") || rtLower.includes("wireless") || rtLower.includes("4g") || rtLower.includes("solar");
      if (isRWireless) {
        wirelessCameras += r.count;
      } else {
        wiredCameras += r.count;
      }
    });
  }

  // Calculate Recorder Channels (4, 8, 16, 32)
  let recorderChannels: number | undefined = undefined;
  if (wiredCameras > 0) {
    if (wiredCameras <= 4) recorderChannels = 4;
    else if (wiredCameras <= 8) recorderChannels = 8;
    else if (wiredCameras <= 16) recorderChannels = 16;
    else recorderChannels = 32; // Simplified for now
  }

  // Calculate Storage (Simplified assumption: 40GB per camera per day at 1080p H.265)
  // E.g. 2MP ~ 20-30GB/day. 5MP ~ 40-50GB/day. We'll use 40GB average for now.
  let storageGb = 0;
  if (!isLiveOnly) {
    storageGb = totalCameras * 40 * (req.recording_days || 15);
  }

  // Calculate Power (Watts) (Assume 6W per wired camera + 20W for recorder)
  let powerWattage = 0;
  if (wiredCameras > 0) {
    powerWattage = (wiredCameras * 6) + 20;
  }

  // Calculate Cable
  let cableMeters = 0;
  if (wiredCameras > 0) {
    // Default 20m per wired camera, unless user specified length
    cableMeters = req.cable_length_meters ? req.cable_length_meters * wiredCameras : 20 * wiredCameras;
  }

  // Calculate Connectors (RJ45 or BNC)
  let connectorsCount = 0;
  const connectorType = req.technology_preference === "IP" || req.cable_type === "cat6" ? "RJ45" : "BNC";
  if (wiredCameras > 0) {
    // 2 connectors per camera (one at camera, one at recorder/switch)
    connectorsCount = wiredCameras * 2;
  }

  const requiresSimRouter = req.wants_remote_viewing && req.broadband_status === "sim_router";
  
  // Industrial Check (e.g. > 16 cameras)
  const isIndustrial = totalCameras > 16;


  // --- Site Preparation & Logistics ---
  const installer_requirements: string[] = [];
  const site_surcharge_flags = {
    requiresLadderFee: false,
    requiresMarbleSurcharge: false,
    requiresMetalSurcharge: false,
    requiresFurnishedSurcharge: false,
    requiresHeavyDrillingSurcharge: false,
  };

  if (req.mounting_height === 'high' || req.mounting_height === 'very_high') {
    if (req.ladder_available === 'installer_brings') {
      site_surcharge_flags.requiresLadderFee = true;
      installer_requirements.push(req.mounting_height === 'very_high' ? '20ft Ladder / Scaffolding' : '15ft Ladder');
    }
  }

  if (req.surface_types?.includes('marble')) {
    site_surcharge_flags.requiresMarbleSurcharge = true;
    installer_requirements.push('Diamond core drill bits (Marble/Stone)');
  }
  if (req.surface_types?.includes('metal')) {
    site_surcharge_flags.requiresMetalSurcharge = true;
    installer_requirements.push('Metal drill bits & self-tapping screws');
  }

  if (req.site_condition === 'furnished') {
    site_surcharge_flags.requiresFurnishedSurcharge = true;
    installer_requirements.push('Drop cloths, dust-covers, and vacuum for clean drilling');
  }

  if (req.wall_penetration === 'thick_drilling') {
    site_surcharge_flags.requiresHeavyDrillingSurcharge = true;
    installer_requirements.push('Heavy duty hammer drill & 1.5ft+ long masonry bits');
  }

  // --- End Site Preparation ---

  return {
    technology: req.technology_preference,
    technologies: req.technology_preference ? [req.technology_preference] : [],
    total_cameras: totalCameras,
    indoor_cameras: indoorCameras,
    outdoor_cameras: outdoorCameras,
    wired_cameras: wiredCameras,
    wireless_cameras: wirelessCameras,
    recorder_channels: recorderChannels || 0,
    storage_gb: storageGb,
    storage_tb: Math.ceil(storageGb / 1000),
    power_wattage_w: powerWattage,
    power_supply_count: wiredCameras > 0 ? 1 : 0,
    cable_meters: cableMeters,
    connectors_count: connectorsCount,
    connector_type: connectorType,
    requires_sim_router: requiresSimRouter,
    industrial_threshold_exceeded: isIndustrial,
    installer_requirements,
    site_surcharge_flags
  } as CCTVConfiguration;
}


