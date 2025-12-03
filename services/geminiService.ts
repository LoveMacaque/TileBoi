
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Generates an image and returns a base64 Data URL string
export const generateTextureImage = async (prompt: string): Promise<string> => {
  const model = "gemini-2.5-flash-image"; 
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            // Simplified prompt to avoid confusing the model or triggering specific safety flags
            text: `Texture: ${prompt}. High quality, seamless, tiling.`
          }
        ]
      }
    });

    let base64String = null;
    
    // Iterate to find image part
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                base64String = part.inlineData.data;
                break;
            }
        }
    }

    if (!base64String) {
        // Check if there was a text refusal or safety message
        const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
        if (textPart) {
            console.warn("Gemini refused with text:", textPart.text);
            throw new Error(`Generation blocked: ${textPart.text.substring(0, 100)}...`);
        }
        
        console.warn("Gemini did not return an inlineData part. Full response:", response);
        throw new Error("No image data returned. The prompt might have triggered safety filters.");
    }

    return `data:image/png;base64,${base64String}`;

  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    // Pass through the error message for the UI
    throw error;
  }
};
