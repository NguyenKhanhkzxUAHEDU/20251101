
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash-image';

/**
 * Generates an image based on a source image and a text prompt.
 * @param base64Image The base64 encoded string of the source image.
 * @param mimeType The MIME type of the source image (e.g., 'image/jpeg').
 * @param prompt A text description of the desired output.
 * @returns A promise that resolves to the base64 data URL of the generated image.
 */
export const generateImageFromImageAndText = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData && part.inlineData.mimeType.startsWith('image/')
    );

    if (imagePart && imagePart.inlineData) {
      const base64ImageData = imagePart.inlineData.data;
      const imageMimeType = imagePart.inlineData.mimeType;
      return `data:${imageMimeType};base64,${base64ImageData}`;
    } else {
      throw new Error("The AI did not return a valid image. Try adjusting your prompt.");
    }
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    throw new Error("Failed to generate architectural image. The model may be unavailable or the request may have been blocked.");
  }
};
