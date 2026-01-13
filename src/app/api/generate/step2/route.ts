import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { chartId } = body;

    if (!chartId) {
        return NextResponse.json({ error: "chartId is required" }, { status: 400 });
    }

    // Verify ownership
    const chart = await prisma.chart.findUnique({
        where: { id: chartId },
    });

    if (!chart) {
        return NextResponse.json({ error: "Chart not found" }, { status: 404 });
    }

    if (chart.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Start background processing
    // Note: In a real serverless environment (like Vercel), this background promise might be killed.
    // However, for a persistent server (like this dev environment or a VPS), this works.
    // For Vercel, we would need Inngest, QStash, or similar.
    generateStep2Background(chartId, chart.subGoals, session.user.id);

    return NextResponse.json({ message: "Generation started" }, { status: 202 });
}

async function generateStep2Background(chartId: string, subGoalsJson: string | null, userId: string) {
    try {
        if (!subGoalsJson) return;
        const subGoals: string[] = JSON.parse(subGoalsJson);

        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("API Key missing for background job");
            return;
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Initialize actions object
        let actionsMap: Record<string, string[]> = {};

        // Try to load existing actions if any (to resume?) - for now let's start fresh or merge
        const currentChart = await prisma.chart.findUnique({ where: { id: chartId } });
        if (currentChart?.actions) {
            try {
                actionsMap = JSON.parse(currentChart.actions);
            } catch (e) {
                // ignore
            }
        }

        for (let i = 0; i < subGoals.length; i++) {
            const subGoal = subGoals[i];
            // Skip if already generated (optional optimization)
            if (actionsMap[subGoal] && actionsMap[subGoal].length === 8) continue;

            // Simple sanitization
            const safeSubGoal = subGoal.replace(/["\\]/g, '\\$&').replace(/\n/g, " ");

            const prompt = `
        あなたはマンダラチャート作成のアシスタントです。
        ユーザーの目標達成のために、サブゴール「${safeSubGoal}」を達成するための具体的な行動目標（アクション）を8つ提案してください。
        
        ## 制約事項
        - **必ず日本語で出力してください。**
        - **JSON形式のみ**を出力してください。
        - 各アクションは20文字以内の短いフレーズにしてください。
        - 具体的な行動（例: 毎日〇〇する、〇〇を読む）にしてください。
        
        ## 出力フォーマット
        {
          "actions": ["アクション1", "アクション2", "アクション3", "アクション4", "アクション5", "アクション6", "アクション7", "アクション8"]
        }
      `;

            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                const data = JSON.parse(cleanedText);

                if (data.actions && Array.isArray(data.actions)) {
                    actionsMap[subGoal] = data.actions.slice(0, 8);
                    console.log(`[Step2] Generated ${actionsMap[subGoal].length} actions for "${subGoal}"`);

                    // Update DB incrementally
                    await prisma.chart.update({
                        where: { id: chartId },
                        data: { actions: JSON.stringify(actionsMap) }
                    });
                } else {
                    console.error(`[Step2] Invalid data format for "${subGoal}":`, data);
                }
            } catch (error) {
                console.error(`Failed to generate actions for ${subGoal}:`, error);
                // Continue to next subgoal even if one fails
            }

            // Small delay to avoid rate limits if necessary
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error("Background generation failed:", error);
    } finally {
        // Final verification log
        try {
            const finalChart = await prisma.chart.findUnique({ where: { id: chartId } });
            if (finalChart?.actions) {
                const actionsMap = JSON.parse(finalChart.actions);
                const totalActions = Object.values(actionsMap).flat().length;
                console.log(`[Step2] Final verification: Saved ${totalActions} actions to Chart.actions (JSON).`);

                if (totalActions === 64) {
                    console.log("[Step2] SUCCESS: 64 records created in Action data.");
                    await prisma.chart.update({
                        where: { id: chartId },
                        data: { status: "COMPLETED" }
                    });
                } else {
                    console.error(`[Step2] WARNING: Expected 64 actions, but found ${totalActions}.`);
                }
            } else {
                console.error("[Step2] CRITICAL: No actions saved to DB.");
                await prisma.chart.update({
                    where: { id: chartId },
                    data: { status: "FAILED_SAVE" }
                });
            }
        } catch (e) {
            console.error("[Step2] Verification failed:", e);
        }
    }
}
