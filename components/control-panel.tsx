"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, SkipForward, Settings, Database, RefreshCw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SchedulingMethod } from "@/components/simulator"

interface ControlPanelProps {
  generateTasks: (count: number) => void
  runAlgorithm: () => void
  simulateSolution: () => void
  stopSimulation: () => void
  setAlgorithmParams: (params: any) => void
  algorithmParams: {
    populationSize: number
    maxGenerations: number
    crossoverRate: number
    mutationRate: number
    makeSpanWeight: number
    idleDistanceWeight: number
  }
  isRunning: boolean
  isSimulating: boolean
  setSimulationSpeed: (speed: number) => void
  simulationSpeed: number
  tasksCount: number
  hasSolution: boolean
  schedulingMethod: SchedulingMethod
  changeSchedulingMethod: (method: SchedulingMethod) => void
  fifoReady: boolean
  gaReady: boolean
}

export function ControlPanel({
  generateTasks,
  runAlgorithm,
  simulateSolution,
  stopSimulation,
  setAlgorithmParams,
  algorithmParams,
  isRunning,
  isSimulating,
  setSimulationSpeed,
  simulationSpeed,
  tasksCount,
  hasSolution,
  schedulingMethod,
  changeSchedulingMethod,
  fifoReady,
  gaReady,
}: ControlPanelProps) {
  const [taskCount, setTaskCount] = useState(10)
  const [showSettings, setShowSettings] = useState(false)
  const [showPerformanceWarning, setShowPerformanceWarning] = useState(false)

  const handleTaskCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = Number.parseInt(e.target.value) || 0
    setTaskCount(count)

    // Show warning if task count is high
    setShowPerformanceWarning(count > 20)
  }

  const handleParamChange = (param: string, value: number) => {
    setAlgorithmParams({
      ...algorithmParams,
      [param]: value,
    })
  }

  // Adjust algorithm parameters based on task count to improve performance
  useEffect(() => {
    if (taskCount > 20) {
      // Reduce population size and generations for better performance with large task counts
      setAlgorithmParams((prev) => ({
        ...prev,
        populationSize: Math.min(prev.populationSize, 30),
        maxGenerations: Math.min(prev.maxGenerations, 50),
      }))
    }
  }, [taskCount, setAlgorithmParams])

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h2 className="text-lg font-semibold mb-4">Control Panel</h2>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="taskCount">Task Count</Label>
            <Input id="taskCount" type="number" min="1" max="30" value={taskCount} onChange={handleTaskCountChange} />
          </div>
          <Button onClick={() => generateTasks(taskCount)} className="mt-6" variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Generate Tasks
          </Button>
        </div>

        {showPerformanceWarning && (
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-600">
              高任務數量可能導致性能問題。GA 參數已自動調整以提高性能。
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          defaultValue="ga"
          value={schedulingMethod}
          onValueChange={(value) => changeSchedulingMethod(value as SchedulingMethod)}
        >
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="fifo">FIFO</TabsTrigger>
            <TabsTrigger value="ga">Genetic Algorithm</TabsTrigger>
          </TabsList>

          <TabsContent value="fifo" className="space-y-4">
            <div className="p-3 border rounded-md bg-gray-50">
              <p className="text-sm text-gray-600">
                First-In-First-Out scheduling executes tasks in the order they were generated, while respecting storage
                slot constraints.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                FIFO solution is automatically calculated when tasks are generated.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="ga" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runAlgorithm} disabled={isRunning || tasksCount === 0} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                {isRunning ? "Running..." : "Run Algorithm"}
              </Button>

              <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="px-3">
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {showSettings && (
              <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                <div>
                  <Label htmlFor="populationSize">Population Size: {algorithmParams.populationSize}</Label>
                  <Slider
                    id="populationSize"
                    min={10}
                    max={100}
                    step={5}
                    value={[algorithmParams.populationSize]}
                    onValueChange={(value) => handleParamChange("populationSize", value[0])}
                  />
                </div>

                <div>
                  <Label htmlFor="maxGenerations">Max Generations: {algorithmParams.maxGenerations}</Label>
                  <Slider
                    id="maxGenerations"
                    min={10}
                    max={200}
                    step={10}
                    value={[algorithmParams.maxGenerations]}
                    onValueChange={(value) => handleParamChange("maxGenerations", value[0])}
                  />
                </div>

                <div>
                  <Label htmlFor="crossoverRate">Crossover Rate: {algorithmParams.crossoverRate}</Label>
                  <Slider
                    id="crossoverRate"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={[algorithmParams.crossoverRate]}
                    onValueChange={(value) => handleParamChange("crossoverRate", value[0])}
                  />
                </div>

                <div>
                  <Label htmlFor="mutationRate">Mutation Rate: {algorithmParams.mutationRate}</Label>
                  <Slider
                    id="mutationRate"
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    value={[algorithmParams.mutationRate]}
                    onValueChange={(value) => handleParamChange("mutationRate", value[0])}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="makeSpanWeight">Makespan Weight</Label>
                    <Input
                      id="makeSpanWeight"
                      type="number"
                      min="0"
                      step="0.1"
                      value={algorithmParams.makeSpanWeight}
                      onChange={(e) => handleParamChange("makeSpanWeight", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="idleDistanceWeight">Idle Distance Weight</Label>
                    <Input
                      id="idleDistanceWeight"
                      type="number"
                      min="0"
                      step="0.1"
                      value={algorithmParams.idleDistanceWeight}
                      onChange={(e) => handleParamChange("idleDistanceWeight", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-2 border-t">
          <h3 className="font-medium mb-2">Simulation Controls</h3>
          <div className="flex gap-2">
            {!isSimulating ? (
              <Button onClick={simulateSolution} disabled={!hasSolution} className="flex-1" variant="secondary">
                <Play className="mr-2 h-4 w-4" />
                Simulate {schedulingMethod.toUpperCase()}
              </Button>
            ) : (
              <Button onClick={stopSimulation} className="flex-1" variant="secondary">
                <Pause className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}

            <Button
              onClick={() => setSimulationSpeed(simulationSpeed < 4 ? simulationSpeed * 2 : 1)}
              variant="outline"
              className="px-3"
              disabled={!isSimulating}
            >
              <SkipForward className="h-4 w-4" />
              <span className="ml-1 text-xs">{simulationSpeed}x</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
