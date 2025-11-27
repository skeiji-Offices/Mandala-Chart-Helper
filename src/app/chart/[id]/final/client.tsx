'use client'

import { useState, useEffect, useRef } from "react"
import { Check, Pencil, Trophy } from "lucide-react"
import confetti from "canvas-confetti"

interface ActionItem {
    title: string
    completed: boolean
}

interface FinalChartClientProps {
    chartId: string
    centerGoal: string
    subGoals: string[]
    initialActions: Record<string, ActionItem[]>
}

export function FinalChartClient({ chartId, centerGoal, subGoals, initialActions }: FinalChartClientProps) {
    const [actions, setActions] = useState<Record<string, ActionItem[]>>(initialActions)
    const [editing, setEditing] = useState<{ subGoalIndex: number, actionIndex: number } | null>(null)
    const [editValue, setEditValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    // Calculate completion
    const totalActions = 64
    const completedActions = Object.values(actions).flat().filter(a => a.completed).length
    const isAllCompleted = completedActions === totalActions && totalActions > 0

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [editing])

    const saveActions = async (newActions: Record<string, ActionItem[]>) => {
        try {
            await fetch(`/api/chart/${chartId}/actions`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actions: newActions }),
            })
        } catch (e) {
            console.error("Failed to save actions", e)
        }
    }

    const toggleComplete = (subGoal: string, index: number) => {
        const newActions = { ...actions }
        if (!newActions[subGoal]) return

        newActions[subGoal][index].completed = !newActions[subGoal][index].completed
        setActions(newActions)
        saveActions(newActions)
    }

    const startEdit = (subGoalIndex: number, actionIndex: number, value: string) => {
        setEditing({ subGoalIndex, actionIndex })
        setEditValue(value)
    }

    const saveEdit = () => {
        if (!editing) return
        const { subGoalIndex, actionIndex } = editing
        const subGoal = subGoals[subGoalIndex]

        const newActions = { ...actions }
        // Initialize if not exists (though it should exist or be padded)
        if (!newActions[subGoal]) {
            newActions[subGoal] = Array(8).fill({ title: "", completed: false })
        }

        if (newActions[subGoal][actionIndex]) {
            newActions[subGoal][actionIndex].title = editValue
            setActions(newActions)
            saveActions(newActions)
        }
        setEditing(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") saveEdit()
        if (e.key === "Escape") setEditing(null)
    }

    // Helper to render a 3x3 grid
    const renderGrid = (centerText: string, items: (ActionItem | string)[], isCenterGrid: boolean, subGoalIndex?: number) => {
        const cells = []
        let itemIndex = 0

        for (let i = 0; i < 9; i++) {
            if (i === 4) {
                // Center cell
                cells.push(
                    <div key="center" className={`
            flex items-center justify-center p-2 text-center font-bold text-sm md:text-base select-none
            ${isCenterGrid ? 'bg-yellow-100 text-yellow-900' : 'bg-blue-100 text-blue-900'}
          `}>
                        {centerText}
                    </div>
                )
            } else {
                const item = items[itemIndex]
                const currentActionIndex = itemIndex // Capture current index for closure
                itemIndex++

                if (isCenterGrid) {
                    // Rendering SubGoals in the center grid
                    cells.push(
                        <div key={i} className="flex items-center justify-center p-1 text-center font-semibold text-xs md:text-sm bg-gray-50 border border-gray-200">
                            {typeof item === 'string' ? item : ''}
                        </div>
                    )
                } else {
                    // Rendering Actions
                    const action = item as ActionItem
                    // Check using index
                    const isEditing = editing?.subGoalIndex === subGoalIndex && editing?.actionIndex === currentActionIndex

                    cells.push(
                        <div
                            key={i}
                            className={`
                relative flex items-center justify-center p-1 text-center text-[10px] md:text-xs border border-gray-100 group
                ${action?.completed ? 'bg-green-50 text-gray-400' : 'bg-white hover:bg-gray-50'}
                cursor-pointer transition-colors
              `}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (subGoalIndex !== undefined && !isEditing) {
                                    console.log(`Starting edit: SubGoal=${subGoalIndex}, Action=${currentActionIndex}`)
                                    startEdit(subGoalIndex, currentActionIndex, action.title)
                                }
                            }}
                        >
                            {isEditing ? (
                                <input
                                    ref={inputRef}
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onBlur={saveEdit}
                                    onKeyDown={handleKeyDown}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full h-full text-center bg-transparent outline-none"
                                />
                            ) : (
                                <>
                                    <span className={action?.completed ? 'line-through decoration-gray-400' : ''}>
                                        {action?.title}
                                    </span>
                                    {subGoalIndex !== undefined && (
                                        <div
                                            className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                const subGoalKey = subGoals[subGoalIndex]
                                                if (subGoalKey) {
                                                    console.log(`Toggling complete: SubGoal=${subGoalKey}, Action=${currentActionIndex}`)
                                                    toggleComplete(subGoalKey, currentActionIndex)
                                                }
                                            }}
                                        >
                                            <div className={`w-3 h-3 rounded-full border ${action?.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`} />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )
                }
            }
        }
        return (
            <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full bg-gray-300 border border-gray-300">
                {cells}
            </div>
        )
    }

    // Layout the 9x9 grid
    // The layout of the 9 big grids follows the same pattern as the cells
    // 0(NW) 1(N) 2(NE)
    // 3(W)  C    4(E)
    // 5(SW) 6(S) 7(SE)

    // subGoals are usually ordered 0-7. Let's map them to positions.
    // We need to match the visual position of the subGoal in the center grid to the position of the big grid.
    // If subGoals[0] is at position 0 (NW) in the center grid, then the big grid at NW should contain actions for subGoals[0].

    const gridPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8] // 0-8 indices of the 3x3 big grid
    // 4 is Center

    // Map big grid index to subGoal index
    // 0->0, 1->1, 2->2, 3->3, 4->Center, 5->4, 6->5, 7->6, 8->7
    // Wait, my loop above for cells was:
    // 0, 1, 2, 3, (4=Center), 5, 6, 7, 8
    // So items indices were:
    // 0->0, 1->1, 2->2, 3->3, 4->SKIP, 5->4, 6->5, 7->6, 8->7

    // So for the big grid:
    // Grid 0 (NW) -> SubGoal 0
    // Grid 1 (N)  -> SubGoal 1
    // Grid 2 (NE) -> SubGoal 2
    // Grid 3 (W)  -> SubGoal 3
    // Grid 4 (C)  -> MAIN CENTER GRID
    // Grid 5 (E)  -> SubGoal 4
    // Grid 6 (SW) -> SubGoal 5
    // Grid 7 (S)  -> SubGoal 6
    // Grid 8 (SE) -> SubGoal 7

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 py-8 px-2">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{centerGoal}</h1>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span>達成度: {Math.round((completedActions / totalActions) * 100)}%</span>
                    <span>({completedActions}/{totalActions})</span>
                </div>
                {isAllCompleted && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-yellow-600 font-bold animate-bounce">
                        <Trophy className="w-6 h-6" />
                        <span>コンプリート！おめでとうございます！</span>
                        <Trophy className="w-6 h-6" />
                    </div>
                )}
            </div>

            <div className="aspect-square w-full max-w-[1000px] bg-white shadow-xl rounded-xl overflow-hidden border-4 border-gray-800">
                <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full bg-gray-800 p-1">
                    {gridPositions.map(pos => {
                        if (pos === 4) {
                            // Center Grid
                            return (
                                <div key="center-grid" className="w-full h-full">
                                    {renderGrid(centerGoal, subGoals, true)}
                                </div>
                            )
                        } else {
                            // Outer Grids
                            // Calculate subGoal index
                            const subGoalIndex = pos < 4 ? pos : pos - 1
                            const subGoal = subGoals[subGoalIndex]
                            const subGoalActions = actions[subGoal] || []

                            // Pad actions if missing
                            const displayActions = [...subGoalActions]
                            while (displayActions.length < 8) {
                                displayActions.push({ title: "", completed: false })
                            }

                            return (
                                <div key={pos} className="w-full h-full">
                                    {renderGrid(subGoal, displayActions, false, subGoalIndex)}
                                </div>
                            )
                        }
                    })}
                </div>
            </div>

            <div className="mt-8 text-center text-gray-500 text-xs">
                <p>マスをクリックして編集、右上の丸をクリックして完了チェック</p>
            </div>
        </div>
    )
}
