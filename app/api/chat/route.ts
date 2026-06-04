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
    const { messages, pageContext } = body;
    const latestMessage = messages[messages.length - 1].content || "";

    // 2. Generate Embedding for Semantic Search (only if there is text)
    let embedding: number[] = [];
    if (latestMessage.trim().length > 0) {
      const embeddingResponse = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: latestMessage,
      });
      embedding = embeddingResponse.embeddings?.[0]?.values || [];
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
Your current security context is: ${securityContext.role}.
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

    let chatResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents,
      config: {
        tools: [{ functionDeclarations: [cashfreeToolDefinition as any, wizardToolDefinition as any, updateQuotationWizardToolDefinition as any] }]
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
      contents.push({
        role: "model",
        parts: [{ functionCall: call }]
      });
      
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
        model: "gemini-2.5-pro",
        contents,
        config: {
          tools: [{ functionDeclarations: [cashfreeToolDefinition as any, wizardToolDefinition as any, updateQuotationWizardToolDefinition as any] }]
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
