import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const chart = await prisma.chart.findUnique({
            where: { id },
            select: { actions: true, subGoals: true, userId: true }
        });

        if (!chart) {
            return NextResponse.json({ error: "Chart not found" }, { status: 404 });
        }

        if (chart.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let completedCount = 0;
        let total = 8;

        // If subGoals are not set yet, total is 0 or 8 (default)
        if (chart.subGoals) {
            try {
                const subGoals = JSON.parse(chart.subGoals);
                total = subGoals.length;
            } catch (e) { }
        }

        if (chart.actions) {
            try {
                const actionsMap = JSON.parse(chart.actions);
                completedCount = Object.keys(actionsMap).length;
            } catch (e) { }
        }

        const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        return NextResponse.json({
            total,
            completed: completedCount,
            percentage
        });
    } catch (error) {
        console.error("Failed to fetch progress:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
