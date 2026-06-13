import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, apiKey } = body;
    
    const finalApiKey = process.env.GEMINI_API_KEY || apiKey;

    if (!image) {
      return NextResponse.json({ error: 'Image missing hai' }, { status: 400 });
    }
    
    if (!finalApiKey) {
      return NextResponse.json({ error: 'API Key setup nahi hai' }, { status: 400 });
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

    const genAI = new GoogleGenerativeAI(finalApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `Extract contact info from this card. Return ONLY valid JSON format. 
    Format: {"name": "", "jobTitle": "", "company": "", "email": "", "phone": "", "address": ""}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: mimeType } }
    ]);

    const response = await result.response;
    let text = response.text().trim();
    
    // BUILD FIX: Yahan backticks ka use nahi kiya hai, strings use ki hain
    text = text.split("```json").join("");
    text = text.split("```").join("");
    text = text.trim();
    
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("AI ne valid JSON return nahi kiya");
    }
    
    const data = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
    return NextResponse.json({ result: data });

  } catch (error: any) {
    console.error('SERVER SIDE ERROR:', error.message);
    return NextResponse.json({ 
      error: "Scanner error", 
      details: error.message 
    }, { status: 500 });
  }
}