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
            text: `Generate a high-quality seamless, tiling texture. 
            Style: ${prompt}. 
            Constraints: Square aspect ratio, must be seamless/tileable, top-down view, flat lighting.`
          }
        ]
      },
      config: {
        // Nano banana models don't support imageConfig for size, 
        // but default aspect ratio is usually square which is good for textures.
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
        throw new Error("No image generated.");
    }

    return `data:image/png;base64,${base64String}`;

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};