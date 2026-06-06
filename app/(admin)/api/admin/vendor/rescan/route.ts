import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { parseProductWithGemini } from "@/lib/vendor/gemini-parser";

export async function POST(request: Request) {
    try {
        const { raw_title, image_url } = await request.json();
        if (!raw_title) {
            return NextResponse.json({ success: false, error: "Missing raw_title" }, { status: 400 });
        }

        // 1. Fetch live catalog to use as references for Gemini
        const liveProductsSnapshot = await adminDb.collection('products').limit(50).get();
        const referenceProducts: any[] = [];
        
        // We'll try to find a few products that share words with our raw_title, or just pick random 3.
        const titleWords = raw_title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter((w: string) => w.length > 2).slice(0, 3);
        
        liveProductsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.display_name && data.category) {
                const liveTitleLower = data.display_name.toLowerCase();
                // Simple relevance check
                if (titleWords.some((w: string) => liveTitleLower.includes(w))) {
                    if (referenceProducts.length < 5) {
                        referenceProducts.push(data);
                    }
                }
            }
        });

        // If we didn't find relevant ones, just grab the first 3 as general format examples
        if (referenceProducts.length === 0) {
            let count = 0;
            liveProductsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.display_name && data.category && count < 3) {
                    referenceProducts.push(data);
                    count++;
                }
            });
        }

        // 2. Fetch Knowledge Base for extra rules
        const specKnowledgeSnapshot = await adminDb.collection('specification_knowledge').get();
        let trainingRules = "";
        specKnowledgeSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.spec_name) {
                trainingRules += `- Recognize "${data.spec_name}" as a valid technology/specification.\n`;
            }
        });

        // 3. Call Gemini
        const geminiResult = await parseProductWithGemini(raw_title, image_url, trainingRules, referenceProducts);

        return NextResponse.json({
            success: true,
            data: geminiResult
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
