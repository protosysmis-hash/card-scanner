import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, apiKey } = body;

    // 1. Agar image ya API key nahi mili, toh yahi se error bhej do
    if (!image || !apiKey) {
      return NextResponse.json({ error: "Missing image or API key" }, { status: 400 });
    }

    // 2. Gemini AI setup
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Image format clean up (data URL se base64 nikalna)
    const base64Data = image.split(',')[1] || image;

    // 4. Gemini ko call karo
    const result = await model.generateContent([
      "Extract contact info as JSON (only return valid JSON): name, jobTitle, company, email, phone, address.",
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const responseText = await result.response.text();
    
    // 5. Response se JSON clean karna (agar Gemini markdown formatting wapas de toh)
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json({ result: JSON.parse(cleanJson) });

  } catch (error: any) {
    // 6. Ab yahan error log hoga, jisse tumhein pata chalega ki problem kya hai
    console.error("API Error:", error.message);
    return NextResponse.json({ error: "Failed to process card", details: error.message }, { status: 500 });
  }
}
