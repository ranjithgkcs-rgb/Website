
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { Recipe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    prepTime: { type: Type.STRING },
    cookTime: { type: Type.STRING },
    servings: { type: Type.NUMBER },
    difficulty: { type: Type.STRING },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING }
        },
        required: ["name", "amount"]
      }
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    nutrition: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER }
      },
      required: ["calories", "protein", "carbs", "fat"]
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["title", "description", "prepTime", "cookTime", "servings", "difficulty", "ingredients", "instructions", "nutrition", "tags"]
};

export async function generateRecipeFromIngredients(ingredients: string[]): Promise<Recipe> {
  const prompt = `Generate a high-quality, professional recipe using these ingredients: ${ingredients.join(", ")}. Feel free to assume basic pantry staples like salt, oil, and water are available.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: recipeSchema
    }
  });

  return JSON.parse(response.text) as Recipe;
}

export async function searchRecipes(query: string): Promise<{ text: string; sources: any[] }> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find popular and authentic recipes or food news for: ${query}. Provide a helpful summary.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text || '',
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

export async function analyzeFridgeImage(base64Image: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "List the food items and ingredients you see in this image. Return only a comma-separated list of items." }
      ]
    }
  });
  
  return response.text.split(',').map(item => item.trim());
}

export async function generateFoodImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A professional, high-quality, appetizing food photograph of: ${prompt}. Studio lighting, 4k.` }]
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    }
  });

  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return 'https://picsum.photos/800/400';
}
