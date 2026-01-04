
import { GoogleGenAI, Type } from "@google/genai";
import { TravelData } from "../types";

export const fetchTravelData = async (location: string, coords?: { lat: number; lng: number }): Promise<TravelData> => {
  // Always initialize GoogleGenAI with the required named parameter and environment variable strictly.
  // Instantiating inside the function ensures the client uses the most current context.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Generate comprehensive travel planning information for "${location}".
  If possible, take into account these coordinates: ${coords ? `Lat ${coords.lat}, Lng ${coords.lng}` : 'Unknown'}.
  Provide:
  - Current/typical weather for travelers right now.
  - UTC Offset (e.g., UTC+1).
  - A suggested 1-day highlight itinerary (Morning, Afternoon, Evening).
  - Neighborhood recommendations and hotel booking tips for this location.
  - A destination-specific checklist of 5 things to do/bring.
  - A destination-specific shopping list of 5 local items/souvenirs to look for.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          weather: { type: Type.STRING },
          utcOffset: { type: Type.STRING },
          itineraryTable: {
            type: Type.OBJECT,
            properties: {
              morning: { type: Type.STRING },
              afternoon: { type: Type.STRING },
              evening: { type: Type.STRING },
            },
            required: ["morning", "afternoon", "evening"]
          },
          hotelInfo: { type: Type.STRING },
          todoList: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          shoppingList: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
        },
        required: ["weather", "utcOffset", "itineraryTable", "hotelInfo", "todoList", "shoppingList"]
      },
    },
  });

  try {
    // Access the generated text directly from the response.text property (not a method).
    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Received empty response from the AI model.");
    }
    const data = JSON.parse(textOutput);
    return data as TravelData;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Could not parse travel data");
  }
};
