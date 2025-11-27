import { Step1Client } from "./client"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function Step1Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const chart = await prisma.chart.findUnique({
        where: { id },
        select: { centerGoal: true }
    });

    if (!chart) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <Step1Client chartId={id} centerGoal={chart.centerGoal} />
        </div>
    )
}
