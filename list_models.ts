import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const ai = new GoogleGenAI({});

async function listModels() {
    try {
        const response = await ai.models.list();
        for await (const model of response) {
            console.log(model.name);
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();
