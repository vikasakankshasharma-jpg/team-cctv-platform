import { JWT } from "google-auth-library";

export interface VertexSearchResult {
  success: boolean;
  answer?: string;
  attributionToken?: string;
  results?: any[];
  error?: string;
}

let cachedClient: JWT | null = null;

function getAuthClient(): JWT | null {
  if (cachedClient) return cachedClient;

  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    return null;
  }

  cachedClient = new JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  return cachedClient;
}

/**
 * Queries Vertex AI Search Data Store (GenAI App Builder)
 * Consumes the ₹91,785.01 promotional trial credit pool.
 */
export async function queryVertexAiSearch(query: string): Promise<VertexSearchResult> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const dataStoreId = process.env.VERTEX_SEARCH_DATASTORE_ID || "team-cctv-knowledge";

  if (!projectId || !dataStoreId) {
    return { success: false, error: "Missing project ID or data store ID" };
  }

  const client = getAuthClient();
  if (!client) {
    return { success: false, error: "Missing server service account credentials" };
  }

  try {
    const tokenResp = await client.getAccessToken();
    if (!tokenResp.token) {
      return { success: false, error: "Failed to acquire Google Cloud access token" };
    }

    const url = `https://discoveryengine.googleapis.com/v1/projects/${projectId}/locations/global/collections/default_collection/dataStores/${dataStoreId}/servingConfigs/default_search:search`;

    const requestBody = {
      query,
      pageSize: 3,
      queryExpansionSpec: { condition: "AUTO" },
      spellCorrectionSpec: { mode: "AUTO" },
      contentSearchSpec: {
        summarySpec: {
          summaryResultCount: 3,
          includeCitations: true,
        },
        extractiveContentSpec: {
          maxExtractedAnswerCount: 1,
        },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenResp.token}`,
        "Content-Type": "application/json",
        "X-Goog-User-Project": projectId,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Vertex AI Search request failed (${res.status}):`, errText);
      return { success: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const summaryText = data.summary?.summaryText;
    const extractedAnswer = data.results?.[0]?.document?.derivedStructData?.extractive_answers?.[0]?.content;
    const answer = summaryText || extractedAnswer || null;

    return {
      success: true,
      answer: answer || undefined,
      attributionToken: data.attributionToken,
      results: data.results || [],
    };
  } catch (error: any) {
    console.error("Vertex AI Search execution error:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
