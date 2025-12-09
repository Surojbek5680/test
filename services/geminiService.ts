import { GoogleGenAI } from "@google/genai";
import { Requisition, RequestStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeStatistics = async (requests: Requisition[]): Promise<string> => {
  try {
    // Filter for approved requests to analyze actual consumption
    const approved = requests.filter(r => r.status === RequestStatus.APPROVED);
    
    // Prepare a lightweight summary for the AI to process
    const summaryData = approved.map(r => ({
      product: r.productName,
      qty: r.quantity,
      date: r.date.split('T')[0],
      org: r.orgName
    }));

    const prompt = `
      Quyidagi ma'lumotlar tashkilotlarning tasdiqlangan mahsulot talabnomalari ro'yxati (JSON formatida).
      Ma'lumotlar: ${JSON.stringify(summaryData)}

      Iltimos, ushbu ma'lumotlarni o'zbek tilida tahlil qilib bering. 
      Quyidagilarni o'z ichiga olsin:
      1. Eng ko'p talab qilingan mahsulotlar.
      2. Eng faol tashkilotlar.
      3. G'ayrioddiy tendentsiyalar (agar bo'lsa).
      4. Kelajak uchun qisqacha tavsiya.

      Javobni chiroyli formatda, markdown ro'yxatlari bilan qaytar.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Tahlil natijasi olinmadi.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Xatolik yuz berdi: AI xizmati bilan bog'lanib bo'lmadi.";
  }
};
