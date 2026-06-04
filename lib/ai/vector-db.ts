import { adminDb } from "../firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export interface BrainEntry {
  id?: string;
  question: string;
  answer: string;
  embedding: number[];
  approvedByAdmin: boolean;
  userRating?: 1 | -1 | 0; // 1 = Thumbs Up, -1 = Thumbs Down
  autoCorrected?: boolean;
  confidenceScore?: number;
  createdAt: FirebaseFirestore.Timestamp;
}

/**
 * Searches the 'brain' collection for a similar question using Firebase Vector Search.
 * Note: Requires Firestore database to have vector indexes enabled for 'embedding' field.
 */
export async function searchBrain(queryEmbedding: number[], limit: number = 3): Promise<BrainEntry[]> {
  try {
    // Firestore vector search (requires recent firebase-admin SDK and vector indexes)
    const brainRef = adminDb.collection('ai_brain');
    
    // Fallback/Placeholder if vector search isn't fully enabled in this project tier yet:
    // This is the structure for the exact query once vector indexes are active:
    // const snapshot = await brainRef.findNearest('embedding', FieldValue.vector(queryEmbedding), {
    //   limit,
    //   distanceMeasure: 'COSINE'
    // }).where('approvedByAdmin', '==', true).get();

    // Since findNearest is a newer API, we'll return an empty array if it fails,
    // which gracefully routes the request to the Master AI.
    
    // For now, we simulate returning empty to force Master AI usage until data is seeded.
    return [];
  } catch (error) {
    console.error("Vector Search failed (indexes might not be set up):", error);
    return [];
  }
}

/**
 * Saves a new Q&A pair to the Brain for Admin review.
 * Returns the document ID so the frontend can attach feedback to it.
 */
export async function saveToBrain(question: string, answer: string, embedding: number[]): Promise<string> {
  const brainRef = adminDb.collection('ai_brain');
  
  const docRef = await brainRef.add({
    question,
    answer,
    embedding: FieldValue.vector(embedding),
    approvedByAdmin: false, // Must be reviewed by admin or auto-corrected
    userRating: 0,
    autoCorrected: false,
    createdAt: FieldValue.serverTimestamp()
  });
  
  return docRef.id;
}

/**
 * Approves a generated answer in the Brain, allowing the Student AI to use it.
 */
export async function approveBrainEntry(id: string, updatedAnswer?: string) {
  const entryRef = adminDb.collection('ai_brain').doc(id);
  
  const updateData: any = {
    approvedByAdmin: true
  };
  
  if (updatedAnswer) {
    updateData.answer = updatedAnswer;
  }
  
  await entryRef.update(updateData);
}

/**
 * Updates the user rating for a specific interaction.
 */
export async function updateBrainRating(id: string, rating: 1 | -1) {
  const entryRef = adminDb.collection('ai_brain').doc(id);
  await entryRef.update({
    userRating: rating
  });
}

/**
 * Automatically corrects an entry based on Master AI reflection.
 */
export async function autoCorrectBrainEntry(id: string, correctedAnswer: string) {
  const entryRef = adminDb.collection('ai_brain').doc(id);
  await entryRef.update({
    answer: correctedAnswer,
    autoCorrected: true,
    approvedByAdmin: true, // Auto-correction essentially approves it for Student AI usage
    userRating: 0 // Reset rating after correction
  });
}
