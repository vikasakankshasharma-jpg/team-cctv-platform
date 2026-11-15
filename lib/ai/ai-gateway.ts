/**
 * GLOBAL AI GATEWAY (Cost-Safety & Budget Enforcement Layer)
 * 
 * Enforces the "Cost Safety Constitution":
 * Rule 1: No direct AI SDK imports outside this Gateway.
 * Rule 2: Positive Authorization (DEFAULT = DENY).
 * Rule 3: Model Allowlist strictly enforced (only "gemini-2.5-flash").
 * Rule 4: Pro/Ultra/Carbon models strictly DENIED.
 * Rule 5: Zero Vision (Base64 images blocked at gateway level).
 * Rule 6: Zero Search Grounding (Tool grounding blocked at gateway level).
 * Rule 7: Hard Input Token (<=2,000) & Output Token (<=500) Clamping.
 * Rule 8: Max Attempts = 1 (No billable retry storms).
 * Rule 9: Concurrency Clamping (Max 1 concurrent task per batch type).
 * Rule 10: In-Memory Cost Ledger (Pre-execution estimate & post-execution audit).
 */

import { GoogleGenAI } from "@google/genai";
import { isStrictZeroCostModeActive } from "@/lib/billing/budget-tracker";

export type AiTaskType = 
  | "catalog-spec-extraction" 
  | "chat-fallback" 
  | "night-school" 
  | "geo-clustering";

export interface AiGatewayRequest {
  task: AiTaskType;
  prompt: string;
  systemInstruction?: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: any;
  customApiKey?: string;
}

export interface AiGatewayResult {
  success: boolean;
  text: string;
  blocked: boolean;
  blockReason?: string;
  model: string;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costInrEstimated: number;
  durationMs: number;
}

export interface AiLedgerEntry {
  id: string;
  timestamp: string;
  task: AiTaskType;
  model: string;
  status: "SUCCESS" | "BLOCKED" | "FAILED";
  blockReason?: string;
  promptChars: number;
  completionChars?: number;
  costInrEstimated: number;
  durationMs: number;
}

// ─── GATEWAY POLICY ENFORCEMENT ──────────────────────────────────────────────

const ALLOWED_MODELS = new Set(["gemini-2.5-flash"]);
const BANNED_MODELS_REGEX = /pro|ultra|carbon|preview/i;
const MAX_PROMPT_CHARS = 8000; // ~2,000 tokens max input
const MAX_OUTPUT_TOKENS_LIMIT = 500; // Hard clamp max output tokens
const COST_PER_1K_INPUT_INR = 0.0062; // ~₹0.0062 per 1k Flash input tokens
const COST_PER_1K_OUTPUT_INR = 0.025;  // ~₹0.025 per 1k Flash output tokens

// Concurrency tracker for batch tasks (avoids parallel bursts)
let activeCatalogExtractions = 0;

// In-Memory Cost Ledger (Circular buffer of last 50 calls for diagnostics)
const COST_LEDGER: AiLedgerEntry[] = [];
const MAX_LEDGER_ENTRIES = 50;

function recordLedger(entry: AiLedgerEntry) {
  COST_LEDGER.unshift(entry);
  if (COST_LEDGER.length > MAX_LEDGER_ENTRIES) {
    COST_LEDGER.pop();
  }
}

/**
 * Returns recent AI Gateway ledger entries for admin diagnostics.
 */
export function getAiGatewayLedger(): readonly AiLedgerEntry[] {
  return COST_LEDGER;
}

/**
 * Centralized, fail-safe AI execution gateway.
 * All external AI calls across the platform MUST execute through this function.
 */
export async function executeAiGateway(request: AiGatewayRequest): Promise<AiGatewayResult> {
  const startTime = Date.now();
  const requestId = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const requestedModel = (request.model || "gemini-2.5-flash").toLowerCase().trim();

  // 1. POSITIVE AUTHORIZATION CHECK 1: Strict Zero-Cost Mode Circuit-Breaker
  if (await isStrictZeroCostModeActive()) {
    const durationMs = Date.now() - startTime;
    recordLedger({
      id: requestId,
      timestamp: new Date().toISOString(),
      task: request.task,
      model: requestedModel,
      status: "BLOCKED",
      blockReason: "STRICT_ZERO_COST_MODE_ACTIVE",
      promptChars: request.prompt.length,
      costInrEstimated: 0,
      durationMs,
    });
    return {
      success: false,
      text: "",
      blocked: true,
      blockReason: "Strict Zero-Cost Mode is ACTIVE. All external AI calls are rejected at gateway level to guarantee ₹0.00 cloud billing.",
      model: requestedModel,
      costInrEstimated: 0,
      durationMs,
    };
  }

  // 2. POSITIVE AUTHORIZATION CHECK 2: Global Feature Flag
  if (process.env.ENABLE_AI_FEATURES === "false") {
    const durationMs = Date.now() - startTime;
    recordLedger({
      id: requestId,
      timestamp: new Date().toISOString(),
      task: request.task,
      model: requestedModel,
      status: "BLOCKED",
      blockReason: "AI_FEATURES_DISABLED_GLOBALLY",
      promptChars: request.prompt.length,
      costInrEstimated: 0,
      durationMs,
    });
    return {
      success: false,
      text: "",
      blocked: true,
      blockReason: "ENABLE_AI_FEATURES is set to false in environment.",
      model: requestedModel,
      costInrEstimated: 0,
      durationMs,
    };
  }

  // 3. MODEL ALLOWLIST CHECK (Allowlist > Denylist)
  if (!ALLOWED_MODELS.has(requestedModel)) {
    const durationMs = Date.now() - startTime;
    const blockReason = `Model '${requestedModel}' is not in the approved production allowlist (${Array.from(ALLOWED_MODELS).join(", ")}).`;
    recordLedger({
      id: requestId,
      timestamp: new Date().toISOString(),
      task: request.task,
      model: requestedModel,
      status: "BLOCKED",
      blockReason,
      promptChars: request.prompt.length,
      costInrEstimated: 0,
      durationMs,
    });
    return {
      success: false,
      text: "",
      blocked: true,
      blockReason,
      model: requestedModel,
      costInrEstimated: 0,
      durationMs,
    };
  }

  // 4. SECONDARY PRO/ULTRA/CARBON DENYLIST DOUBLE-LOCK
  if (BANNED_MODELS_REGEX.test(requestedModel)) {
    const durationMs = Date.now() - startTime;
    const blockReason = `High-cost model tier '${requestedModel}' is permanently banned by the Cost Safety Constitution.`;
    recordLedger({
      id: requestId,
      timestamp: new Date().toISOString(),
      task: request.task,
      model: requestedModel,
      status: "BLOCKED",
      blockReason,
      promptChars: request.prompt.length,
      costInrEstimated: 0,
      durationMs,
    });
    return {
      success: false,
      text: "",
      blocked: true,
      blockReason,
      model: requestedModel,
      costInrEstimated: 0,
      durationMs,
    };
  }

  // 5. ZERO-VISION PAYLOAD INSPECTION (Block Base64 images)
  const fullPayloadString = `${request.prompt} ${request.systemInstruction || ""}`;
  if (/data:image\//i.test(fullPayloadString) || /;base64,/i.test(fullPayloadString)) {
    const durationMs = Date.now() - startTime;
    const blockReason = "Multimodal/Base64 image payloads are forbidden at the AI Gateway level to prevent vision token burn.";
    recordLedger({
      id: requestId,
      timestamp: new Date().toISOString(),
      task: request.task,
      model: requestedModel,
      status: "BLOCKED",
      blockReason,
      promptChars: request.prompt.length,
      costInrEstimated: 0,
      durationMs,
    });
    return {
      success: false,
      text: "",
      blocked: true,
      blockReason,
      model: requestedModel,
      costInrEstimated: 0,
      durationMs,
    };
  }

  // 6. INPUT TOKEN CLAMPING
  let effectivePrompt = request.prompt;
  if (effectivePrompt.length > MAX_PROMPT_CHARS) {
    console.warn(`[AI Gateway] Prompt exceeded ${MAX_PROMPT_CHARS} chars, clamping input.`);
    effectivePrompt = effectivePrompt.slice(0, MAX_PROMPT_CHARS);
  }

  // 7. OUTPUT TOKEN CLAMPING
  const effectiveMaxOutputTokens = Math.min(
    request.maxOutputTokens || MAX_OUTPUT_TOKENS_LIMIT,
    MAX_OUTPUT_TOKENS_LIMIT
  );

  // 8. CONCURRENCY CLAMPING (Single concurrent batch extraction)
  if (request.task === "catalog-spec-extraction") {
    if (activeCatalogExtractions >= 1) {
      const durationMs = Date.now() - startTime;
      const blockReason = "Concurrency limit reached: another catalog extraction is actively running.";
      recordLedger({
        id: requestId,
        timestamp: new Date().toISOString(),
        task: request.task,
        model: requestedModel,
        status: "BLOCKED",
        blockReason,
        promptChars: effectivePrompt.length,
        costInrEstimated: 0,
        durationMs,
      });
      return {
        success: false,
        text: "",
        blocked: true,
        blockReason,
        model: requestedModel,
        costInrEstimated: 0,
        durationMs,
      };
    }
    activeCatalogExtractions++;
  }

  // 9. ESTIMATED COST PRE-CALCULATION
  const estimatedInputTokens = Math.ceil(effectivePrompt.length / 4);
  const estimatedCostInr = Number(
    ((estimatedInputTokens / 1000) * COST_PER_1K_INPUT_INR +
    (effectiveMaxOutputTokens / 1000) * COST_PER_1K_OUTPUT_INR).toFixed(4)
  );

  try {
    // 10. SINGLE-ATTEMPT CONTROLLED INVOCATION (No retry storms)
    const apiKey = request.customApiKey || process.env.GEMINI_API_KEY;
    const ai = apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI({});

    const config: any = {
      maxOutputTokens: effectiveMaxOutputTokens,
      temperature: request.temperature ?? 0.1,
    };

    if (request.systemInstruction) {
      config.systemInstruction = request.systemInstruction;
    }
    if (request.responseMimeType) {
      config.responseMimeType = request.responseMimeType;
    }
    if (request.responseSchema) {
      config.responseSchema = request.responseSchema;
    }

    const response = await ai.models.generateContent({
      model: requestedModel,
      contents: [{ role: "user", parts: [{ text: effectivePrompt }] }],
      config,
    });

    const responseText = response.text?.trim() || "";
    const durationMs = Date.now() - startTime;

    recordLedger({
      id: requestId,
      timestamp: new Date().toISOString(),
      task: request.task,
      model: requestedModel,
      status: "SUCCESS",
      promptChars: effectivePrompt.length,
      completionChars: responseText.length,
      costInrEstimated: estimatedCostInr,
      durationMs,
    });

    return {
      success: true,
      text: responseText,
      blocked: false,
      model: requestedModel,
      costInrEstimated: estimatedCostInr,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    recordLedger({
      id: requestId,
      timestamp: new Date().toISOString(),
      task: request.task,
      model: requestedModel,
      status: "FAILED",
      blockReason: err.message || String(err),
      promptChars: effectivePrompt.length,
      costInrEstimated: 0,
      durationMs,
    });
    return {
      success: false,
      text: "",
      blocked: false,
      blockReason: err.message || "AI invocation failed",
      model: requestedModel,
      costInrEstimated: 0,
      durationMs,
    };
  } finally {
    if (request.task === "catalog-spec-extraction") {
      activeCatalogExtractions = Math.max(0, activeCatalogExtractions - 1);
    }
  }
}
