import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, apiKey } = body;
    
    // API Key priority: process.env -> frontend request
    const finalApiKey = process.env.GEMINI_API_KEY || apiKey;
    
    if (!finalApiKey) throw new Error("API Key missing hai. Please set GEMINI_API_KEY in Vercel.");
    if (!image) throw new Error("Image data missing hai.");

    // Image processing
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
    
    // JSON cleaning
    let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("AI ne valid JSON return nahi kiya: " + text);
    }
    
    const data = JSON.parse(cleanText.substring(jsonStart, jsonEnd + 1));
    return NextResponse.json({ result: data });

  } catch (error: any) {
    console.error('SERVER SIDE ERROR:', error);
    return NextResponse.json({ 
      error: "Scanner error", 
      details: error.message 
    }, { status: 500 });
  }
}