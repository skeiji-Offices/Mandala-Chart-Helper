'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { z } from "zod"

const CreateChartSchema = z.object({
    age: z.coerce.number().min(1, "Age is required"),
    currentSituation: z.string().min(1, "Current situation is required"),
    finalGoal: z.string().min(1, "Final goal is required"),
    deadline: z.string().optional(),
})

import { authOptions } from "@/lib/auth"

export async function createChart(prevState: any, formData: FormData) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
        // Return 401 equivalent or redirect
        redirect("/api/auth/signin")
    }

    // Since we have session.user.id from the callback, we can use it directly
    // But to be safe and follow the prompt's request to check DB or use ID:

    // The prompt asked: "Check if session exists... use session.user.id to save"

    const userId = session.user.id;

    // We don't necessarily need to fetch the user again if we trust the session ID, 
    // but fetching ensures the user still exists in DB.
    // Let's keep the fetch for safety but use the ID.

    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        throw new Error("User not found")
    }

    const rawData = {
        age: formData.get("age"),
        currentSituation: formData.get("currentSituation"),
        finalGoal: formData.get("finalGoal"),
        deadline: formData.get("deadline"),
    }

    const validatedFields = CreateChartSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { age, currentSituation, finalGoal, deadline } = validatedFields.data

    const chart = await prisma.chart.create({
        data: {
            userId: user.id,
            centerGoal: finalGoal,
            age: age,
            currentSituation: currentSituation,
            deadline: deadline ? new Date(deadline) : null,
            status: "DRAFT",
        }
    })

    redirect(`/chart/${chart.id}/step1`)
}
