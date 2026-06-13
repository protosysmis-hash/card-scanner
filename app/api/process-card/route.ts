import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { image, apiKey } = await req.json();
    
    // Priority: User input > Environment Variable
    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!image || !finalApiKey) {
      return NextResponse.json({ error: 'API key ya image missing hai' }, { status: 400 });
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

    const genAI = new GoogleGenerativeAI(finalApiKey);
    
    // Model select kiya
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Extract contact info from this card. Return ONLY valid JSON format. 
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
    
    // JSON clean-up
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonStr = text.substring(jsonStart, jsonEnd + 1);
      const data = JSON.parse(jsonStr);
      return NextResponse.json({ result: data });
    } else {
      throw new Error("AI ne valid JSON return nahi kiya");
    }

  } catch (error: any) {
    console.error('API Error Details:', error);
    return NextResponse.json({ 
      error: "Scanner error", 
      details: error.message 
    }, { status: 500 });
  }
}