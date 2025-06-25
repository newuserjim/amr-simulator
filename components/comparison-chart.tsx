"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ComparisonChartProps {
  fifoMetrics: {
    makespan: number
    idleDistance: number
    fitness: number
  }
  gaMetrics: {
    makespan: number
    idleDistance: number
    fitness: number
  }
  fifoSolutionLength: number
  gaSolutionLength: number
}

export function ComparisonChart({
  fifoMetrics,
  gaMetrics,
  fifoSolutionLength,
  gaSolutionLength,
}: ComparisonChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up chart dimensions
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2
    const barWidth = chartWidth / 6 // 3 metrics, 2 algorithms

    // Calculate max value for scaling
    const maxValue =
      Math.max(
        fifoMetrics.makespan,
        gaMetrics.makespan,
        fifoMetrics.idleDistance,
        gaMetrics.idleDistance,
        fifoMetrics.fitness,
        gaMetrics.fitness,
      ) * 1.1 // Add 10% padding

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
      const value = ((maxValue * i) / 5).toFixed(1)
      ctx.fillText(value, padding - 5, y)

      // Draw horizontal grid line
      ctx.strokeStyle = "#e5e7eb"
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(canvas.width - padding, y)
      ctx.stroke()
    }

    // Draw bars and labels
    const drawBar = (index: number, value: number, label: string, color: string) => {
      const x = padding + index * barWidth + barWidth / 4
      const barHeight = (value / maxValue) * chartHeight
      const y = canvas.height - padding - barHeight

      // Draw bar
      ctx.fillStyle = color
      ctx.fillRect(x, y, barWidth / 2, barHeight)

      // Draw value on top of bar
      ctx.fillStyle = "#000"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.fillText(value.toFixed(1), x + barWidth / 4, y - 2)

      // Draw label below x-axis
      ctx.textBaseline = "top"
      ctx.fillText(label, x + barWidth / 4, canvas.height - padding + 5)
    }

    // Draw FIFO bars
    drawBar(0, fifoMetrics.makespan, "FIFO", "#3b82f6")
    drawBar(1, gaMetrics.makespan, "GA", "#8b5cf6")

    drawBar(2, fifoMetrics.idleDistance, "FIFO", "#3b82f6")
    drawBar(3, gaMetrics.idleDistance, "GA", "#8b5cf6")

    drawBar(4, fifoMetrics.fitness, "FIFO", "#3b82f6")
    drawBar(5, gaMetrics.fitness, "GA", "#8b5cf6")

    // Draw metric labels
    ctx.textAlign = "center"
    ctx.font = "12px Arial"
    ctx.fillText("Makespan", padding + barWidth, canvas.height - padding + 20)
    ctx.fillText("Idle Distance", padding + barWidth * 3, canvas.height - padding + 20)
    ctx.fillText("Fitness", padding + barWidth * 5, canvas.height - padding + 20)
  }, [fifoMetrics, gaMetrics])

  // Calculate improvement percentages
  const makespanImprovement = (((fifoMetrics.makespan - gaMetrics.makespan) / fifoMetrics.makespan) * 100).toFixed(1)
  const idleDistanceImprovement = (
    ((fifoMetrics.idleDistance - gaMetrics.idleDistance) / fifoMetrics.idleDistance) *
    100
  ).toFixed(1)
  const fitnessImprovement = (((fifoMetrics.fitness - gaMetrics.fitness) / fifoMetrics.fitness) * 100).toFixed(1)
  const taskGroupsReduction = (((fifoSolutionLength - gaSolutionLength) / fifoSolutionLength) * 100).toFixed(1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>FIFO vs Genetic Algorithm Comparison</CardTitle>
        <CardDescription>Performance comparison between scheduling methods</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <canvas ref={canvasRef} width={600} height={300} className="w-full" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="border rounded-md p-3">
            <div className="text-sm text-gray-500 mb-1">Makespan Improvement</div>
            <div className="text-xl font-bold text-green-600">{makespanImprovement}%</div>
          </div>

          <div className="border rounded-md p-3">
            <div className="text-sm text-gray-500 mb-1">Idle Distance Improvement</div>
            <div className="text-xl font-bold text-green-600">{idleDistanceImprovement}%</div>
          </div>

          <div className="border rounded-md p-3">
            <div className="text-sm text-gray-500 mb-1">Fitness Improvement</div>
            <div className="text-xl font-bold text-green-600">{fitnessImprovement}%</div>
          </div>

          <div className="border rounded-md p-3">
            <div className="text-sm text-gray-500 mb-1">Task Groups Reduction</div>
            <div className="text-xl font-bold text-green-600">{taskGroupsReduction}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
