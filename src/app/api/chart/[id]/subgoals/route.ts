import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { subGoals } = body;

        if (!Array.isArray(subGoals) || subGoals.length !== 8) {
            return NextResponse.json(
                { error: "Invalid subGoals format. Must be an array of 8 strings." },
                { status: 400 }
            );
        }

        // Verify ownership
        const chart = await prisma.chart.findUnique({
            where: { id },
        });

        if (!chart) {
            return NextResponse.json({ error: "Chart not found" }, { status: 404 });
        }

        if (chart.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedChart = await prisma.chart.update({
            where: { id },
            data: {
                subGoals: JSON.stringify(subGoals),
            },
        });

        return NextResponse.json({ success: true, subGoals: JSON.parse(updatedChart.subGoals || "[]") });
    } catch (error) {
        console.error("Failed to update subGoals:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
