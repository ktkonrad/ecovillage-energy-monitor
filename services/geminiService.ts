import { GoogleGenAI } from "@google/genai";
import { Resident, UsageRecord } from "../types";

// Initialize Gemini
// Note: In a real app, this key should be proxied or handled securely. 
// For this demo, we use the env variable as instructed.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeCommunityEnergy = async (
  records: UsageRecord[],
  residents: Resident[]
): Promise<string> => {
  try {
    // 1. Pre-process data to avoid token limits.
    // Group by resident and calculate total and avg.
    const summary = residents.map(r => {
      const residentRecords = records.filter(rec => rec.residentId === r.id);
      const totalKwh = residentRecords.reduce((sum, rec) => sum + rec.kwh, 0);
      const avgKwh = residentRecords.length > 0 ? totalKwh / residentRecords.length : 0;
      return {
        name: r.name,
        totalKwh: totalKwh.toFixed(1),
        dailyAvg: avgKwh.toFixed(1)
      };
    });

    const totalCommunityKwh = summary.reduce((sum, item) => sum + parseFloat(item.totalKwh), 0);

    const prompt = `
      You are an energy efficiency expert for an eco-conscious community.
      Here is the energy usage summary for the last month (in kWh):
      
      Community Total: ${totalCommunityKwh.toFixed(1)} kWh
      
      Resident Breakdown:
      ${JSON.stringify(summary, null, 2)}
      
      Please provide a concise analysis in 3 short paragraphs:
      1. Identify the top 3 highest consumers and potential reasons (e.g., heating, old appliances) based on general knowledge of domestic energy.
      2. Suggest 3 specific, actionable community-wide tips to reduce overall consumption.
      3. Give a positive encouragement about their eco-efforts.
      
      Keep the tone friendly, encouraging, but data-driven.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Unable to generate insights at this time.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't analyze the data right now. Please ensure the API key is valid.";
  }
};