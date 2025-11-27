'use client'

import { useActionState } from "react"
import { createChart } from "./actions"

const initialState = {
    errors: {} as {
        age?: string[];
        currentSituation?: string[];
        finalGoal?: string[];
        deadline?: string[];
    },
}

export default function CreatePage() {
    const [state, formAction] = useActionState(createChart, initialState)

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">目標設定</h1>
                    <p className="mt-2 text-gray-600">まずは中心となる目標を決めましょう。</p>
                </div>

                <form action={formAction} className="space-y-6">
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                            年齢
                        </label>
                        <input
                            type="number"
                            name="age"
                            id="age"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            placeholder="例: 25"
                        />
                        {state?.errors?.age && (
                            <p className="mt-1 text-sm text-red-600">{state.errors.age}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="currentSituation" className="block text-sm font-medium text-gray-700">
                            現状
                        </label>
                        <textarea
                            name="currentSituation"
                            id="currentSituation"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            placeholder="現在の状況や課題を入力してください..."
                        />
                        {state?.errors?.currentSituation && (
                            <p className="mt-1 text-sm text-red-600">{state.errors.currentSituation}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="finalGoal" className="block text-sm font-medium text-gray-700">
                            最終目標（中心核）
                        </label>
                        <input
                            type="text"
                            name="finalGoal"
                            id="finalGoal"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            placeholder="例: ドラフト1位でプロ野球選手になる"
                        />
                        {state?.errors?.finalGoal && (
                            <p className="mt-1 text-sm text-red-600">{state.errors.finalGoal}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                            達成期限
                        </label>
                        <input
                            type="date"
                            name="deadline"
                            id="deadline"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                        {state?.errors?.deadline && (
                            <p className="mt-1 text-sm text-red-600">{state.errors.deadline}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        作成開始
                    </button>
                </form>
            </div>
        </div>
    )
}
