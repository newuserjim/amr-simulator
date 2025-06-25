import type { Task, TaskType, Position, StorageSlot } from "./models"

// Individual task execution record
export interface TaskExecutionRecord {
  taskId: number
  taskType: TaskType
  taskPosition: Position
  processingTime: number
  executionOrder: number
  startTime: Date
  endTime: Date
  executionDuration: number
  amrPositionBefore: Position
  amrPositionAfter: Position
  storageSlotsBeforeExecution: StorageSlot[]
  storageSlotsAfterExecution: StorageSlot[]
  distanceTraveled: number
  waitTime: number
  isSuccessful: boolean
  errorMessage?: string
  method: "fifo" | "ga"
  sessionId: string
}

// Simulation step log
export interface SimulationStepLog {
  taskId: number
  taskType: TaskType
  amrPosition: Position
  storageSlots: StorageSlot[]
  distanceTraveled: number
  timestamp: Date
}

// Simulation log
export interface SimulationLog {
  sessionId: string
  method: "fifo" | "ga"
  solution: Task[]
  steps: SimulationStepLog[]
  taskExecutions: TaskExecutionRecord[]
  startTime: Date
  endTime?: Date
  totalDistance: number
  totalTime: number
  totalTasks: number
  successfulTasks: number
  failedTasks: number
}

// Generation log for GA
export interface GenerationLog {
  generation: number
  bestFitness: number
  makespan: number
  idleDistance: number
  solution: Task[]
  timestamp: Date
  populationSize?: number
  crossoverRate?: number
  mutationRate?: number
  makeSpanWeight?: number
  idleDistanceWeight?: number
  averageFitness?: number
  worstFitness?: number
  standardDeviation?: number
  improvementFromPrevious?: number
  convergenceRate?: number
  // 新增字段
  populationDiversity?: number
  bestSolutionStability?: number
  cargoDistribution?: {
    pickup: number
    delivery: number
    pickupDelivery: number
  }
  solutionQuality?: number
}

// Algorithm result log
export interface AlgorithmLog {
  sessionId: string
  algorithm: "FIFO" | "GA"
  solution: Task[]
  makespan: number
  idleDistance: number
  fitness: number
  generations: number
  executionTime: number
  timestamp: Date
  generationLogs?: GenerationLog[]
  algorithmParams?: {
    populationSize?: number
    maxGenerations?: number
    crossoverRate?: number
    mutationRate?: number
    makeSpanWeight?: number
    idleDistanceWeight?: number
  }
}

// Session data
export interface SessionData {
  sessionId: string
  tasks: Task[]
  createdAt: Date
  algorithmParams?: any
}

export class DataLogger {
  private sessions: Map<string, SessionData> = new Map()
  private simulationLogs: SimulationLog[] = []
  private algorithmLogs: AlgorithmLog[] = []
  private generationLogs: Map<string, GenerationLog[]> = new Map()
  private taskExecutionRecords: TaskExecutionRecord[] = []

  // Start a new session
  startNewSession(tasks: Task[], algorithmParams?: any): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.sessions.set(sessionId, {
      sessionId,
      tasks: [...tasks],
      createdAt: new Date(),
      algorithmParams,
    })

    // Initialize empty generation logs array for this session
    this.generationLogs.set(sessionId, [])

    return sessionId
  }

  // Start simulation logging
  startSimulation(sessionId: string, method: "fifo" | "ga", solution: Task[]): void {
    const simulationLog: SimulationLog = {
      sessionId,
      method,
      solution: [...solution],
      steps: [],
      taskExecutions: [],
      startTime: new Date(),
      totalDistance: 0,
      totalTime: 0,
      totalTasks: solution.length,
      successfulTasks: 0,
      failedTasks: 0,
    }

    this.simulationLogs.push(simulationLog)
  }

  // Log individual task execution
  logTaskExecution(
    sessionId: string,
    task: Task,
    executionOrder: number,
    amrBefore: { position: Position; storageSlots: StorageSlot[] },
    amrAfter: { position: Position; storageSlots: StorageSlot[] },
    executionData: {
      startTime: Date
      endTime: Date
      distanceTraveled: number
      waitTime: number
      isSuccessful: boolean
      errorMessage?: string
      method: "fifo" | "ga"
    },
  ): void {
    const taskRecord: TaskExecutionRecord = {
      taskId: task.id,
      taskType: task.type,
      taskPosition: { ...task.position },
      processingTime: task.processingTime,
      executionOrder,
      startTime: executionData.startTime,
      endTime: executionData.endTime,
      executionDuration: executionData.endTime.getTime() - executionData.startTime.getTime(),
      amrPositionBefore: { ...amrBefore.position },
      amrPositionAfter: { ...amrAfter.position },
      storageSlotsBeforeExecution: amrBefore.storageSlots.map((slot) => ({ ...slot })),
      storageSlotsAfterExecution: amrAfter.storageSlots.map((slot) => ({ ...slot })),
      distanceTraveled: executionData.distanceTraveled,
      waitTime: executionData.waitTime,
      isSuccessful: executionData.isSuccessful,
      errorMessage: executionData.errorMessage,
      method: executionData.method,
      sessionId,
    }

    this.taskExecutionRecords.push(taskRecord)

    // Update simulation log
    const currentSimulation = this.simulationLogs.find((log) => log.sessionId === sessionId && !log.endTime)
    if (currentSimulation) {
      currentSimulation.taskExecutions.push(taskRecord)
      if (executionData.isSuccessful) {
        currentSimulation.successfulTasks++
      } else {
        currentSimulation.failedTasks++
      }
    }
  }

  // Log simulation step
  logSimulationStep(sessionId: string, stepIndex: number, stepData: SimulationStepLog): void {
    const currentSimulation = this.simulationLogs.find((log) => log.sessionId === sessionId && !log.endTime)

    if (currentSimulation) {
      currentSimulation.steps.push(stepData)
      currentSimulation.totalDistance += stepData.distanceTraveled
    }
  }

  // Complete simulation
  completeSimulation(sessionId: string): void {
    const currentSimulation = this.simulationLogs.find((log) => log.sessionId === sessionId && !log.endTime)

    if (currentSimulation) {
      currentSimulation.endTime = new Date()
      currentSimulation.totalTime = currentSimulation.endTime.getTime() - currentSimulation.startTime.getTime()
    }
  }

  // Log generation data for GA
  logGeneration(sessionId: string, generationLog: GenerationLog): void {
    if (!this.generationLogs.has(sessionId)) {
      this.generationLogs.set(sessionId, [])
    }

    // Get algorithm parameters from session
    const session = this.sessions.get(sessionId)
    if (session?.algorithmParams) {
      generationLog.populationSize = session.algorithmParams.populationSize
      generationLog.crossoverRate = session.algorithmParams.crossoverRate
      generationLog.mutationRate = session.algorithmParams.mutationRate
      generationLog.makeSpanWeight = session.algorithmParams.makeSpanWeight
      generationLog.idleDistanceWeight = session.algorithmParams.idleDistanceWeight
    }

    // Calculate improvement from previous generation
    const previousGenerations = this.generationLogs.get(sessionId)
    if (previousGenerations && previousGenerations.length > 0) {
      const previousGeneration = previousGenerations[previousGenerations.length - 1]
      if (previousGeneration) {
        const improvement = previousGeneration.bestFitness - generationLog.bestFitness
        const improvementPercentage = (improvement / previousGeneration.bestFitness) * 100
        generationLog.improvementFromPrevious = improvementPercentage

        // Calculate convergence rate (improvement per generation)
        if (generationLog.generation > 1) {
          const firstGeneration = previousGenerations[0]
          const totalImprovement =
            ((firstGeneration.bestFitness - generationLog.bestFitness) / firstGeneration.bestFitness) * 100
          const totalImprovementPercentage = totalImprovement / (generationLog.generation - 1 || 1)
          generationLog.convergenceRate = totalImprovementPercentage
        }
      }
    }

    this.generationLogs.get(sessionId)!.push(generationLog)
  }

  // Log algorithm result
  logAlgorithmResult(
    sessionId: string,
    algorithm: "FIFO" | "GA",
    data: {
      solution: Task[]
      makespan: number
      idleDistance: number
      fitness: number
      generations: number
      executionTime: number
    },
  ): void {
    // Get algorithm parameters from session
    const session = this.sessions.get(sessionId)
    const algorithmParams = session?.algorithmParams

    const algorithmLog: AlgorithmLog = {
      sessionId,
      algorithm,
      solution: [...data.solution],
      makespan: data.makespan,
      idleDistance: data.idleDistance,
      fitness: data.fitness,
      generations: data.generations,
      executionTime: data.executionTime,
      timestamp: new Date(),
      generationLogs: this.generationLogs.get(sessionId) || [],
      algorithmParams,
    }

    this.algorithmLogs.push(algorithmLog)
  }

  // Get simulation logs
  getSimulationLogs(): SimulationLog[] {
    return [...this.simulationLogs]
  }

  // Get algorithm logs
  getAlgorithmLogs(): AlgorithmLog[] {
    return [...this.algorithmLogs]
  }

  // Get generation logs for a session
  getGenerationLogs(sessionId: string): GenerationLog[] {
    return this.generationLogs.get(sessionId) || []
  }

  // Get task execution records
  getTaskExecutionRecords(sessionId?: string): TaskExecutionRecord[] {
    if (sessionId) {
      return this.taskExecutionRecords.filter((record) => record.sessionId === sessionId)
    }
    return [...this.taskExecutionRecords]
  }

  // Export to Excel
  async exportToExcel(
    sessionId: string,
    options: {
      simulationSteps: boolean
      algorithmResults: boolean
      generationData: boolean
      taskData: boolean
      summaryReport: boolean
      taskExecutions: boolean
    },
  ): Promise<void> {
    try {
      // Dynamic import to avoid loading xlsx on initial page load
      const XLSX = await import("xlsx")

      const workbook = XLSX.utils.book_new()
      const session = this.sessions.get(sessionId)

      if (!session) {
        throw new Error("Session not found")
      }

      // Task Data Sheet
      if (options.taskData) {
        const taskData = session.tasks.map((task) => ({
          "Task ID": task.id,
          "Task Type": task.type,
          "Position X": task.position.x,
          "Position Y": task.position.y,
          "Processing Time": task.processingTime,
        }))

        const taskSheet = XLSX.utils.json_to_sheet(taskData)
        XLSX.utils.book_append_sheet(workbook, taskSheet, "Tasks")
      }

      // Task Execution Records Sheet
      if (options.taskExecutions) {
        const taskExecutions = this.getTaskExecutionRecords(sessionId)

        if (taskExecutions.length > 0) {
          const executionData = taskExecutions.map((record) => ({
            "Task ID": record.taskId,
            "Task Type": record.taskType,
            Method: record.method.toUpperCase(),
            "Execution Order": record.executionOrder,
            "Start Time": record.startTime.toISOString(),
            "End Time": record.endTime.toISOString(),
            "Execution Duration (ms)": record.executionDuration,
            "Processing Time": record.processingTime,
            "Wait Time (ms)": record.waitTime,
            "Distance Traveled": Number(record.distanceTraveled.toFixed(2)),
            "Position Before X": record.amrPositionBefore.x,
            "Position Before Y": record.amrPositionBefore.y,
            "Position After X": record.amrPositionAfter.x,
            "Position After Y": record.amrPositionAfter.y,
            "Task Position X": record.taskPosition.x,
            "Task Position Y": record.taskPosition.y,
            "Slots Before (Occupied)": record.storageSlotsBeforeExecution.filter((s) => s.isOccupied).length,
            "Slots After (Occupied)": record.storageSlotsAfterExecution.filter((s) => s.isOccupied).length,
            "Slot 1 Before": record.storageSlotsBeforeExecution[0]?.isOccupied ? "Occupied" : "Empty",
            "Slot 2 Before": record.storageSlotsBeforeExecution[1]?.isOccupied ? "Occupied" : "Empty",
            "Slot 3 Before": record.storageSlotsBeforeExecution[2]?.isOccupied ? "Occupied" : "Empty",
            "Slot 4 Before": record.storageSlotsBeforeExecution[3]?.isOccupied ? "Occupied" : "Empty",
            "Slot 1 After": record.storageSlotsAfterExecution[0]?.isOccupied ? "Occupied" : "Empty",
            "Slot 2 After": record.storageSlotsAfterExecution[1]?.isOccupied ? "Occupied" : "Empty",
            "Slot 3 After": record.storageSlotsAfterExecution[2]?.isOccupied ? "Occupied" : "Empty",
            "Slot 4 After": record.storageSlotsAfterExecution[3]?.isOccupied ? "Occupied" : "Empty",
            Status: record.isSuccessful ? "Success" : "Failed",
            "Error Message": record.errorMessage || "",
          }))

          const executionSheet = XLSX.utils.json_to_sheet(executionData)
          XLSX.utils.book_append_sheet(workbook, executionSheet, "Task Executions")
        }
      }

      // Algorithm Results Sheet
      if (options.algorithmResults) {
        const algorithmData = this.algorithmLogs
          .filter((log) => log.sessionId === sessionId)
          .map((log) => ({
            Algorithm: log.algorithm,
            Makespan: Number(log.makespan.toFixed(2)),
            "Idle Distance": Number(log.idleDistance.toFixed(2)),
            Fitness: Number(log.fitness.toFixed(4)),
            Generations: log.generations,
            "Execution Time (ms)": log.executionTime,
            "Solution Length": log.solution.length,
            Timestamp: log.timestamp.toISOString(),
            "Population Size": log.algorithmParams?.populationSize || "N/A",
            "Max Generations": log.algorithmParams?.maxGenerations || "N/A",
            "Crossover Rate": log.algorithmParams?.crossoverRate || "N/A",
            "Mutation Rate": log.algorithmParams?.mutationRate || "N/A",
            "Makespan Weight": log.algorithmParams?.makeSpanWeight || "N/A",
            "Idle Distance Weight": log.algorithmParams?.idleDistanceWeight || "N/A",
          }))

        if (algorithmData.length > 0) {
          const algorithmSheet = XLSX.utils.json_to_sheet(algorithmData)
          XLSX.utils.book_append_sheet(workbook, algorithmSheet, "Algorithm Results")
        }
      }

      // Generation Data Sheet (for GA)
      if (options.generationData) {
        const generationData = this.generationLogs.get(sessionId) || []

        if (generationData.length > 0) {
          const genData = generationData.map((gen) => ({
            Generation: gen.generation,
            "Best Fitness": Number(gen.bestFitness.toFixed(4)),
            Makespan: Number(gen.makespan.toFixed(2)),
            "Idle Distance": Number(gen.idleDistance.toFixed(2)),
            "Solution Length": gen.solution.length,
            "Improvement From Previous (%)": gen.improvementFromPrevious
              ? Number(gen.improvementFromPrevious.toFixed(4))
              : "N/A",
            "Convergence Rate (%/gen)": gen.convergenceRate ? Number(gen.convergenceRate.toFixed(4)) : "N/A",
            "Average Fitness": gen.averageFitness ? Number(gen.averageFitness.toFixed(4)) : "N/A",
            "Worst Fitness": gen.worstFitness ? Number(gen.worstFitness.toFixed(4)) : "N/A",
            "Standard Deviation": gen.standardDeviation ? Number(gen.standardDeviation.toFixed(4)) : "N/A",
            "Population Size": gen.populationSize || "N/A",
            "Crossover Rate": gen.crossoverRate || "N/A",
            "Mutation Rate": gen.mutationRate || "N/A",
            "Makespan Weight": gen.makeSpanWeight || "N/A",
            "Idle Distance Weight": gen.idleDistanceWeight || "N/A",
            Timestamp: gen.timestamp.toISOString(),
          }))

          const generationSheet = XLSX.utils.json_to_sheet(genData)
          XLSX.utils.book_append_sheet(workbook, generationSheet, "Generation Evolution")
        }
      }

      // Simulation Steps Sheet
      if (options.simulationSteps) {
        const simulationData: any[] = []

        this.simulationLogs
          .filter((log) => log.sessionId === sessionId)
          .forEach((simulation) => {
            simulation.steps.forEach((step, index) => {
              simulationData.push({
                Method: simulation.method.toUpperCase(),
                Step: index + 1,
                "Task ID": step.taskId,
                "Task Type": step.taskType,
                "AMR Position X": step.amrPosition.x,
                "AMR Position Y": step.amrPosition.y,
                "Distance Traveled": Number(step.distanceTraveled.toFixed(2)),
                "Storage Slot 1": step.storageSlots[0]?.isOccupied ? "Occupied" : "Empty",
                "Storage Slot 2": step.storageSlots[1]?.isOccupied ? "Occupied" : "Empty",
                "Storage Slot 3": step.storageSlots[2]?.isOccupied ? "Occupied" : "Empty",
                "Storage Slot 4": step.storageSlots[3]?.isOccupied ? "Occupied" : "Empty",
                Timestamp: step.timestamp.toISOString(),
              })
            })
          })

        if (simulationData.length > 0) {
          const simulationSheet = XLSX.utils.json_to_sheet(simulationData)
          XLSX.utils.book_append_sheet(workbook, simulationSheet, "Simulation Steps")
        }
      }

      // Summary Report Sheet
      if (options.summaryReport) {
        const fifoResult = this.algorithmLogs.find((log) => log.sessionId === sessionId && log.algorithm === "FIFO")
        const gaResult = this.algorithmLogs.find((log) => log.sessionId === sessionId && log.algorithm === "GA")
        const taskExecutions = this.getTaskExecutionRecords(sessionId)
        const fifoTasks = taskExecutions.filter((t) => t.method === "fifo")
        const gaTasks = taskExecutions.filter((t) => t.method === "ga")
        const generationLogs = this.generationLogs.get(sessionId) || []

        const summaryData = [
          { Metric: "Total Tasks", Value: session.tasks.length },
          { Metric: "Session Created", Value: session.createdAt.toISOString() },
          { Metric: "", Value: "" },
          { Metric: "Task Execution Summary", Value: "" },
          { Metric: "Total Task Executions", Value: taskExecutions.length },
          { Metric: "FIFO Task Executions", Value: fifoTasks.length },
          { Metric: "GA Task Executions", Value: gaTasks.length },
          { Metric: "Successful Tasks", Value: taskExecutions.filter((t) => t.isSuccessful).length },
          { Metric: "Failed Tasks", Value: taskExecutions.filter((t) => !t.isSuccessful).length },
          { Metric: "", Value: "" },
          { Metric: "FIFO Results", Value: "" },
          { Metric: "FIFO Makespan", Value: fifoResult?.makespan.toFixed(2) || "N/A" },
          { Metric: "FIFO Idle Distance", Value: fifoResult?.idleDistance.toFixed(2) || "N/A" },
          { Metric: "FIFO Fitness", Value: fifoResult?.fitness.toFixed(4) || "N/A" },
          { Metric: "", Value: "" },
          { Metric: "GA Results", Value: "" },
          { Metric: "GA Makespan", Value: gaResult?.makespan.toFixed(2) || "N/A" },
          { Metric: "GA Idle Distance", Value: gaResult?.idleDistance.toFixed(2) || "N/A" },
          { Metric: "GA Fitness", Value: gaResult?.fitness.toFixed(4) || "N/A" },
          { Metric: "GA Generations", Value: gaResult?.generations || "N/A" },
          { Metric: "GA Execution Time (ms)", Value: gaResult?.executionTime || "N/A" },
        ]

        if (fifoResult && gaResult) {
          const improvement = [
            { Metric: "", Value: "" },
            { Metric: "Improvements (GA vs FIFO)", Value: "" },
            {
              Metric: "Makespan Improvement (%)",
              Value: (((fifoResult.makespan - gaResult.makespan) / fifoResult.makespan) * 100).toFixed(2),
            },
            {
              Metric: "Idle Distance Improvement (%)",
              Value: (((fifoResult.idleDistance - gaResult.idleDistance) / fifoResult.idleDistance) * 100).toFixed(2),
            },
            {
              Metric: "Fitness Improvement (%)",
              Value: (((fifoResult.fitness - gaResult.fitness) / fifoResult.fitness) * 100).toFixed(2),
            },
          ]
          summaryData.push(...improvement)
        }

        if (taskExecutions.length > 0) {
          const avgExecutionTime =
            taskExecutions.reduce((sum, t) => sum + t.executionDuration, 0) / taskExecutions.length
          const avgDistance = taskExecutions.reduce((sum, t) => sum + t.distanceTraveled, 0) / taskExecutions.length
          const avgWaitTime = taskExecutions.reduce((sum, t) => sum + t.waitTime, 0) / taskExecutions.length

          const taskStats = [
            { Metric: "", Value: "" },
            { Metric: "Task Execution Statistics", Value: "" },
            { Metric: "Average Execution Time (ms)", Value: avgExecutionTime.toFixed(2) },
            { Metric: "Average Distance per Task", Value: avgDistance.toFixed(2) },
            { Metric: "Average Wait Time (ms)", Value: avgWaitTime.toFixed(2) },
          ]
          summaryData.push(...taskStats)
        }

        // Add GA convergence statistics
        if (generationLogs.length > 0) {
          const firstGen = generationLogs[0]
          const lastGen = generationLogs[generationLogs.length - 1]
          const totalImprovement = ((firstGen.bestFitness - lastGen.bestFitness) / firstGen.bestFitness) * 100
          const avgImprovementPerGen = totalImprovement / (lastGen.generation - 1 || 1)

          const convergenceStats = [
            { Metric: "", Value: "" },
            { Metric: "GA Convergence Statistics", Value: "" },
            { Metric: "Initial Fitness", Value: firstGen.bestFitness.toFixed(4) },
            { Metric: "Final Fitness", Value: lastGen.bestFitness.toFixed(4) },
            { Metric: "Total Improvement (%)", Value: totalImprovement.toFixed(2) },
            { Metric: "Average Improvement per Generation (%)", Value: avgImprovementPerGen.toFixed(4) },
            { Metric: "Total Generations", Value: lastGen.generation },
          ]
          summaryData.push(...convergenceStats)

          // Add standard deviation statistics if available
          if (generationLogs.some((log) => log.standardDeviation !== undefined)) {
            const avgStdDev =
              generationLogs.reduce((sum, log) => sum + (log.standardDeviation || 0), 0) / generationLogs.length
            const initialStdDev = firstGen.standardDeviation || 0
            const finalStdDev = lastGen.standardDeviation || 0
            const stdDevReduction = ((initialStdDev - finalStdDev) / initialStdDev) * 100

            const stdDevStats = [
              { Metric: "Initial Population Diversity (StdDev)", Value: initialStdDev.toFixed(4) },
              { Metric: "Final Population Diversity (StdDev)", Value: finalStdDev.toFixed(4) },
              { Metric: "Diversity Reduction (%)", Value: stdDevReduction.toFixed(2) },
              { Metric: "Average Population Diversity", Value: avgStdDev.toFixed(4) },
            ]
            summaryData.push(...stdDevStats)
          }
        }

        const summarySheet = XLSX.utils.json_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary Report")
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
      const filename = `AMR_Simulation_${sessionId.split("_")[1]}_${timestamp}.xlsx`

      // Convert workbook to binary string
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

      // Create blob from binary string
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Excel export error:", error)
      throw new Error(`Excel export failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Export to JSON
  exportToJSON(sessionId: string): void {
    try {
      const session = this.sessions.get(sessionId)
      if (!session) {
        throw new Error("Session not found")
      }

      const exportData = {
        session,
        simulationLogs: this.simulationLogs.filter((log) => log.sessionId === sessionId),
        algorithmLogs: this.algorithmLogs.filter((log) => log.sessionId === sessionId),
        generationLogs: this.generationLogs.get(sessionId) || [],
        taskExecutionRecords: this.getTaskExecutionRecords(sessionId),
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })

      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `AMR_Simulation_${sessionId.split("_")[1]}_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("JSON export error:", error)
      throw new Error(`JSON export failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Clear all data
  clearAllData(): void {
    this.sessions.clear()
    this.simulationLogs = []
    this.algorithmLogs = []
    this.generationLogs.clear()
    this.taskExecutionRecords = []
  }
}
