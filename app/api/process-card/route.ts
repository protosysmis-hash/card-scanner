import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { image, apiKey } = await req.json();
    
    const finalApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!image || !finalApiKey) {
      return NextResponse.json({ error: 'API key ya image missing hai' }, { status: 400 });
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

    const genAI = new GoogleGenerativeAI(finalApiKey);
    
    // Yahan hum model name ko ek variable mein le rahe hain
    // Aur hum 'gemini-1.5-flash' hi use kar rahe hain
    const modelName = 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Extract contact info from this card. Return ONLY valid JSON format. No markdown, no prefixes, no explanations. 
    Format: {"name": "", "jobTitle": "", "company": "", "email": "", "phone": "", "address": ""}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    let text = response.text().trim();
    
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    text = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
    } else {
        throw new Error("Invalid response format from AI");
    }

    const data = JSON.parse(text);
    return NextResponse.json({ result: data });

  } catch (error: any) {
    console.error('API Error Details:', error);
    return NextResponse.json({ 
      error: "Scanner error", 
      details: error.message 
    }, { status: 500 });
  }
}