import type { PageTourConfig } from "../tour.types";

export const trackBookingTour: PageTourConfig = {
  pageId: "track-booking",
  autoStart: true,
  steps: [
    {
      id: "track-stage-stepper",
      target: '[data-tour="track-stage-stepper"]',
      title: {
        key: "tour_track_stage_title",
        fallback: "1. Real-Time Order Stepper",
      },
      description: {
        key: "tour_track_stage_desc",
        fallback:
          "Track your job live across 5 milestones: Order Placed → Materials Dispatched → Technician En-Route → Installation in Progress → Tested & Completed.",
      },
      actionPrompt: {
        key: "tour_track_stage_action",
        fallback: "Monitor your installation progress in real-time.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Technician Details",
      },
    },
    {
      id: "track-technician-contact",
      target: '[data-tour="track-technician-contact"]',
      title: {
        key: "tour_track_tech_title",
        fallback: "2. Verified Technician Direct Contact",
      },
      description: {
        key: "tour_track_tech_desc",
        fallback:
          "Directly call or WhatsApp your assigned senior CCTV installer. Every technician is police-verified, background-checked, and equipped with testing monitors.",
      },
      actionPrompt: {
        key: "tour_track_tech_action",
        fallback: "Tap to connect with your installer.",
      },
      nextLabel: {
        key: "tour_common_next",
        fallback: "Next: Completion OTP",
      },
      optional: true,
    },
    {
      id: "track-otp-signoff",
      target: '[data-tour="track-otp-signoff"]',
      title: {
        key: "tour_track_otp_title",
        fallback: "3. Safe Completion Signoff (OTP)",
      },
      description: {
        key: "tour_track_otp_desc",
        fallback:
          "For your security, a job is only marked completed after you verify live mobile phone viewing, camera angles, and share the 4-digit completion OTP with the technician.",
      },
      actionPrompt: {
        key: "tour_track_otp_action",
        fallback: "Share OTP only after full testing and satisfaction.",
      },
      nextLabel: {
        key: "tour_common_done",
        fallback: "Got It",
      },
      optional: true,
    },
  ],
};
