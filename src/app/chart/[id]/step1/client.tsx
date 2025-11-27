'use client'

import { useEffect, useState, useRef } from "react"
import { Loader2, Check, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"

interface Step1ClientProps {
    chartId: string
    centerGoal: string
}

export function Step1Client({ chartId, centerGoal }: Step1ClientProps) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [elements, setElements] = useState<string[]>([])
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editValue, setEditValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const [isGeneratingStep2, setIsGeneratingStep2] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const generateElements = async () => {
            try {
                const res = await fetch("/api/generate/step1", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ chartId }),
                })

                if (!res.ok) {
                    const errorData = await res.json()
                    throw new Error(errorData.error || "Failed to generate elements")
                }

                const data = await res.json()
                if (data.elements && Array.isArray(data.elements)) {
                    setElements(data.elements)
                    // Also save the initial generated elements to DB if not already saved?
                    // The generation API might not save it automatically to subGoals.
                    // Let's ensure we save it.
                    saveElements(data.elements);
                } else {
                    throw new Error("Invalid response format")
                }
            } catch (err) {
                console.error("Generation error:", err)
                setError(err instanceof Error ? err.message : "An unexpected error occurred")
            } finally {
                setLoading(false)
            }
        }

        generateElements()
    }, [chartId])

    useEffect(() => {
        if (editingIndex !== null && inputRef.current) {
            inputRef.current.focus()
        }
    }, [editingIndex])

    const saveElements = async (newElements: string[]) => {
        try {
            await fetch(`/api/chart/${chartId}/subgoals`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subGoals: newElements }),
            })
        } catch (e) {
            console.error("Failed to save elements", e)
        }
    }

    const handleEditStart = (index: number, value: string) => {
        setEditingIndex(index)
        setEditValue(value)
    }

    const handleEditSave = async () => {
        if (editingIndex === null) return

        const newElements = [...elements]
        newElements[editingIndex] = editValue
        setElements(newElements)
        setEditingIndex(null)

        await saveElements(newElements)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleEditSave()
        } else if (e.key === "Escape") {
            setEditingIndex(null)
        }
    }

    const handleNext = async () => {
        if (isGeneratingStep2) return
        setIsGeneratingStep2(true)
        setProgress(0)

        try {
            // 1. Trigger generation
            const res = await fetch("/api/generate/step2", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chartId }),
            })

            if (!res.ok) throw new Error("Failed to start generation")

            // 2. Start polling
            const pollInterval = setInterval(async () => {
                try {
                    const progressRes = await fetch(`/api/chart/${chartId}/progress`)
                    if (progressRes.ok) {
                        const data = await progressRes.json()
                        setProgress(data.percentage)

                        if (data.percentage >= 100) {
                            clearInterval(pollInterval)
                            // Redirect to final chart view
                            router.push(`/chart/${chartId}/final`)
                        }
                    }
                } catch (e) {
                    console.error("Polling error", e)
                }
            }, 2000)

        } catch (e) {
            console.error("Error starting step 2", e)
            setIsGeneratingStep2(false)
            alert("生成の開始に失敗しました")
        }
    }

    if (isGeneratingStep2) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-800">64個のアクションを生成中...</h2>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-blue-600 h-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-gray-600 font-medium">{progress}% 完了</p>
                <p className="text-sm text-gray-500 text-center">
                    AIが各要素に対する具体的な行動目標を考えています。<br />
                    この処理には数分かかる場合があります。
                </p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-lg text-gray-600 font-medium">AIが8つの要素を生成中...</p>
                <p className="text-sm text-gray-500">これには数秒〜1分ほどかかる場合があります</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                    <p className="font-bold">エラーが発生しました</p>
                    <p>{error}</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    再試行
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Final Goal</h1>
                <div className="text-3xl md:text-4xl font-extrabold text-gray-900 bg-white inline-block px-8 py-4 rounded-2xl shadow-sm border border-gray-100">
                    {centerGoal}
                </div>
                <p className="mt-4 text-gray-600">
                    この目標を達成するために必要な8つの要素を編集・確定してください
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {elements.map((element, index) => (
                    <div
                        key={index}
                        className={`
              relative p-6 bg-white border rounded-xl shadow-sm transition-all duration-200
              ${editingIndex === index ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'hover:shadow-md hover:border-blue-300 cursor-pointer group'}
            `}
                        onClick={() => editingIndex !== index && handleEditStart(index, element)}
                    >
                        {editingIndex === index ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleEditSave}
                                onKeyDown={handleKeyDown}
                                className="w-full text-center font-semibold text-lg outline-none bg-transparent"
                            />
                        ) : (
                            <div className="flex items-center justify-center text-center font-semibold text-lg h-full relative">
                                {element}
                                <Pencil className="w-4 h-4 text-gray-400 absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-12 flex flex-col items-center gap-4">
                <button
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                    onClick={handleNext}
                    disabled={isGeneratingStep2}
                >
                    <Check className="w-5 h-5" />
                    64個のアクションを生成して最終確認へ
                </button>
                <p className="text-sm text-yellow-600 font-medium">
                    ※ Step 3（64アクション）に進むと、8つの要素（基礎思考）は修正不可になります。
                </p>
            </div>
        </div>
    )
}
