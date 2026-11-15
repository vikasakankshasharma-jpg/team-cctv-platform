import { NextRequest, NextResponse } from "next/server";
import { getAISecurityContext } from "@/lib/ai/security";
import { searchBrain, saveToBrain } from "@/lib/ai/vector-db";
import { queryLocalBrain } from "@/lib/ai/local-brain";
import { getCostBudgetSettings, recordServiceUsage } from "@/lib/billing/budget-tracker";
import { wizardToolDefinition, executeQuotationWizardStatus, updateQuotationWizardToolDefinition, executeUpdateQuotationWizard } from "@/lib/ai/tools/wizard";
import { getChatApiStrings, localizeChatQuickActions } from "@/lib/ai/chat-i18n";
import { executeAiGateway, executeAiEmbedding } from "@/lib/ai/ai-gateway";

export async function POST(req: NextRequest) {
  try {
    // 1. Security Check: Who is asking?
    const securityContext = await getAISecurityContext();
    
    const body = await req.json();
    const { messages, pageContext, locale } = body;
    const chatUi = getChatApiStrings(locale);
    const isNonEnglish = Boolean(locale && locale !== "en");
    const latestMessage = messages[messages.length - 1].content || "";

    // 2. Query Local Autonomous Brain First (100% Free, Zero Google Calls)
    const localMatch = await queryLocalBrain(latestMessage, locale);
    if (localMatch.matched && localMatch.answer) {
      const answerContent = isNonEnglish
        ? `${localMatch.answer}\n\n_${chatUi.localNoteFooter}_`
        : localMatch.answer;
      return NextResponse.json({
        role: "assistant",
        content: answerContent,
        isFromStudent: true,
        source: localMatch.source,
        quickActions: localizeChatQuickActions(localMatch.quickActions, locale),
      });
    }

    // 3. Check Budget & Strict Zero-Cost Mode Guard
    const budgetSettings = await getCostBudgetSettings();
    if (budgetSettings.strict_zero_cost_mode) {
      // In Strict Zero-Cost Mode, external paid APIs are completely blocked
      return NextResponse.json({
        role: "assistant",
        content: chatUi.zeroCostReply,
        isFromStudent: true,
        quickActions: [
          { label: chatUi.qaWhatsapp, action: "whatsapp" },
          { label: chatUi.qaBookSurvey, action: "survey" },
        ],
      });
    }

    // 4. Try Vertex AI Search Data Store (Consumes ₹91,785.01 GenAI App Builder Credit)
    if (process.env.VERTEX_SEARCH_DATASTORE_ID) {
      try {
        const { queryVertexAiSearch } = await import("@/lib/ai/vertex-search");
        const vertexRes = await queryVertexAiSearch(latestMessage);
        if (vertexRes.success && vertexRes.answer) {
          // Record usage against the credit pool
          return NextResponse.json({
            role: "assistant",
            content: vertexRes.answer,
            isFromStudent: false,
            source: "Vertex AI Search (Grounded Knowledge)",
          });
        }
      } catch (searchErr) {
        console.warn("Vertex AI Search failover to fallback Gemini:", searchErr);
      }
    }

    // Record usage for uncredited external Gemini calls
    await recordServiceUsage("gemini_ai_calls", 1);

    // 4. Fallback Semantic Search via Vector Embeddings (if enabled in non-strict mode)
    let embedding: number[] = [];
    if (latestMessage.trim().length > 0) {
      embedding = await executeAiEmbedding(latestMessage);
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
    let systemPrompt = `You are the AI assistant for this website.
The user is currently viewing the following page/URL: ${pageContext || 'unknown'}. Use this context to provide highly relevant answers.
The user's preferred language locale code is: ${locale || 'en'}. You MUST reply in this language (hi=Hindi, mr=Marathi, gu=Gujarati, ta=Tamil, te=Telugu, kn=Kannada, bn=Bengali, ml=Malayalam, pa=Punjabi, or=Odia). Use natural, colloquial local phrasing that everyday shopkeepers and homeowners speak — keep familiar technical/commercial words like CCTV, DVR/NVR, Wi-Fi, 4G SIM, Hard Disk, EMI, GST, and Site Survey in readable English instead of stiff textbook words.
Your current security context is: ${securityContext.role}.
${securityContext.userId ? `The user's unique ID is: ${securityContext.userId}. Whenever a tool requires a 'userId', use this ID automatically without asking the user for it.` : ''}

CRITICAL INSTRUCTION FOR PRICING & QUOTES:
If the user asks for pricing, cost, discounts, or a custom quote, and your security context is 'UNAUTHENTICATED', you MUST NOT ask them for any details like user ID or email. You MUST IMMEDIATELY reply with exactly this keyword: <REQUIRE_OTP>. Do NOT add any other words. Just <REQUIRE_OTP>.

You are allowed to perform: ${securityContext.allowedActions.join(", ")}.
If the user asks for something outside these actions, refuse gracefully.
Do not leak internal database structures or admin secrets unless the role is ADMIN.`;

    if (securityContext.role === "USER") {
      systemPrompt += `

CRITICAL INSTRUCTION FOR TECH SUPPORT:
You are an expert CCTV Technician. The user is an existing customer looking for help. 
Common issues you can solve:
1. DVR Beeping: Usually means HDD error (storage full or corrupted) or video loss. Tell them to check Settings > Storage and format the HDD, or check camera cable connections.
2. App Offline (Hik-Connect/CP Plus): Tell them to check if the DVR's LAN port lights are blinking. Ask them to restart their Wi-Fi router.
3. Forgotten Password: Tell them to use the SADP tool or scan the QR code on the physical DVR login screen to reset it.
If they ask for an AMC or Warranty renewal, tell them to close this chat and visit the 'Warranties & AMC' tab in their dashboard. Keep your answers short, friendly, and practical.`;
    }

    // 4. Token-Optimized Conversation History:
    // Slices to last 6 turns to prevent quadratic token growth.
    // Only attaches base64 image data to the latest user message to avoid re-transmitting old image tokens.
    const recentMessages = messages.slice(-6);
    const lastMsgIdx = recentMessages.length - 1;

    const contents: any[] = recentMessages.map((m: any, idx: number) => {
      const parts: any[] = [];
      if (m.content) {
        parts.push({ text: m.content });
      }
      
      // Only attach image to the latest turn in active focus
      if (m.image && idx === lastMsgIdx) {
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
    });

    let availableTools: any[] = [];
    if (securityContext.role === "ADMIN" || securityContext.role === "USER") {
      availableTools = [wizardToolDefinition as any, updateQuotationWizardToolDefinition as any];
    }

    let gatewayRes = await executeAiGateway({
      task: "chat-fallback",
      contents,
      systemInstruction: systemPrompt,
      maxOutputTokens: 400,
      temperature: 0.2,
      tools: availableTools.length > 0 ? [{ functionDeclarations: availableTools }] : []
    });

    if (!gatewayRes.success && gatewayRes.blocked) {
      return NextResponse.json({
        role: "assistant",
        content: isNonEnglish
          ? "नमस्ते! कृपया कैमरा चुनने या कोटेशन देखने के लिए नीचे दिए गए बटनों का उपयोग करें। हमारी टीम आपकी सहायता के लिए तैयार है।"
          : "Hello! Please use the buttons below to configure cameras or view your quotation. Our team is ready to assist you.",
        quickActions: localizeChatQuickActions([
          { label: "Chat on WhatsApp", action: "whatsapp_connect" },
          { label: "Generate Instant Quote", action: "open_wizard" }
        ], locale)
      });
    }

    // 4b. Handle Function Calling (Advanced RAG)
    let callCount = 0;
    while (gatewayRes.functionCalls && gatewayRes.functionCalls.length > 0 && callCount < 3) {
      callCount++;
      const call = gatewayRes.functionCalls[0];
      let functionResponse: any = {};

      if (call.name === "getQuotationWizardStatus") {
        const userId = (call.args as any).userId;
        functionResponse = await executeQuotationWizardStatus(userId, securityContext.role);
      } else if (call.name === "updateQuotationWizard") {
        const userId = (call.args as any).userId;
        const addCameras = (call.args as any).addCameras;
        functionResponse = await executeUpdateQuotationWizard(userId, addCameras, securityContext.role);
      }

      // Append the function call and response to the conversation history
      if (gatewayRes.candidates && gatewayRes.candidates.length > 0 && gatewayRes.candidates[0].content) {
        contents.push(gatewayRes.candidates[0].content);
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

      gatewayRes = await executeAiGateway({
        task: "chat-fallback",
        contents,
        systemInstruction: systemPrompt,
        maxOutputTokens: 400,
        temperature: 0.2,
        tools: availableTools.length > 0 ? [{ functionDeclarations: availableTools }] : []
      });
    }

    const answer = gatewayRes.text || chatUi.fallbackError;

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
