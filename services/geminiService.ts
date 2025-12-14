import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";
import { SYSTEM_INSTRUCTION, USER_PROMPT } from "../constants";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    visualEvidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A bulleted list of the 3-4 most striking visual facts based on the vectors.",
    },
    personalitySnapshot: {
      type: Type.STRING,
      description: "A 2-3 sentence synthesis of what the visual facts suggest about their current mindset or personality.",
    },
    disclaimer: {
      type: Type.STRING,
      description: "The required standard disclaimer.",
    },
  },
  required: ["visualEvidence", "personalitySnapshot", "disclaimer"],
};

// Now accepts optional context string
export const analyzeImage = async (base64Data: string, mimeType: string, context?: string): Promise<AnalysisResult> => {
  try {
    // Strip the data:image/xxx;base64, prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

    const finalPrompt = context 
      ? `${USER_PROMPT}\n\nIMPORTANT - USE THIS DATA TO GROUND YOUR ANALYSIS:\n${context}` 
      : USER_PROMPT;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.7, // Balanced for creativity vs consistency
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No response received from Gemini.");
    }

    const jsonResult = JSON.parse(textResponse) as AnalysisResult;
    return jsonResult;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

export const generateLineArt = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image data found in generation response");
  } catch (error) {
    console.error("Error generating art:", error);
    throw error;
  }
};