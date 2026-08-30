const fs = require('fs');

const wizard = JSON.parse(fs.readFileSync('wizard.json', 'utf8'));

// 1. Update step_cam_count (index 4)
const camCountStepIndex = wizard.steps.findIndex(s => s.id === 'step_cam_count');
wizard.steps[camCountStepIndex].questions = [
  {
    "id": "q_indoor_cam_count",
    "question_text": "How many Indoor cameras (Dome)?",
    "is_required": true,
    "input_type": "number",
    "position": 0,
    "options": []
  },
  {
    "id": "q_outdoor_cam_count",
    "question_text": "How many Outdoor cameras (Bullet)?",
    "is_required": true,
    "input_type": "number",
    "position": 1,
    "options": []
  }
];

// 2. Update step_site_overview (index 9)
const siteOverviewStepIndex = wizard.steps.findIndex(s => s.id === 'step_site_overview');
wizard.steps[siteOverviewStepIndex].questions = [
  {
    "id": "q_height",
    "question_text": "What is the approximate mounting height?",
    "is_required": true,
    "input_type": "single",
    "position": 0,
    "options": [
      { "id": "hopt_std", "label": "Standard (Up to 10ft)", "position": 0, "value": "standard" },
      { "id": "hopt_high", "label": "High (10ft - 15ft)", "position": 1, "value": "high" },
      { "id": "hopt_vhigh", "label": "Very High (15ft+)", "position": 2, "value": "very_high" }
    ]
  },
  {
    "id": "q_ladder",
    "question_text": "Since the mounting height is high, is a tall ladder or scaffolding available on-site?",
    "is_required": false, // Handled conditionally in frontend ideally
    "input_type": "single",
    "position": 1,
    "options": [
      { "id": "lopt_yes", "label": "Yes, I will provide it", "position": 0, "value": "customer_provided" },
      { "id": "lopt_no", "label": "No, Installer needs to bring it", "position": 1, "value": "installer_brings" }
    ]
  },
  {
    "id": "q_surface",
    "question_text": "What kind of surface will the cameras be mounted on?",
    "is_required": true,
    "input_type": "multi",
    "position": 2,
    "options": [
      { "id": "sopt_brick", "label": "Concrete / Brick Wall", "position": 0, "value": "brick" },
      { "id": "sopt_false", "label": "False Ceiling", "position": 1, "value": "false_ceiling" },
      { "id": "sopt_marble", "label": "Marble / Stone", "position": 2, "value": "marble" },
      { "id": "sopt_metal", "label": "Metal / Pole", "position": 3, "value": "metal" }
    ]
  },
  {
    "id": "q_site_condition",
    "question_text": "What is the current condition of the site?",
    "is_required": true,
    "input_type": "single",
    "position": 3,
    "options": [
      { "id": "copt_furn", "label": "Fully Furnished / Occupied", "position": 0, "value": "furnished" },
      { "id": "copt_under", "label": "Under Construction / Bare Shell", "position": 1, "value": "under_construction" }
    ]
  },
  {
    "id": "q_wall_penetration",
    "question_text": "Will the wiring need to pass through multiple thick walls or different floors?",
    "is_required": true,
    "input_type": "single",
    "position": 4,
    "options": [
      { "id": "wopt_easy", "label": "No, mostly same room / easy routing", "position": 0, "value": "easy" },
      { "id": "wopt_thick", "label": "Yes, requires drilling through thick walls/floors", "position": 1, "value": "thick_drilling" }
    ]
  }
];

fs.writeFileSync('wizard.json', JSON.stringify(wizard, null, 2));
