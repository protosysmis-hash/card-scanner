import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { image, apiKey } = await req.json();
    const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!image || !finalApiKey) {
      return NextResponse.json({ error: 'Missing image or API key' }, { status: 400 });
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

    const genAI = new GoogleGenerativeAI(finalApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prompt ko simple rakha hai taaki AI direct JSON de
    const prompt = `Extract contact info from this card. Return ONLY a valid JSON object. 
    Do not add any explanations or markdown. 
    Format: {"name": "", "jobTitle": "", "company": "", "email": "", "phone": "", "address": ""}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType } }
    ]);

    const response = await result.response;
    let text = response.text().trim();

    // Markdown tags hatana
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Agar text ke beech mein hi JSON hai, toh use extract karna
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      text = text.substring(startIndex, endIndex + 1);
    }

    const data = JSON.parse(text);
    return NextResponse.json({ result: data });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}