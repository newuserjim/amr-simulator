"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { GenerationLog } from "@/lib/data-logger"

interface GAConvergenceChartProps {
  generationLogs: GenerationLog[]
  maxGenerations: number
}

export function GAConvergenceChart({ generationLogs, maxGenerations }: GAConvergenceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || generationLogs.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up chart dimensions
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    // Find min and max values for scaling
    const minFitness = Math.min(...generationLogs.map((log) => log.bestFitness))
    const maxFitness = Math.max(...generationLogs.map((log) => log.bestFitness))
    const range = maxFitness - minFitness
    const paddedMin = minFitness - range * 0.05
    const paddedMax = maxFitness + range * 0.05

    // Draw axes
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.lineTo(canvas.width - padding, canvas.height - padding)
    ctx.stroke()

    // Draw y-axis labels
    ctx.fillStyle = "#000"
    ctx.font = "10px Arial"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    for (let i = 0; i <= 5; i++) {
      const y = canvas.height - padding - (i * chartHeight) / 5
      const value = paddedMin + ((paddedMax - paddedMin) * i) / 5
      ctx.fillText(value.toFixed(2), padding - 5, y)

      // Draw horizontal grid line
      ctx.strokeStyle = "#e5e7eb"
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(canvas.width - padding, y)
      ctx.stroke()
    }

    // Draw x-axis labels
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    const xStep = Math.max(1, Math.floor(maxGenerations / 10))
    for (let i = 0; i <= maxGenerations; i += xStep) {
      const x = padding + (i / maxGenerations) * chartWidth
      ctx.fillText(i.toString(), x, canvas.height - padding + 5)

      // Draw vertical grid line
      ctx.strokeStyle = "#e5e7eb"
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, canvas.height - padding)
      ctx.stroke()
    }

    // Draw fitness line
    ctx.strokeStyle = "#8b5cf6" // Purple for fitness
    ctx.lineWidth = 2
    ctx.beginPath()

    generationLogs.forEach((log, index) => {
      const x = padding + (log.generation / maxGenerations) * chartWidth
      const y = canvas.height - padding - ((log.bestFitness - paddedMin) / (paddedMax - paddedMin)) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw makespan line
    const maxMakespan = Math.max(...generationLogs.map((log) => log.makespan))
    const minMakespan = Math.min(...generationLogs.map((log) => log.makespan))
    const makespanRange = maxMakespan - minMakespan

    ctx.strokeStyle = "#3b82f6" // Blue for makespan
    ctx.lineWidth = 1.5
    ctx.beginPath()

    generationLogs.forEach((log, index) => {
      const x = padding + (log.generation / maxGenerations) * chartWidth
      const normalizedMakespan = (log.makespan - minMakespan) / makespanRange
      const y = canvas.height - padding - normalizedMakespan * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw idle distance line
    const maxIdleDistance = Math.max(...generationLogs.map((log) => log.idleDistance))
    const minIdleDistance = Math.min(...generationLogs.map((log) => log.idleDistance))
    const idleDistanceRange = maxIdleDistance - minIdleDistance

    ctx.strokeStyle = "#10b981" // Green for idle distance
    ctx.lineWidth = 1.5
    ctx.beginPath()

    generationLogs.forEach((log, index) => {
      const x = padding + (log.generation / maxGenerations) * chartWidth
      const normalizedIdleDistance = (log.idleDistance - minIdleDistance) / idleDistanceRange
      const y = canvas.height - padding - normalizedIdleDistance * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw standard deviation line if available
    if (generationLogs.some((log) => log.standardDeviation !== undefined)) {
      const maxStdDev = Math.max(...generationLogs.map((log) => log.standardDeviation || 0))
      const minStdDev = Math.min(...generationLogs.map((log) => log.standardDeviation || 0))
      const stdDevRange = maxStdDev - minStdDev || 1

      ctx.strokeStyle = "#f59e0b" // Amber for standard deviation
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 3]) // Dashed line
      ctx.beginPath()

      generationLogs.forEach((log, index) => {
        if (log.standardDeviation !== undefined) {
          const x = padding + (log.generation / maxGenerations) * chartWidth
          const normalizedStdDev = (log.standardDeviation - minStdDev) / stdDevRange
          const y = canvas.height - padding - normalizedStdDev * chartHeight * 0.5 // Scale to half height

          if (index === 0 || generationLogs[index - 1].standardDeviation === undefined) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
      })
      ctx.stroke()
      ctx.setLineDash([]) // Reset to solid line
    }

    // Draw legend
    const legendX = padding + 10
    const legendY = padding + 20
    const legendSpacing = 20

    // Fitness
    ctx.strokeStyle = "#8b5cf6"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(legendX, legendY)
    ctx.lineTo(legendX + 20, legendY)
    ctx.stroke()
    ctx.fillStyle = "#000"
    ctx.textAlign = "left"
    ctx.fillText("Fitness", legendX + 25, legendY + 4)

    // Makespan
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(legendX, legendY + legendSpacing)
    ctx.lineTo(legendX + 20, legendY + legendSpacing)
    ctx.stroke()
    ctx.fillText("Makespan (normalized)", legendX + 25, legendY + legendSpacing + 4)

    // Idle Distance
    ctx.strokeStyle = "#10b981"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(legendX, legendY + legendSpacing * 2)
    ctx.lineTo(legendX + 20, legendY + legendSpacing * 2)
    ctx.stroke()
    ctx.fillText("Idle Distance (normalized)", legendX + 25, legendY + legendSpacing * 2 + 4)

    // Standard Deviation
    if (generationLogs.some((log) => log.standardDeviation !== undefined)) {
      ctx.strokeStyle = "#f59e0b"
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(legendX, legendY + legendSpacing * 3)
      ctx.lineTo(legendX + 20, legendY + legendSpacing * 3)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillText("Standard Deviation", legendX + 25, legendY + legendSpacing * 3 + 4)
    }

    // Draw points for the first and last generation
    if (generationLogs.length > 0) {
      const first = generationLogs[0]
      const last = generationLogs[generationLogs.length - 1]

      // First generation point
      const firstX = padding + (first.generation / maxGenerations) * chartWidth
      const firstY = canvas.height - padding - ((first.bestFitness - paddedMin) / (paddedMax - paddedMin)) * chartHeight
      ctx.fillStyle = "#8b5cf6"
      ctx.beginPath()
      ctx.arc(firstX, firstY, 4, 0, Math.PI * 2)
      ctx.fill()

      // Last generation point
      const lastX = padding + (last.generation / maxGenerations) * chartWidth
      const lastY = canvas.height - padding - ((last.bestFitness - paddedMin) / (paddedMax - paddedMin)) * chartHeight
      ctx.fillStyle = "#8b5cf6"
      ctx.beginPath()
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [generationLogs, maxGenerations])

  // Calculate improvement metrics
  const calculateImprovementMetrics = () => {
    if (generationLogs.length < 2) return null

    const first = generationLogs[0]
    const last = generationLogs[generationLogs.length - 1]

    const fitnessImprovement = ((first.bestFitness - last.bestFitness) / first.bestFitness) * 100
    const makespanImprovement = ((first.makespan - last.makespan) / first.makespan) * 100
    const idleDistanceImprovement = ((first.idleDistance - last.idleDistance) / first.idleDistance) * 100

    return {
      fitnessImprovement,
      makespanImprovement,
      idleDistanceImprovement,
      generations: last.generation,
      initialFitness: first.bestFitness,
      finalFitness: last.bestFitness,
      initialMakespan: first.makespan,
      finalMakespan: last.makespan,
      initialIdleDistance: first.idleDistance,
      finalIdleDistance: last.idleDistance,
    }
  }

  const improvementMetrics = calculateImprovementMetrics()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Genetic Algorithm Convergence</CardTitle>
        <CardDescription>
          Tracking fitness, makespan, and idle distance across {generationLogs.length} generations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <canvas ref={canvasRef} width={600} height={300} className="w-full" />
        </div>

        {improvementMetrics && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Fitness Improvement</div>
              <div className="text-xl font-bold text-purple-600">
                {improvementMetrics.fitnessImprovement.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500">
                {improvementMetrics.initialFitness.toFixed(2)} → {improvementMetrics.finalFitness.toFixed(2)}
              </div>
            </div>

            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Makespan Improvement</div>
              <div className="text-xl font-bold text-blue-600">
                {improvementMetrics.makespanImprovement.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500">
                {improvementMetrics.initialMakespan.toFixed(2)} → {improvementMetrics.finalMakespan.toFixed(2)}
              </div>
            </div>

            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Idle Distance Improvement</div>
              <div className="text-xl font-bold text-green-600">
                {improvementMetrics.idleDistanceImprovement.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500">
                {improvementMetrics.initialIdleDistance.toFixed(2)} → {improvementMetrics.finalIdleDistance.toFixed(2)}
              </div>
            </div>

            <div className="border rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Convergence</div>
              <div className="text-xl font-bold">{improvementMetrics.generations} generations</div>
              <div className="text-xs text-gray-500">
                {(improvementMetrics.fitnessImprovement / improvementMetrics.generations).toFixed(4)}% per generation
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
