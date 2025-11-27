import { FinalChartClient } from "./client"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function FinalChartPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const chart = await prisma.chart.findUnique({
        where: { id },
    });

    if (!chart) {
        notFound();
    }

    const subGoals: string[] = chart.subGoals ? JSON.parse(chart.subGoals) : [];

    // Parse actions and normalize to { title, completed }
    let actions: Record<string, any[]> = {};
    if (chart.actions) {
        try {
            const parsed = JSON.parse(chart.actions);
            // Check if it's string[] or object[]
            // If string[], convert to object
            Object.keys(parsed).forEach(key => {
                actions[key] = parsed[key].map((item: any) => {
                    if (typeof item === 'string') {
                        return { title: item, completed: false };
                    }
                    return item;
                });
            });
        } catch (e) {
            console.error("Failed to parse actions", e);
        }
    }

    return (
        <FinalChartClient
            chartId={id}
            centerGoal={chart.centerGoal}
            subGoals={subGoals}
            initialActions={actions}
        />
    )
}
