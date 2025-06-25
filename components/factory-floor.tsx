"use client"

import { useRef, useEffect } from "react"
import { type Task, TaskType, type AMR } from "@/lib/models"

interface FactoryFloorProps {
  tasks: Task[]
  amr: AMR
  currentTask: Task | null
  solution: Task[]
  simulationStep: number
}

export function FactoryFloor({ tasks, amr, currentTask, solution, simulationStep }: FactoryFloorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw the factory floor
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    const gridSize = 40
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw machines/stations
    tasks.forEach((task) => {
      const x = task.position.x * gridSize
      const y = task.position.y * gridSize

      ctx.fillStyle = "#9ca3af"
      ctx.fillRect(x - 15, y - 15, 30, 30)

      ctx.fillStyle = "#ffffff"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`M${task.id}`, x, y + 4)

      // Draw task type indicator
      let typeColor = "#3b82f6" // Delivery (blue)
      if (task.type === TaskType.PICKUP) {
        typeColor = "#10b981" // Pickup (green)
      } else if (task.type === TaskType.PICKUP_DELIVERY) {
        typeColor = "#8b5cf6" // Pickup+Delivery (purple)
      }

      ctx.fillStyle = typeColor
      ctx.beginPath()
      ctx.arc(x + 15, y - 15, 5, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw solution path
    if (solution.length > 0) {
      ctx.strokeStyle = "#d1d5db"
      ctx.lineWidth = 2
      ctx.beginPath()

      // Start from AMR home position
      ctx.moveTo(50, 50)

      // Draw path through all tasks in solution
      solution.forEach((task, index) => {
        const x = task.position.x * gridSize
        const y = task.position.y * gridSize
        ctx.lineTo(x, y)

        // Highlight completed path
        if (index === simulationStep - 1) {
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.strokeStyle = "#9ca3af"
        }
      })

      ctx.stroke()
    }

    // Draw AMR
    const amrX = amr.position.x * gridSize
    const amrY = amr.position.y * gridSize

    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.arc(amrX, amrY, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#ffffff"
    ctx.font = "10px Arial"
    ctx.textAlign = "center"
    ctx.fillText("AMR", amrX, amrY + 4)
  }, [tasks, amr, solution, simulationStep])

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h2 className="text-lg font-semibold mb-4">Factory Floor</h2>
      <div className="relative">
        <canvas ref={canvasRef} width={600} height={400} className="border rounded bg-gray-50" />
        <div className="absolute top-2 left-2 bg-white/80 p-2 rounded text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Delivery</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
            <span>Pickup+Delivery</span>
          </div>
        </div>
      </div>
    </div>
  )
}
