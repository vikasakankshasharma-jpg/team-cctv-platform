// components/tour/tours/installer-job-tour.ts

import type { PageTourConfig } from "../tour.types";

export const installerJobTour: PageTourConfig = {
  pageId: "installer-job",
  autoStart: true,

  steps: [
    {
      id: "job-status",
      target: '[data-tour="job-status"]',

      title: {
        key: "tour.installerJob.status.title",
        fallback: "Job & Site Overview",
      },

      description: {
        key: "tour.installerJob.status.description",
        fallback:
          "Yahan customer details, property address, aur job status check karein. Kaam start karne se pehle customer details aur dispatch notes verify karein.",
      },

      actionPrompt: {
        key: "tour.installerJob.status.action",
        fallback:
          "Customer location aur property requirements check karein.",
      },

      nextLabel: {
        key: "tour.common.tryIt",
        fallback: "Try It",
      },
    },

    {
      id: "job-device-scan",
      target: '[data-tour="job-device-scan"]',

      title: {
        key: "tour.installerJob.deviceScan.title",
        fallback: "Scan Every Camera",
      },

      description: {
        key: "tour.installerJob.deviceScan.description",
        fallback:
          "Har installed camera ka serial number aur MAC address barcode scanner se capture karein. Isse hardware ka exact installation record maintain hota hai.",
      },

      actionPrompt: {
        key: "tour.installerJob.deviceScan.action",
        fallback:
          "Tour complete hone ke baad Scan Barcode button tap karke camera label scan karein.",
      },

      nextLabel: {
        key: "tour.common.tryIt",
        fallback: "Try It",
      },
    },

    {
      id: "job-installation-photos",
      target: '[data-tour="job-installation-photos"]',

      title: {
        key: "tour.installerJob.photos.title",
        fallback: "Take Installation Photos",
      },

      description: {
        key: "tour.installerJob.photos.description",
        fallback:
          "Installation ke important proof photos upload karein—camera ka Bullet angle, DVR/NVR rack aur power supply. Ye photos installation quality aur future warranty activation ke kaam aate hain.",
      },

      actionPrompt: {
        key: "tour.installerJob.photos.action",
        fallback:
          "Clear photos upload karein jisme camera angle aur wiring placement clearly dikhe.",
      },

      nextLabel: {
        key: "tour.common.tryIt",
        fallback: "Try It",
      },
    },

    {
      id: "job-completion-pin",
      target: '[data-tour="job-completion-pin"]',

      title: {
        key: "tour.installerJob.completionPin.title",
        fallback: "Customer Completion PIN",
      },

      description: {
        key: "tour.installerJob.completionPin.description",
        fallback:
          "Final handoff aur live camera display test karne ke baad hi customer se 4-digit Secret Completion PIN lekar job sign-off complete karein.",
      },

      actionPrompt: {
        key: "tour.installerJob.completionPin.action",
        fallback:
          "Customer ko live display dikhaane ke baad Request Signoff par tap karein.",
      },

      nextLabel: {
        key: "tour.common.done",
        fallback: "Done",
      },
    },
  ],
};
