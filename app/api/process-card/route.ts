import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, apiKey } = body;
    
    const finalApiKey = process.env.GEMINI_API_KEY || apiKey;
    if (!finalApiKey) throw new Error("API Key missing hai");
    if (!image) throw new Error("Image missing hai");

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

    const genAI = new GoogleGenerativeAI(finalApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Extract contact info from this card. Return ONLY valid JSON format. 
    Format: {"name": "", "jobTitle": "", "company": "", "email": "", "phone": "", "address": ""}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: mimeType } }
    ]);

    const response = await result.response;
    let text = response.text().trim();
    
    // BUILD FIX: Split/Join ka use kiya hai jo error nahi dega
    let cleanText = text.split("```json").join("");
    cleanText = cleanText.split("```").join("");
    cleanText = cleanText.trim();
    
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        console.error("AI Response:", text);
        throw new Error("AI ne valid JSON return nahi kiya");
    }
    
    const data = JSON.parse(cleanText.substring(jsonStart, jsonEnd + 1));
    return NextResponse.json({ result: data });

  } catch (error: any) {
    console.error('SERVER SIDE ERROR:', error.message);
    return NextResponse.json({ 
      error: "Scanner error", 
      details: error.message 
    }, { status: 500 });
  }
}