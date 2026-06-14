import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { image, apiKey } = await req.json();
    if (!image || !apiKey) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Yahan 'gemini-1.5-flash' ki jagah sirf 'gemini-1.5-flash' try kar rahe hain
    // Agar ye error de, toh hum 'gemini-1.0-pro' try karenge.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = image.split(',')[1] || image;

    const result = await model.generateContent([
      "Extract contact info as JSON: name, jobTitle, company, email, phone, address.",
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    return NextResponse.json({ result: JSON.parse(result.response.text().replace(/```json|```/g, "")) });

  } catch (error: any) {
    // Yahan ERROR Details saaf dikhengi
    console.error("API ERROR:", error); 
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
