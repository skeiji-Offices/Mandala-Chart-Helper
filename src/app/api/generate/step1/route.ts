import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";



import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const startTime = Date.now();
    console.log(`[Step1] Start generation at ${new Date().toISOString()}`);

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            console.log("[Step1] Unauthorized access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(e => {
            throw new Error("Failed to parse request body: " + e.message);
        });
        const { chartId } = body;

        if (!chartId) {
            throw new Error("chartId is required");
        }

        const chart = await prisma.chart.findUnique({
            where: { id: chartId },
        });

        if (!chart) {
            console.log(`[Step1] Chart not found: ${chartId}`);
            return NextResponse.json({ error: "Chart not found" }, { status: 404 });
        }

        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_API_KEY or GEMINI_API_KEY environment variable is not set");
        }
        const genAI = new GoogleGenerativeAI(apiKey);

        // User requested gemini-2.5-flash
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = `
    あなたはマンダラチャート作成のアシスタントです。
    ユーザーの「中心目標」と「現状」を元に、目標達成に必要な「8つの基礎要素」を提案してください。
    
    ## ユーザー情報
    - 年齢: ${chart.age}
    - 現状: ${chart.currentSituation}
    - 中心目標: ${chart.centerGoal}
    
    ## 制約事項
    - **必ず日本語で出力してください。**
    - **JSON形式のみ**を出力してください。
    - 8つの要素は、具体的かつバランスの取れたものにしてください。
    - 各要素は20文字以内の短いフレーズにしてください。
    
    ## 出力フォーマット
    {
      "elements": ["要素1", "要素2", "要素3", "要素4", "要素5", "要素6", "要素7", "要素8"]
    }
  `;

        console.log("[Step1] Sending request to Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("[Step1] Raw response from Gemini:", text);

        // Clean up potential markdown code blocks if they still exist
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        let data;
        try {
            data = JSON.parse(cleanedText);
        } catch (e) {
            console.error("[Step1] JSON Parse Error:", e);
            console.error("[Step1] Text causing error:", cleanedText);
            throw new Error("Failed to parse Gemini response as JSON");
        }

        const duration = Date.now() - startTime;
        console.log(`[Step1] Generation completed in ${duration}ms`);

        return NextResponse.json(data);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error("CRITICAL API CRASH:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error),
            duration: `${duration}ms`
        }, { status: 500 });
    }
}
