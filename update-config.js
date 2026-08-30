const fs = require('fs');
let code = fs.readFileSync('lib/configuration-engine.ts', 'utf8');

// 1. Calculate total cameras including indoor/outdoor split
const newCameraLogic = `  // Calculate total cameras
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
  }`;
  
code = code.replace(
  '  // Calculate total cameras\n  let totalCameras = req.camera_count || 0;',
  newCameraLogic
);

// 2. Add Site Preparation Logic
const sitePrepLogic = `
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

  return {`;

code = code.replace('  return {', sitePrepLogic);

// 3. Return object mapping
code = code.replace(
  '    total_cameras: totalCameras,',
  '    total_cameras: totalCameras,\n    indoor_cameras: indoorCameras,\n    outdoor_cameras: outdoorCameras,'
);

code = code.replace(
  '    industrial_threshold_exceeded: isIndustrial',
  '    industrial_threshold_exceeded: isIndustrial,\n    installer_requirements,\n    site_surcharge_flags'
);

fs.writeFileSync('lib/configuration-engine.ts', code);
