"use client"

import { Progress } from "@/components/ui/progress"
import type { SchedulingMethod } from "@/components/simulator"

interface MetricsPanelProps {
  currentGeneration: number
  maxGenerations: number
  metrics: {
    makespan: number
    idleDistance: number
    fitness: number
  }
  tasksCount: number
  solutionLength: number
  schedulingMethod: SchedulingMethod
}

export function MetricsPanel({
  currentGeneration,
  maxGenerations,
  metrics,
  tasksCount,
  solutionLength,
  schedulingMethod,
}: MetricsPanelProps) {
  const progress = maxGenerations > 0 ? (currentGeneration / maxGenerations) * 100 : 0

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h2 className="text-lg font-semibold mb-4">
        {schedulingMethod === "ga" ? "Genetic Algorithm Metrics" : "FIFO Metrics"}
      </h2>

      <div className="space-y-4">
        {schedulingMethod === "ga" && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Generation Progress</span>
              <span className="text-sm font-medium">
                {currentGeneration} / {maxGenerations}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md p-3">
            <div className="text-sm text-gray-500 mb-1">Makespan</div>
            <div className="text-xl font-bold">{metrics.makespan.toFixed(2)}</div>
          </div>

          <div className="border rounded-md p-3">
            <div className="text-sm text-gray-500 mb-1">Idle Distance</div>
            <div className="text-xl font-bold">{metrics.idleDistance.toFixed(2)}</div>
          </div>
        </div>

        <div className="border rounded-md p-3">
          <div className="text-sm text-gray-500 mb-1">Fitness Score</div>
          <div className="text-xl font-bold">{metrics.fitness.toFixed(4)}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md p-3">
            <div className="text-sm text-gray-500 mb-1">Total Tasks</div>
            <div className="text-xl font-bold">{tasksCount}</div>
          </div>

          <div className="border rounded-md p-3">
            <div className="text-sm text-gray-500 mb-1">Task Groups</div>
            <div className="text-xl font-bold">{solutionLength}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
