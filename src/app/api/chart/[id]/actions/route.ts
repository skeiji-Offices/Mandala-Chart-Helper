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
        const { actions } = body;

        // actions should be Record<string, { title: string, completed: boolean }[]>
        // or just the full JSON object to replace.

        if (!actions || typeof actions !== 'object') {
            return NextResponse.json(
                { error: "Invalid actions format." },
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
                actions: JSON.stringify(actions),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update actions:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
