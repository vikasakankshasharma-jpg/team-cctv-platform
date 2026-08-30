require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

async function updateWizard() {
  const stepRef = db.collection('wizard_steps').doc('step_storage');
  const doc = await stepRef.get();
  if (doc.exists) {
    const data = doc.data();
    const questions = data.questions || [];
    const hasMode = questions.some(q => q.id === 'q_recording_mode');
    if (!hasMode) {
      questions.push({
        id: "q_recording_mode",
        question_text: "Recording Mode Preference:",
        input_type: "single",
        is_required: false,
        position: 1,
        options: [
          {
            id: "opt_rec_continuous",
            label: "24×7 Continuous (Non-stop Recording · Banks, Retail Shops, Cash Counters)",
            value: "continuous",
            position: 0,
            badge: "Full Backup"
          },
          {
            id: "opt_rec_motion",
            label: "Smart Motion Detection (Records only movement · Saves ~45% Disk Space & Cost)",
            value: "motion",
            position: 1,
            badge: "Best Value"
          }
        ]
      });
      await stepRef.update({ questions });
      console.log('? Added q_recording_mode to step_storage in Firestore!');
    } else {
      console.log('?? q_recording_mode already exists in step_storage');
    }
  } else {
    console.log('?? step_storage doc not found');
  }
}

updateWizard().catch(console.error);
