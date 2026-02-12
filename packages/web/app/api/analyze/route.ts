import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompts } = body; // Array of equipped skill prompts

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Google AI API key not configured" },
        { status: 500 }
      );
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build prompt based on equipped skills
    const websiteUrl = "https://robinpump.fun/";
    let userPrompt = "Find and list the tokens with the highest market cap on the platform.";
    
    if (prompts && prompts.length > 0) {
      userPrompt = prompts.join(" AND ");
    }

    const fullPrompt = `You are a crypto trading analyst AI. 

Please visit and analyze this website: ${websiteUrl}

Task: Find and identify the tokens/projects with the HIGHEST MARKET CAP on RobinPump.fun

User Request: ${userPrompt}

Based on the website content, please:
1. Identify the top 2 tokens with the highest market cap
2. Provide their exact market cap values
3. Include their current price in ETH
4. Provide a brief analysis summary

Format your response as JSON:
{
  "summary": "your analysis summary focusing on top market cap tokens",
  "reasoning": "detailed reasoning with numbered points about why these tokens have the highest market cap",
  "recommendedProjects": [
    {
      "title": "Project Name",
      "ticker": "TICK",
      "score": 95,
      "reason": "Why this token has high market cap (one sentence)",
      "price": "0.000042",
      "marketCap": "$1.2M",
      "priceChange": "+15.4%",
      "contractAddress": "0x18f6a4c6d274d35d819af45c2a12Dc27c2cdba5e"
    }
  ]
}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    // Try to extract JSON from response
    let analysisData;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      analysisData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback to structured response
      analysisData = {
        summary: text.slice(0, 300),
        reasoning: "AI analysis completed. See summary for details.",
        recommendedProjects: []
      };
    }

    return NextResponse.json({
      success: true,
      data: analysisData,
    });

  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Analysis failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
