import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { image, apiKey } = await req.json();

    if (!image || !apiKey) {
      return NextResponse.json({ error: "Missing image or API key" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Yahan model ka naam 'gemini-1.5-flash' ki jagah 
    // kabhi kabhi 'gemini-1.5-flash-latest' ya specific version chahiye hota hai.
    // Lekin 'gemini-1.5-flash' standard hai. 
    // Chalo ise try karte hain:
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const base64Data = image.split(',')[1] || image;

    const result = await model.generateContent([
      { text: "Extract contact info as JSON (only return valid JSON): name, jobTitle, company, email, phone, address." },
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json({ result: JSON.parse(cleanJson) });

  } catch (error: any) {
    console.error("DEBUG ERROR:", error);
    return NextResponse.json({ error: "Gemini error: " + error.message }, { status: 500 });
  }
}
