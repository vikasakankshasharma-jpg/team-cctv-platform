import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Content } from "@google/genai";
import { getAISecurityContext } from "@/lib/ai/security";
import { searchBrain, saveToBrain } from "@/lib/ai/vector-db";
import { cashfreeToolDefinition, executeCashfreePayoutStatus } from "@/lib/ai/tools/cashfree";
import { wizardToolDefinition, executeQuotationWizardStatus, updateQuotationWizardToolDefinition, executeUpdateQuotationWizard } from "@/lib/ai/tools/wizard";

// Initialize Gemini SDK
// Requires GEMINI_API_KEY in .env
const ai = new GoogleGenAI({});

export async function POST(req: NextRequest) {
  try {
    // 1. Security Check: Who is asking?
    const securityContext = await getAISecurityContext();
    
    const body = await req.json();
    const { messages, pageContext, locale } = body;
    const latestMessage = messages[messages.length - 1].content || "";

    // 2. Generate Embedding for Semantic Search (only if there is text)
    let embedding: number[] = [];
    if (latestMessage.trim().length > 0) {
      const embeddingResponse = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: latestMessage,
      });
      embedding = embeddingResponse.embeddings?.[0]?.values || [];
      if (embedding.length > 2048) {
        console.warn(`Embedding length ${embedding.length} exceeds Firestore 2048 limit. Truncating to 2048 for storage.`);
        embedding = embedding.slice(0, 2048);
      }
    }

    if (embedding.length > 0) {
      // 3. Search the "Brain" for cached/learned answers (The Student AI)
      const brainResults = await searchBrain(embedding, 1);
      
      // If we found a highly relevant, admin-approved answer
      if (brainResults.length > 0) {
        return NextResponse.json({
          role: "assistant",
          content: brainResults[0].answer,
          isFromStudent: true,
          brainId: brainResults[0].id
        });
      }
    }

    // 4. If no cached answer, Route to Master AI (Gemini Pro)
    const systemPrompt = `You are the AI assistant for this website.
The user is currently viewing the following page/URL: ${pageContext || 'unknown'}. Use this context to provide highly relevant answers.
The user's preferred language locale code is: ${locale || 'en'}. You MUST reply in this language. If the locale is 'hi', reply in Hindi. If 'mr', reply in Marathi. If 'gu', reply in Gujarati, etc. Keep the language natural and colloquial to the region.
Your current security context is: ${securityContext.role}.
${securityContext.userId ? `The user's unique ID is: ${securityContext.userId}. Whenever a tool requires a 'userId', use this ID automatically without asking the user for it.` : ''}

CRITICAL INSTRUCTION FOR PRICING & QUOTES:
If the user asks for pricing, cost, discounts, or a custom quote, and your security context is 'UNAUTHENTICATED', you MUST NOT ask them for any details like user ID or email. You MUST IMMEDIATELY reply with exactly this keyword: <REQUIRE_OTP>. Do NOT add any other words. Just <REQUIRE_OTP>.

You are allowed to perform: ${securityContext.allowedActions.join(", ")}.
If the user asks for something outside these actions, refuse gracefully.
Do not leak internal database structures or admin secrets unless the role is ADMIN.`;

    const contents: Content[] = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...messages.map((m: any) => {
        const parts: any[] = [];
        if (m.content) {
          parts.push({ text: m.content });
        }
        
        if (m.image) {
          const match = m.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        }

        return {
          role: m.role === "user" ? "user" : "model",
          parts
        };
      })
    ];

    let availableTools: any[] = [];
    if (securityContext.role === "ADMIN" || securityContext.role === "USER") {
      availableTools = [cashfreeToolDefinition as any, wizardToolDefinition as any, updateQuotationWizardToolDefinition as any];
    }

    let chatResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        tools: availableTools.length > 0 ? [{ functionDeclarations: availableTools }] : []
      }
    });

    // 4b. Handle Function Calling (Advanced RAG)
    if (chatResponse.functionCalls && chatResponse.functionCalls.length > 0) {
      const call = chatResponse.functionCalls[0];
      let functionResponse: any = {};

      if (call.name === "getCashfreePayoutStatus") {
        const transferId = (call.args as any).transferId;
        functionResponse = await executeCashfreePayoutStatus(transferId, securityContext.role);
      } else if (call.name === "getQuotationWizardStatus") {
        const userId = (call.args as any).userId;
        functionResponse = await executeQuotationWizardStatus(userId, securityContext.role);
      } else if (call.name === "updateQuotationWizard") {
        const userId = (call.args as any).userId;
        const addCameras = (call.args as any).addCameras;
        functionResponse = await executeUpdateQuotationWizard(userId, addCameras, securityContext.role);
      }

      // Append the function call and response to the conversation history
      if (chatResponse.candidates && chatResponse.candidates.length > 0 && chatResponse.candidates[0].content) {
        contents.push(chatResponse.candidates[0].content as Content);
      } else {
        contents.push({
          role: "model",
          parts: [{ functionCall: call }]
        });
      }
      
      contents.push({
        role: "user", 
        parts: [{
          functionResponse: {
            name: call.name,
            response: functionResponse
          }
        }]
      });

      chatResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          tools: availableTools.length > 0 ? [{ functionDeclarations: availableTools }] : []
        }
      });
    }

    const answer = chatResponse.text || "I am unable to process that right now.";

    // 5. Save the new Master AI answer to the Brain for Admin Review
    let savedBrainId = null;
    if (embedding.length > 0 && securityContext.role !== "ADMIN") {
      // We don't necessarily cache admin queries, as they might contain sensitive specifics.
      savedBrainId = await saveToBrain(latestMessage, answer, embedding);
    }

    return NextResponse.json({
      role: "assistant",
      content: answer,
      isFromStudent: false,
      brainId: savedBrainId
    });

  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
