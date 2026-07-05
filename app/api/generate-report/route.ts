import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  // Read body ONCE, before try/catch so it's available in fallback
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    companyName = "Your Company",
    industry = "other",
    estimatedMonthlyRevenueLost = 0,
    annualLostRevenue = 0,
    averageMissedCallsPerDay = 0,
    overallScore = 0,
    weaknesses = [],
    recommendations = [],
    siteIntelligence,
    roiEstimate = "",
    businessSummary = "",
  } = body;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
    const genAI = new GoogleGenerativeAI(apiKey);
    const gemini = genAI.getGenerativeModel({ model });

    const prompt = `You are Sudais Jan, an AI automation consultant who helps plumbing, HVAC, and emergency service companies capture more revenue with AI receptionists.

You have just completed a deep diagnostic for a prospect. Now write the REPORT CONTENT in JSON.

## REAL DATA
- Company: ${companyName}
- Business Summary: ${businessSummary || "Emergency home service company"}
- Industry: ${industry}
- Overall Score: ${overallScore}/100
- Monthly Revenue Lost: ${formatCurrency(estimatedMonthlyRevenueLost)}
- Annual Revenue Lost: ${formatCurrency(annualLostRevenue)}
- Missed Calls/Day: ${averageMissedCallsPerDay}
- ROI Estimate: ${roiEstimate}
- Weaknesses Found: ${JSON.stringify(weaknesses)}
- Recommendations: ${JSON.stringify(recommendations)}
- Site Intelligence: ${JSON.stringify(siteIntelligence)}

## GENERATE THIS JSON:
{
  "executiveSummary": "2-3 sentences summarizing the situation. Mention the company by name, what they do, their score, and the key revenue gap. Make it punchy and clear.",

  "detailedWeaknesses": [
    {
      "title": "Short 4-6 word title for this weakness",
      "explanation": "2-3 sentences explaining WHY this weakness costs them money. Be specific to their industry and services. Use real numbers from the data above.",
      "monthlyCost": "Estimated dollar impact of THIS specific weakness per month (calculate proportionally from the total monthly loss)"
    }
  ],

  "prioritizedRoadmap": [
    {
      "priority": 1,
      "title": "Short action title",
      "description": "2-3 sentences on what this does and why it matters for their specific business. Reference their services.",
      "expectedImpact": "What result they can expect (e.g. 'Recover ~60% of after-hours emergency calls')",
      "timeline": "How fast this can be set up (e.g. '48 hours')"
    }
  ],

  "personalClosing": "Write a 4-6 sentence personal message FROM Sudais Jan TO this business owner. Rules: First person only (I, me, my) — NOT we, our, the company. Friendly and real, not corporate. Like talking to a friend. Reference THEIR specific situation (company name, score, how much they lose, their industry). Mention that the AI receptionist costs less than a single service job. Mention the FREE first month offer: I'll build and set up your entire AI receptionist system completely free for the first month. You run it, test it, watch it book jobs for you — zero risk. All you cover is the basic software costs and give me access to connect things. If it doesn't pay for itself by month two, walk away. End with something about them being the business in their area that Never Misses a Call. Keep it under 120 words."
}

Return ONLY valid JSON. No markdown, no code fences.`;

    const result = await gemini.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    let cleanJson = result.response.text().trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
    }

    const reportData = JSON.parse(cleanJson);
    return NextResponse.json(reportData);
  } catch (error) {
    console.error("[GenerateReport] Gemini failed, using fallback:", error);

    // Deterministic fallback — always works
    const weaknessCount = weaknesses.length || 3;
    const costPer = estimatedMonthlyRevenueLost
      ? "$" + Math.round(estimatedMonthlyRevenueLost / weaknessCount).toLocaleString()
      : "Significant";

    return NextResponse.json({
      executiveSummary: `${companyName} is currently losing an estimated ${formatCurrency(estimatedMonthlyRevenueLost)} per month from missed calls. With an overall call-handling score of ${overallScore}/100, there are critical gaps in after-hours coverage and digital engagement that are sending paying customers directly to competitors.`,
      detailedWeaknesses: weaknesses.map((w: string, i: number) => ({
        title: `Critical Gap #${i + 1}`,
        explanation: w,
        monthlyCost: costPer,
      })),
      prioritizedRoadmap: recommendations.map((r: string, i: number) => ({
        priority: i + 1,
        title: r.substring(0, 50) + (r.length > 50 ? "..." : ""),
        description: r,
        expectedImpact: "Significant revenue recovery",
        timeline: i === 0 ? "48 hours" : `Week ${i + 1}`,
      })),
      personalClosing: `Hey — I just looked at everything on ${companyName}'s setup and I see exactly where the money is slipping through. You're losing around ${formatCurrency(estimatedMonthlyRevenueLost)} every single month, and honestly, fixing this costs less than one ${industry} job. I'll build and set up your entire AI receptionist system completely free for the first month. You run it, test it, watch it book real jobs — zero risk. All you cover is the basic software costs and give me access to connect things. If it doesn't pay for itself by month two, walk away. Let's make you the one business in your area that Never Misses a Call.`,
      _usedFallback: true,
    });
  }
}
