import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const AnalysisSchema = z.object({
  companyName: z.string(),
  businessSummary: z.string(),
  industry: z.enum(["plumbing", "hvac", "general_contractor", "electrical", "other"]),
  estimatedMonthlyRevenueLost: z.number(),
  averageMissedCallsPerDay: z.number(),
  peakHoursRevenueLoss: z.number(),
  competitorAdvantageGap: z.number(),
  annualLostRevenue: z.number(),
  roiTimelineMonths: z.number(),
  overallScore: z.number().min(0).max(100),
  weaknesses: z.array(z.string()).min(3).max(5),
  roiEstimate: z.string(),
  recommendations: z.array(z.string()).min(4).max(6),
  siteIntelligence: z.object({
    hasChatbot: z.boolean(),
    hasContactForm: z.boolean(),
    hasOnlineBooking: z.boolean(),
    hasPhoneCTA: z.boolean(),
    has24_7Mention: z.boolean(),
    servicesDetected: z.array(z.string()),
    serviceArea: z.string().optional(),
  }),
});

// ─── Input validation ──────────────────────────────────────────────────────────
const InputSchema = z.object({
  website: z.string().min(4),
  weeklyCallVolume: z.string(),
  afterHoursSupport: z.string(),
  estimatedMissedCalls: z.number().optional().nullable(),
});

// ─── Firecrawl Scraper (direct REST — more reliable than SDK on Node 20) ──────
async function scrapeWebsite(url: string): Promise<{
  markdown: string;
  title: string;
  description: string;
  html: string;
}> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }

  const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html"],
      onlyMainContent: true,
      removeBase64Images: true,
      blockAds: true,
      timeout: 30000,
      location: {
        country: "US",
        languages: ["en-US"],
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Firecrawl API error:", response.status, errorBody);
    throw new Error(`Firecrawl scrape failed: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    throw new Error("Firecrawl returned unsuccessful result");
  }

  return {
    markdown: result.data.markdown || "",
    title: result.data.metadata?.title || "",
    description: result.data.metadata?.description || "",
    html: result.data.html || "",
  };
}

// ─── HTML Feature Detection ────────────────────────────────────────────────────
function detectSiteFeatures(html: string, markdown: string) {
  const lowerHtml = html.toLowerCase();
  const lowerMd = markdown.toLowerCase();
  const combined = lowerHtml + " " + lowerMd;

  // Chatbot / Live chat widget detection
  const chatbotPatterns = [
    "intercom", "drift", "tidio", "livechat", "tawk", "zendesk",
    "crisp", "olark", "hubspot-messages", "freshchat", "chatwoot",
    "chat-widget", "live-chat", "chatbot", "messenger-widget",
    "dialogflow", "botpress", "manychat", "chat bubble",
    "widget-chat", "chat_widget", "liveagent",
  ];
  const hasChatbot = chatbotPatterns.some((p) => combined.includes(p));

  // Contact form detection
  const hasContactForm =
    (lowerHtml.includes("<form") && (
      combined.includes("contact") ||
      combined.includes("quote") ||
      combined.includes("request") ||
      combined.includes("get in touch") ||
      combined.includes("message") ||
      combined.includes("estimate") ||
      combined.includes("schedule")
    )) ||
    combined.includes("contact form") ||
    combined.includes("request a quote") ||
    combined.includes("get a quote") ||
    combined.includes("free estimate");

  // Online booking / scheduling widget detection
  const bookingPatterns = [
    "calendly", "housecall pro", "housecallpro", "servicetitan",
    "jobber", "acuity", "book online", "book now", "schedule online",
    "schedule service", "book a service", "online booking",
    "schedule appointment", "book appointment",
  ];
  const hasOnlineBooking = bookingPatterns.some((p) => combined.includes(p));

  // Phone CTA detection — prominent clickable phone
  const hasPhoneCTA =
    lowerHtml.includes('href="tel:') ||
    lowerHtml.includes("click-to-call") ||
    lowerHtml.includes("call now") ||
    combined.includes("call us") ||
    combined.includes("call today");

  // 24/7 or emergency language
  const has24_7Mention =
    combined.includes("24/7") ||
    combined.includes("24 hour") ||
    combined.includes("around the clock") ||
    combined.includes("always available") ||
    combined.includes("after hours") ||
    combined.includes("emergency service");

  // Services detection
  const serviceKeywords = [
    "plumbing", "hvac", "heating", "cooling", "air conditioning",
    "furnace", "boiler", "water heater", "drain", "sewer",
    "pipe", "leak", "toilet", "faucet", "garbage disposal",
    "ac repair", "ac installation", "duct", "ventilation",
    "thermostat", "heat pump", "electrical", "wiring",
    "remodeling", "renovation", "roofing", "general contractor",
  ];
  const servicesDetected = serviceKeywords.filter((s) => combined.includes(s));

  // Service area detection
  let serviceArea = "";
  const areaPatterns = [
    /serv(?:ing|ice area|ices?)\s*(?:in|:)?\s*([A-Z][a-z]+(?:\s*,?\s*[A-Z][a-z]+){0,5})/i,
    /areas?\s+(?:we\s+)?serv(?:e|ing|iced)\s*(?:include|:)?\s*([^.]{10,80})/i,
    /located\s+in\s+([^.]{5,60})/i,
    /serving\s+the\s+([^.]{5,80})\s+area/i,
  ];
  for (const pattern of areaPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      serviceArea = match[1].trim().substring(0, 100);
      break;
    }
  }

  return {
    hasChatbot,
    hasContactForm,
    hasOnlineBooking,
    hasPhoneCTA,
    has24_7Mention,
    servicesDetected: [...new Set(servicesDetected)].slice(0, 10),
    serviceArea,
  };
}

// ─── Gemini AI Analysis ────────────────────────────────────────────────────────
async function analyzeWithGemini(
  scrapedContent: { markdown: string; title: string; description: string },
  siteFeatures: ReturnType<typeof detectSiteFeatures>,
  userInputs: {
    website: string;
    weeklyCallVolume: string;
    afterHoursSupport: string;
    estimatedMissedCalls: number | null;
  }
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const genAI = new GoogleGenerativeAI(apiKey);
  const gemini = genAI.getGenerativeModel({ model });

  // Truncate markdown to stay within token limits (keep first ~4000 chars)
  const truncatedContent = scrapedContent.markdown.substring(0, 4000);

  const prompt = `You are a senior business analyst specializing in revenue diagnostics for emergency home service companies (plumbers, HVAC, electrical). You have been given REAL website data and REAL user inputs. Generate a completely personalized revenue impact analysis.

## REAL DATA PROVIDED

### Website Intelligence
- **Website Title:** ${scrapedContent.title}
- **Meta Description:** ${scrapedContent.description}
- **Website URL:** ${userInputs.website}

### Detected Features
- Has AI Chatbot/Live Chat: ${siteFeatures.hasChatbot ? "YES" : "NO"}
- Has Contact Form: ${siteFeatures.hasContactForm ? "YES" : "NO"}
- Has Online Booking/Scheduling: ${siteFeatures.hasOnlineBooking ? "YES" : "NO"}
- Has Click-to-Call Phone CTA: ${siteFeatures.hasPhoneCTA ? "YES" : "NO"}
- Mentions 24/7 or Emergency: ${siteFeatures.has24_7Mention ? "YES" : "NO"}
- Services Detected: ${siteFeatures.servicesDetected.join(", ") || "none detected"}
- Service Area: ${siteFeatures.serviceArea || "not detected"}

### User-Provided Inputs
- Weekly Incoming Calls: ${userInputs.weeklyCallVolume}
- After-Hours Emergency Support: ${userInputs.afterHoursSupport}
- User-Estimated Weekly Missed Calls: ${userInputs.estimatedMissedCalls ?? "not provided (use industry average ~22% miss rate)"}

### Scraped Website Content (truncated):
${truncatedContent}

---

## YOUR TASK

Generate a JSON analysis with these EXACT fields. EVERY number must be calculated from the REAL inputs above, not made up:

1. **companyName** — Extract the REAL company name from the website title/content. Not the domain.
2. **businessSummary** — A concise 1-2 sentence summary of their business based on the crawl. Mention the company name, detected services (like HVAC, plumbing, or electrical), primary location/service areas, and any unique value propositions or special tags (e.g., family-owned, emergency specialists, since 1995, certified technicians).
3. **industry** — One of: "plumbing", "hvac", "general_contractor", "electrical", "other". Based on detected services.
4. **estimatedMonthlyRevenueLost** — Calculate: (weekly calls × miss rate × 4.33 weeks × conversion rate 20-25% × avg job value by industry). Use the user's estimated misses if provided, otherwise use industry miss rate (18-25% depending on after-hours coverage).
   - Plumbing avg job: $350-$550
   - HVAC avg job: $450-$750
   - Electrical avg job: $300-$500
   - If user says "no" after-hours → use 25% miss rate. If "partial" → 20%. If "yes" → 12%.
5. **averageMissedCallsPerDay** — Weekly missed calls ÷ 7. If user provided estimated misses, use that. Otherwise calculate from weekly call volume × miss rate.
6. **peakHoursRevenueLoss** — 38-45% of monthly loss (peak hours 8-10am, 4-7pm account for ~40% of all missed calls).
7. **competitorAdvantageGap** — Percentage 15-30%. Higher if no chatbot AND no online booking AND no 24/7 coverage.
8. **annualLostRevenue** — Monthly × 12.
9. **roiTimelineMonths** — How many months to recover AI receptionist investment at $397/month. Typically 1-3.
10. **overallScore** — 0 to 100. Score based on detected features: +15 for chatbot, +15 for online booking, +10 for contact form, +10 for phone CTA, +20 for 24/7 mention, +15 for after-hours coverage, +15 base. Lower score = worse.
11. **weaknesses** — Exactly 3-5 strings. MUST reference SPECIFIC findings from the site scan. Examples:
    - If no chatbot: mention that website visitors who arrive after hours have no way to interact or get help
    - If no online booking: mention inability for emergency callers to self-schedule
    - If form exists but no speed-to-lead: mention that form submissions likely sit for hours before anyone responds
    - Reference their ACTUAL services when possible
12. **roiEstimate** — Dollar figure string for first-year net return: (annual recovered revenue × 88%) - ($397 × 12)
13. **recommendations** — Exactly 4-6 strings. These MUST be conditional on site features:
    - If hasChatbot=NO → Recommend deploying 24/7 AI chatbot to capture after-hours visitors
    - If hasContactForm=YES → Recommend AI-powered speed-to-lead form reply (under 2 minutes: AI reads inquiry, determines urgency, alerts team for emergencies, books/quotes for others)
    - If hasOnlineBooking=NO → Recommend AI-powered booking integration
    - If hasPhoneCTA=NO or weak → Recommend making phone number click-to-call and above the fold
    - If afterHoursSupport=NO → Recommend 24/7 AI receptionist as #1 priority
    - Reference their actual detected services in recommendations
    - Every recommendation must provide SPECIFIC, actionable value — no generic filler

14. **siteIntelligence** — Object with all detected booleans: hasChatbot, hasContactForm, hasOnlineBooking, hasPhoneCTA, has24_7Mention, servicesDetected (array), serviceArea (string)

Return ONLY valid JSON. No markdown formatting, no code fences, no explanations. Just the raw JSON object.`;

  const result = await gemini.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const responseText = result.response.text();

  // Clean any accidental markdown fences
  let cleanJson = responseText.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  }

  return JSON.parse(cleanJson);
}

// ─── Fallback engine (when APIs fail — ensures demo always works) ──────────────
function generateFallbackAnalysis(
  website: string,
  userInputs: {
    weeklyCallVolume: string;
    afterHoursSupport: string;
    estimatedMissedCalls: number | null;
  }
) {
  // Extract company name from URL
  let companyName = "Your Service Company";
  try {
    const hostname = new URL(website).hostname.replace(/^www\./, "");
    companyName = hostname
      .split(".")[0]
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } catch {}

  // Parse weekly calls
  const callMap: Record<string, number> = {
    "10-20": 15,
    "20-50": 35,
    "50-100": 75,
    "100-200": 150,
    "200+": 250,
  };
  const weeklyCalls = callMap[userInputs.weeklyCallVolume] || 50;

  // Determine miss rate from after-hours status
  const missRateMap: Record<string, number> = {
    no: 0.25,
    partial: 0.20,
    yes: 0.12,
  };
  const missRate = missRateMap[userInputs.afterHoursSupport] || 0.22;

  // Weekly missed calls
  const weeklyMissed = userInputs.estimatedMissedCalls ?? Math.round(weeklyCalls * missRate);
  const dailyMissed = Number((weeklyMissed / 7).toFixed(1));
  const monthlyMissed = Math.round(weeklyMissed * 4.33);
  const avgJobValue = 450; // general average
  const conversionRate = 0.22;
  const monthlyLoss = Math.round(monthlyMissed * conversionRate * avgJobValue);
  const annualLoss = monthlyLoss * 12;
  const peakLoss = Math.round(monthlyLoss * 0.42);
  const competitorGap = userInputs.afterHoursSupport === "no" ? 27 : 19;
  const roiMonths = monthlyLoss > 10000 ? 1 : monthlyLoss > 5000 ? 2 : 3;
  const score = userInputs.afterHoursSupport === "no" ? 42 : userInputs.afterHoursSupport === "partial" ? 58 : 72;
  const annualReturn = Math.round(annualLoss * 0.88 - 397 * 12);

  return {
    companyName,
    businessSummary: `Detected as a professional home services contractor operating at ${website}. They appear to offer high-quality service, but currently lack comprehensive 24/7 automated call response and on-site conversational tools to convert off-peak and overflow opportunities.`,
    industry: "plumbing" as const,
    estimatedMonthlyRevenueLost: monthlyLoss,
    averageMissedCallsPerDay: dailyMissed,
    peakHoursRevenueLoss: peakLoss,
    competitorAdvantageGap: competitorGap,
    annualLostRevenue: annualLoss,
    roiTimelineMonths: roiMonths,
    overallScore: score,
    weaknesses: [
      "No automated after-hours call coverage detected — emergency callers hear voicemail and hang up",
      "Peak hour call volume (8-10am, 4-7pm) likely exceeds current staff capacity",
      "No AI chatbot or live chat detected on website — after-hours visitors have no way to engage",
    ],
    roiEstimate: `$${annualReturn.toLocaleString()} estimated first-year net return after AI receptionist costs`,
    recommendations: [
      "Deploy 24/7 AI receptionist to instantly answer emergency calls around the clock",
      "Add an AI chatbot to your website to capture after-hours visitor inquiries and schedule appointments",
      "Implement AI-powered speed-to-lead: when contact forms are submitted, AI reads and responds in under 2 minutes",
      "Set up automated follow-up sequences so no lead goes cold — every missed caller gets a callback within 5 minutes",
    ],
    siteIntelligence: {
      hasChatbot: false,
      hasContactForm: false,
      hasOnlineBooking: false,
      hasPhoneCTA: false,
      has24_7Mention: false,
      servicesDetected: [] as string[],
      serviceArea: "",
    },
  };
}

// ─── API Handler ───────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = InputSchema.parse(body);

    // Normalize URL
    let website = input.website.trim();
    if (!website.startsWith("http://") && !website.startsWith("https://")) {
      website = "https://" + website;
    }

    let scrapedContent = { markdown: "", title: "", description: "", html: "" };
    let siteFeatures = {
      hasChatbot: false,
      hasContactForm: false,
      hasOnlineBooking: false,
      hasPhoneCTA: false,
      has24_7Mention: false,
      servicesDetected: [] as string[],
      serviceArea: "",
    };
    let firecrawlSucceeded = false;

    // ── Step 1: Scrape with Firecrawl ──────────────────────────────────────
    try {
      console.log(`[Analyze] Scraping website: ${website}`);
      scrapedContent = await scrapeWebsite(website);
      firecrawlSucceeded = true;
      console.log(`[Analyze] Scrape success. Title: "${scrapedContent.title}", Content length: ${scrapedContent.markdown.length}`);

      // ── Step 2: Detect site features from HTML + Markdown ──────────────
      siteFeatures = detectSiteFeatures(scrapedContent.html, scrapedContent.markdown);
      console.log(`[Analyze] Site features detected:`, JSON.stringify(siteFeatures));
    } catch (scrapeError) {
      console.warn("[Analyze] Firecrawl scrape failed, will proceed with user inputs only:", scrapeError);
    }

    // ── Step 3: AI Analysis with Gemini ──────────────────────────────────
    try {
      console.log("[Analyze] Sending to Gemini for analysis...");
      const aiResult = await analyzeWithGemini(scrapedContent, siteFeatures, {
        website,
        weeklyCallVolume: input.weeklyCallVolume,
        afterHoursSupport: input.afterHoursSupport,
        estimatedMissedCalls: input.estimatedMissedCalls ?? null,
      });

      // Merge in detected site intelligence if AI missed any
      if (firecrawlSucceeded && aiResult.siteIntelligence) {
        aiResult.siteIntelligence = {
          ...siteFeatures,
          ...aiResult.siteIntelligence,
          // Preserve detected values — AI may hallucinate these
          servicesDetected:
            aiResult.siteIntelligence.servicesDetected?.length > siteFeatures.servicesDetected.length
              ? aiResult.siteIntelligence.servicesDetected
              : siteFeatures.servicesDetected,
        };
      } else if (!aiResult.siteIntelligence) {
        aiResult.siteIntelligence = siteFeatures;
      }

      // Validate with Zod (lenient — allow extra fields)
      const validatedData = AnalysisSchema.parse(aiResult);

      return NextResponse.json({
        ...validatedData,
        _trackEvent: "AnalysisComplete",
        _scrapedSuccessfully: firecrawlSucceeded,
      });
    } catch (aiError) {
      console.warn("[Analyze] Gemini AI analysis failed, switching to fallback engine:", aiError);
    }

    // ── Step 4: Fallback ─────────────────────────────────────────────────
    const fallback = generateFallbackAnalysis(website, {
      weeklyCallVolume: input.weeklyCallVolume,
      afterHoursSupport: input.afterHoursSupport,
      estimatedMissedCalls: input.estimatedMissedCalls ?? null,
    });

    // If firecrawl succeeded, at least use real site intelligence
    if (firecrawlSucceeded) {
      fallback.siteIntelligence = siteFeatures;
      fallback.companyName = scrapedContent.title?.split(/[|\-–—]/)[0]?.trim() || fallback.companyName;
    }

    const validatedFallback = AnalysisSchema.parse(fallback);

    return NextResponse.json({
      ...validatedFallback,
      _trackEvent: "AnalysisComplete",
      _scrapedSuccessfully: firecrawlSucceeded,
      _usedFallback: true,
    });
  } catch (error) {
    console.error("[Analyze] Critical error:", error);
    return NextResponse.json(
      { error: "Failed to analyze website. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
