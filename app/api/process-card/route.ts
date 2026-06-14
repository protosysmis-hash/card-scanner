import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { image, apiKey } = await req.json();

    if (!image || !apiKey) {
      return NextResponse.json({ error: "Missing image or API key" }, { status: 400 });
    }

    // Direct frontend se aayi hui key use kar rahe hain
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = image.split(',')[1] || image;

    const result = await model.generateContent([
      "Extract contact info as JSON (only return valid JSON): name, jobTitle, company, email, phone, address.",
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json({ result: JSON.parse(cleanJson) });

  } catch (error: any) {
    console.error("DEBUG ERROR:", error); // Ye console Vercel logs mein dikhega
    return NextResponse.json({ error: "Backend process failed: " + error.message }, { status: 500 });
  }
}
