"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { GeneticAlgorithm } from "@/lib/genetic-algorithm"
import { FIFOScheduler } from "@/lib/fifo-scheduler"
import { type Task, AMR } from "@/lib/models"
import { FactoryFloor } from "@/components/factory-floor"
import { ControlPanel } from "@/components/control-panel"
import { MetricsPanel } from "@/components/metrics-panel"
import { StorageSlots } from "@/components/storage-slots"
import { generateRandomTasks } from "@/lib/task-generator"
import { ComparisonChart } from "@/components/comparison-chart"
import type { SimulationLog, AlgorithmLog, GenerationLog } from "@/lib/data-logger"
import { ExportPanel } from "@/components/export-panel"
import { TaskExecutionPanel } from "@/components/task-execution-panel"
import { GAConvergenceChart } from "@/components/ga-convergence-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createDataLogger } from "@/lib/create-data-logger"

export type SchedulingMethod = "fifo" | "ga"

export function Simulator() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [amr, setAmr] = useState<AMR>(new AMR())
  const [bestSolution, setBestSolution] = useState<Task[]>([])
  const [fifoSolution, setFifoSolution] = useState<Task[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentGeneration, setCurrentGeneration] = useState(0)
  const [schedulingMethod, setSchedulingMethod] = useState<SchedulingMethod>("ga")
  const [algorithmParams, setAlgorithmParams] = useState({
    populationSize: 50,
    maxGenerations: 100,
    crossoverRate: 0.8,
    mutationRate: 0.01,
    makeSpanWeight: 1,
    idleDistanceWeight: 1,
  })
  const [metrics, setMetrics] = useState({
    makespan: 0,
    idleDistance: 0,
    fitness: 0,
  })
  const [fifoMetrics, setFifoMetrics] = useState({
    makespan: 0,
    idleDistance: 0,
    fitness: 0,
  })
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [simulationStep, setSimulationStep] = useState(0)
  const [activeSolution, setActiveSolution] = useState<Task[]>([])

  // Data logging states
  const [dataLogger] = useState(() => createDataLogger())
  const [simulationLogs, setSimulationLogs] = useState<SimulationLog[]>([])
  const [algorithmLogs, setAlgorithmLogs] = useState<AlgorithmLog[]>([])
  const [generationLogs, setGenerationLogs] = useState<GenerationLog[]>([])
  const [currentSimulationId, setCurrentSimulationId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("simulation")

  // Generate random tasks with performance optimization
  const generateTasks = useCallback(
    (count: number) => {
      // Limit task count to prevent performance issues
      const safeCount = Math.min(count, 30)

      // Use setTimeout to avoid blocking the UI
      setTimeout(() => {
        const newTasks = generateRandomTasks(safeCount)
        setTasks(newTasks)
        setBestSolution([])
        setFifoSolution([])
        setActiveSolution([])
        setCurrentGeneration(0)
        setMetrics({ makespan: 0, idleDistance: 0, fitness: 0 })
        setFifoMetrics({ makespan: 0, idleDistance: 0, fitness: 0 })
        setSimulationStep(0)
        setAmr(new AMR())
        setGenerationLogs([])

        // Clear previous logs and start new session
        setSimulationLogs([])
        setAlgorithmLogs([])
        const sessionId = dataLogger.startNewSession(newTasks, algorithmParams)
        setCurrentSimulationId(sessionId)

        // Automatically run FIFO scheduler when tasks are generated
        runFIFOScheduler(newTasks, sessionId)
      }, 0)
    },
    [algorithmParams, dataLogger],
  )

  // Run FIFO scheduler
  const runFIFOScheduler = useCallback(
    (taskList: Task[], sessionId: string) => {
      const startTime = Date.now()
      const fifoScheduler = new FIFOScheduler({ tasks: taskList })
      const solution = fifoScheduler.schedule()
      const { makespan, idleDistance } = fifoScheduler.calculateMetrics(solution)
      const fitness = makespan + idleDistance
      const executionTime = Date.now() - startTime

      setFifoSolution(solution)
      setFifoMetrics({
        makespan,
        idleDistance,
        fitness,
      })

      // Log FIFO algorithm results
      dataLogger.logAlgorithmResult(sessionId, "FIFO", {
        solution,
        makespan,
        idleDistance,
        fitness,
        generations: 1,
        executionTime,
      })

      if (schedulingMethod === "fifo") {
        setActiveSolution(solution)
      }
    },
    [dataLogger, schedulingMethod],
  )

  // Run genetic algorithm with performance optimizations
  const runAlgorithm = useCallback(() => {
    if (tasks.length === 0) return

    setIsRunning(true)
    setGenerationLogs([]) // Clear previous generation logs
    const startTime = Date.now()

    // Adjust algorithm parameters based on task count
    let adjustedParams = { ...algorithmParams }
    if (tasks.length > 20) {
      adjustedParams = {
        ...adjustedParams,
        populationSize: Math.min(adjustedParams.populationSize, 30),
        maxGenerations: Math.min(adjustedParams.maxGenerations, 50),
      }
    }

    const ga = new GeneticAlgorithm({
      tasks,
      ...adjustedParams,
      onGenerationComplete: (generation, best, fitness, makespan, idleDistance, stats) => {
        setCurrentGeneration(generation)
        setBestSolution([...best])
        setMetrics({
          makespan,
          idleDistance,
          fitness,
        })

        // Create generation log with additional statistics
        const generationLog: GenerationLog = {
          generation,
          bestFitness: fitness,
          makespan,
          idleDistance,
          solution: [...best],
          timestamp: new Date(),
          averageFitness: stats?.averageFitness,
          worstFitness: stats?.worstFitness,
          standardDeviation: stats?.standardDeviation,
        }

        // Update local state for real-time display
        setGenerationLogs((prev) => [...prev, generationLog])

        // Log generation data
        dataLogger.logGeneration(currentSimulationId, generationLog)

        if (schedulingMethod === "ga") {
          setActiveSolution([...best])
        }
      },
      onComplete: () => {
        setIsRunning(false)
        const executionTime = Date.now() - startTime

        // Log final GA results
        dataLogger.logAlgorithmResult(currentSimulationId, "GA", {
          solution: bestSolution,
          makespan: metrics.makespan,
          idleDistance: metrics.idleDistance,
          fitness: metrics.fitness,
          generations: currentGeneration,
          executionTime,
        })

        // Switch to convergence tab to show results
        setActiveTab("convergence")
      },
    })
    ga.run()
  }, [
    tasks,
    algorithmParams,
    currentSimulationId,
    dataLogger,
    schedulingMethod,
    bestSolution,
    metrics,
    currentGeneration,
  ])

  // Change scheduling method
  const changeSchedulingMethod = useCallback(
    (method: SchedulingMethod) => {
      setSchedulingMethod(method)

      if (method === "fifo") {
        setActiveSolution(fifoSolution)
      } else {
        setActiveSolution(bestSolution)
      }

      // Reset simulation
      setSimulationStep(0)
      setAmr(new AMR())
      setIsSimulating(false)
    },
    [fifoSolution, bestSolution],
  )

  // Simulate the execution of the active solution
  const simulateSolution = useCallback(() => {
    if (activeSolution.length === 0) return

    setIsSimulating(true)
    setSimulationStep(0)
    setAmr(new AMR())

    // Start simulation logging
    dataLogger.startSimulation(currentSimulationId, schedulingMethod, activeSolution)
  }, [activeSolution, currentSimulationId, dataLogger, schedulingMethod])

  // Step through the simulation
  useEffect(() => {
    if (!isSimulating || simulationStep >= activeSolution.length) return

    const timer = setTimeout(() => {
      const currentTask = activeSolution[simulationStep]
      const previousAmr = new AMR({ ...amr })
      const taskStartTime = new Date()

      // Update AMR state based on current task
      const updatedAmr = new AMR({ ...amr })
      updatedAmr.executeTask(currentTask)

      const taskEndTime = new Date()
      const distanceTraveled = Math.sqrt(
        Math.pow(updatedAmr.position.x - previousAmr.position.x, 2) +
          Math.pow(updatedAmr.position.y - previousAmr.position.y, 2),
      )

      // Log individual task execution
      dataLogger.logTaskExecution(
        currentSimulationId,
        currentTask,
        simulationStep + 1,
        {
          position: previousAmr.position,
          storageSlots: previousAmr.storageSlots,
        },
        {
          position: updatedAmr.position,
          storageSlots: updatedAmr.storageSlots,
        },
        {
          startTime: taskStartTime,
          endTime: taskEndTime,
          distanceTraveled,
          waitTime: 0, // Simplified for this simulation
          isSuccessful: true,
          method: schedulingMethod,
        },
      )

      // Log simulation step
      dataLogger.logSimulationStep(currentSimulationId, simulationStep, {
        taskId: currentTask.id,
        taskType: currentTask.type,
        amrPosition: { ...updatedAmr.position },
        storageSlots: updatedAmr.storageSlots.map((slot) => ({ ...slot })),
        distanceTraveled,
        timestamp: new Date(),
      })

      setAmr(updatedAmr)
      setSimulationStep(simulationStep + 1)

      if (simulationStep + 1 >= activeSolution.length) {
        setIsSimulating(false)
        // Complete simulation logging
        dataLogger.completeSimulation(currentSimulationId)
      }
    }, 1000 / simulationSpeed)

    return () => clearTimeout(timer)
  }, [
    isSimulating,
    simulationStep,
    activeSolution,
    amr,
    simulationSpeed,
    currentSimulationId,
    dataLogger,
    schedulingMethod,
  ])

  // Stop simulation
  const stopSimulation = useCallback(() => {
    setIsSimulating(false)
    dataLogger.completeSimulation(currentSimulationId)
  }, [currentSimulationId, dataLogger])

  // Update logs when dataLogger changes
  useEffect(() => {
    const updateLogs = () => {
      setSimulationLogs(dataLogger.getSimulationLogs())
      setAlgorithmLogs(dataLogger.getAlgorithmLogs())
    }

    // Update logs periodically
    const interval = setInterval(updateLogs, 1000)
    return () => clearInterval(interval)
  }, [dataLogger])

  return (
    <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
            <TabsTrigger value="convergence">GA Convergence</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="simulation" className="space-y-6">
            <FactoryFloor
              tasks={tasks}
              amr={amr}
              currentTask={
                isSimulating && simulationStep < activeSolution.length ? activeSolution[simulationStep] : null
              }
              solution={activeSolution}
              simulationStep={simulationStep}
            />
            <StorageSlots amr={amr} />
            <TaskExecutionPanel
              dataLogger={dataLogger}
              currentSessionId={currentSimulationId}
              schedulingMethod={schedulingMethod}
            />
          </TabsContent>

          <TabsContent value="convergence" className="space-y-6">
            {generationLogs.length > 0 ? (
              <GAConvergenceChart generationLogs={generationLogs} maxGenerations={algorithmParams.maxGenerations} />
            ) : (
              <div className="border rounded-lg p-8 text-center bg-white">
                <h3 className="text-lg font-medium mb-2">No Convergence Data Available</h3>
                <p className="text-gray-500 mb-4">Run the Genetic Algorithm to see convergence data.</p>
                <Button onClick={runAlgorithm} disabled={isRunning || tasks.length === 0}>
                  Run Genetic Algorithm
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            {fifoSolution.length > 0 && bestSolution.length > 0 ? (
              <ComparisonChart
                fifoMetrics={fifoMetrics}
                gaMetrics={metrics}
                fifoSolutionLength={fifoSolution.length}
                gaSolutionLength={bestSolution.length}
              />
            ) : (
              <div className="border rounded-lg p-8 text-center bg-white">
                <h3 className="text-lg font-medium mb-2">No Comparison Data Available</h3>
                <p className="text-gray-500 mb-4">
                  Generate tasks and run both FIFO and GA algorithms to see comparison data.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <div className="space-y-6">
        <ControlPanel
          generateTasks={generateTasks}
          runAlgorithm={runAlgorithm}
          simulateSolution={simulateSolution}
          stopSimulation={stopSimulation}
          setAlgorithmParams={setAlgorithmParams}
          algorithmParams={algorithmParams}
          isRunning={isRunning}
          isSimulating={isSimulating}
          setSimulationSpeed={setSimulationSpeed}
          simulationSpeed={simulationSpeed}
          tasksCount={tasks.length}
          hasSolution={activeSolution.length > 0}
          schedulingMethod={schedulingMethod}
          changeSchedulingMethod={changeSchedulingMethod}
          fifoReady={fifoSolution.length > 0}
          gaReady={bestSolution.length > 0}
        />
        <MetricsPanel
          currentGeneration={currentGeneration}
          maxGenerations={algorithmParams.maxGenerations}
          metrics={schedulingMethod === "ga" ? metrics : fifoMetrics}
          tasksCount={tasks.length}
          solutionLength={activeSolution.length}
          schedulingMethod={schedulingMethod}
        />
        <ExportPanel
          dataLogger={dataLogger}
          simulationLogs={simulationLogs}
          algorithmLogs={algorithmLogs}
          currentSessionId={currentSimulationId}
          generationLogsCount={generationLogs.length}
        />
      </div>
    </div>
  )
}

// Helper Button component for the empty state
function Button({
  children,
  onClick,
  disabled,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-md font-medium ${
        disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-purple-600 text-white hover:bg-purple-700"
      }`}
    >
      {children}
    </button>
  )
}
