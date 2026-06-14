import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, apiKey } = body;

    if (!apiKey || !image) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // 1.5-flash fast hai, lekin agar ye fail ho raha hai, 
    // toh hum try-catch ke andar iska call daal rahe hain
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = image.split(',')[1] || image;

    const result = await model.generateContent([
      "Extract contact info as JSON: name, jobTitle, company, email, phone, address.",
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // JSON clean-up
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonStr.substring(jsonStr.indexOf('{'), jsonStr.lastIndexOf('}') + 1));
    
    return NextResponse.json({ result: data });

  } catch (error: any) {
    console.error("SERVER ERROR:", error);
    return NextResponse.json({ error: "Scanner error", details: error.message }, { status: 500 });
  }
}