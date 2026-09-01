import fs from "fs";

let content = fs.readFileSync("lib/configuration-engine.ts", "utf8");

const oldRecorderLogic = `  // Calculate Recorder Channels (4, 8, 16, 32)
  let recorderChannels: number | undefined = undefined;
  if (wiredCameras > 0) {
    if (wiredCameras <= 4) recorderChannels = 4;
    else if (wiredCameras <= 8) recorderChannels = 8;
    else if (wiredCameras <= 16) recorderChannels = 16;
    else recorderChannels = 32; // Simplified for now
  }`;

const newRecorderLogic = `  // Calculate Recorder Channels (4, 8, 16, 32)
  let recorderChannels: number | undefined = undefined;
  
  // Calculate total ACTIVE cameras (existing + new) for recorder sizing
  let totalActiveCamerasForRecorder = wiredCameras;
  if (req.installation_type === "addon" && req.existing_working_cameras) {
    totalActiveCamerasForRecorder = wiredCameras + req.existing_working_cameras;
  }

  if (wiredCameras > 0) {
    if (req.installation_type === "addon" && req.existing_recorder_channels) {
      if (totalActiveCamerasForRecorder <= req.existing_recorder_channels) {
        // Existing recorder can handle the load, do not quote a new one
        recorderChannels = 0;
      } else {
        // Needs upgrade
        if (totalActiveCamerasForRecorder <= 4) recorderChannels = 4;
        else if (totalActiveCamerasForRecorder <= 8) recorderChannels = 8;
        else if (totalActiveCamerasForRecorder <= 16) recorderChannels = 16;
        else recorderChannels = 32;
      }
    } else {
      if (wiredCameras <= 4) recorderChannels = 4;
      else if (wiredCameras <= 8) recorderChannels = 8;
      else if (wiredCameras <= 16) recorderChannels = 16;
      else recorderChannels = 32; // Simplified for now
    }
  }`;

content = content.replace(oldRecorderLogic, newRecorderLogic);

const oldStorageLogic = `  // Calculate Storage (Simplified assumption: 40GB per camera per day at 1080p H.265)
  // E.g. 2MP ~ 20-30GB/day. 5MP ~ 40-50GB/day. We'll use 40GB average for now.
  let storageGb = 0;
  if (!isLiveOnly) {
    const days = req.recording_days !== undefined ? req.recording_days : 15;
    const gbPerDay = req.recording_mode === "motion" ? 20 : 40;
    storageGb = totalCameras * gbPerDay * days;
  }`;

const newStorageLogic = `  // Calculate Storage (Simplified assumption: 40GB per camera per day at 1080p H.265)
  // E.g. 2MP ~ 20-30GB/day. 5MP ~ 40-50GB/day. We'll use 40GB average for now.
  let storageGb = 0;
  if (!isLiveOnly) {
    if (req.installation_type === "addon" && req.retain_existing_storage) {
       // Customer explicitly wants to keep their existing HDD, do not quote a new one
       storageGb = 0;
    } else {
       const days = req.recording_days !== undefined ? req.recording_days : 15;
       const gbPerDay = req.recording_mode === "motion" ? 20 : 40;
       
       // Note: If they want new storage for an addon system, we must calculate the storage
       // based on the TOTAL active cameras, because all cameras will record to the HDD.
       const camsForStorage = req.installation_type === "addon" && req.existing_working_cameras 
           ? totalCameras + req.existing_working_cameras 
           : totalCameras;
           
       storageGb = camsForStorage * gbPerDay * days;
    }
  }`;

content = content.replace(oldStorageLogic, newStorageLogic);

fs.writeFileSync("lib/configuration-engine.ts", content);
console.log("Updated config engine");
