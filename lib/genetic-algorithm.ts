import { type Task, TaskType, type Position } from "./models"

interface GeneticAlgorithmParams {
  tasks: Task[]
  populationSize: number
  maxGenerations: number
  crossoverRate: number
  mutationRate: number
  makeSpanWeight: number
  idleDistanceWeight: number
  onGenerationComplete?: (
    generation: number,
    bestSolution: Task[],
    fitness: number,
    makespan: number,
    idleDistance: number,
    stats: { averageFitness: number; worstFitness: number; standardDeviation: number },
  ) => void
  onComplete?: () => void
}

// Individual in the population
interface Individual {
  chromosome: Task[]
  fitness: number
  makespan: number
  idleDistance: number
}

export class GeneticAlgorithm {
  private tasks: Task[]
  private populationSize: number
  private maxGenerations: number
  private crossoverRate: number
  private mutationRate: number
  private makeSpanWeight: number
  private idleDistanceWeight: number
  private population: Individual[]
  private bestSolution: Individual | null
  private onGenerationComplete?: (
    generation: number,
    bestSolution: Task[],
    fitness: number,
    makespan: number,
    idleDistance: number,
    stats: { averageFitness: number; worstFitness: number; standardDeviation: number },
  ) => void
  private onComplete?: () => void
  private earlyStopGenerations = 10 // Number of generations with no improvement before early stopping
  private earlyStopThreshold = 0.001 // Minimum improvement threshold
  private lastBestFitness: number = Number.POSITIVE_INFINITY
  private generationsWithoutImprovement = 0
  private processingChunkSize = 5 // Process generations in chunks to avoid UI freezing

  constructor(params: GeneticAlgorithmParams) {
    this.tasks = params.tasks
    this.populationSize = params.populationSize
    this.maxGenerations = params.maxGenerations
    this.crossoverRate = params.crossoverRate
    this.mutationRate = params.mutationRate
    this.makeSpanWeight = params.makeSpanWeight
    this.idleDistanceWeight = params.idleDistanceWeight
    this.population = []
    this.bestSolution = null
    this.onGenerationComplete = params.onGenerationComplete
    this.onComplete = params.onComplete

    // Adjust processing chunk size based on task count for better performance
    if (this.tasks.length > 20) {
      this.processingChunkSize = 3
      this.earlyStopGenerations = 5
    } else if (this.tasks.length > 15) {
      this.processingChunkSize = 4
      this.earlyStopGenerations = 8
    }
  }

  // Run the genetic algorithm
  public async run(): Promise<void> {
    // Initialize population
    this.initializePopulation()

    // Evaluate initial population
    this.evaluatePopulation()

    // Find best solution in initial population
    const initialBest = this.findBestIndividual()
    this.bestSolution = { ...initialBest }
    this.lastBestFitness = initialBest.fitness

    // Calculate population statistics for initial generation
    const initialStats = this.calculatePopulationStatistics()

    // Call callback for initial generation
    if (this.onGenerationComplete) {
      this.onGenerationComplete(
        0, // Generation 0 (initial)
        this.bestSolution.chromosome,
        this.bestSolution.fitness,
        this.bestSolution.makespan,
        this.bestSolution.idleDistance,
        initialStats, // Pass statistics
      )
    }

    // Main GA loop - process in chunks to avoid UI freezing
    let generation = 0
    while (generation < this.maxGenerations) {
      // Process a chunk of generations
      const endChunk = Math.min(generation + this.processingChunkSize, this.maxGenerations)

      for (let g = generation; g < endChunk; g++) {
        // Selection and reproduction
        const newPopulation = this.createNewGeneration()

        // Replace old population
        this.population = newPopulation

        // Evaluate new population
        this.evaluatePopulation()

        // Find best solution in current generation
        const bestInGeneration = this.findBestIndividual()

        // Calculate population statistics
        const stats = this.calculatePopulationStatistics()

        // Check for improvement
        const improvement = this.lastBestFitness - bestInGeneration.fitness
        if (improvement > this.earlyStopThreshold) {
          this.lastBestFitness = bestInGeneration.fitness
          this.generationsWithoutImprovement = 0
        } else {
          this.generationsWithoutImprovement++
        }

        // Update overall best solution if needed
        if (!this.bestSolution || bestInGeneration.fitness < this.bestSolution.fitness) {
          this.bestSolution = { ...bestInGeneration }
        }

        // Callback for generation complete
        if (this.onGenerationComplete) {
          this.onGenerationComplete(
            g + 1,
            this.bestSolution.chromosome,
            this.bestSolution.fitness,
            this.bestSolution.makespan,
            this.bestSolution.idleDistance,
            stats, // Pass statistics
          )
        }

        // Check for early termination (convergence)
        if (this.generationsWithoutImprovement >= this.earlyStopGenerations) {
          generation = this.maxGenerations // Force exit
          break
        }
      }

      // Update generation counter
      generation = endChunk

      // Yield to UI thread to prevent freezing
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    // Callback for algorithm complete
    if (this.onComplete) {
      this.onComplete()
    }
  }

  // Initialize population with random individuals
  private initializePopulation(): void {
    this.population = []

    for (let i = 0; i < this.populationSize; i++) {
      // Create a random valid chromosome
      const chromosome = this.createRandomChromosome()

      // Add to population
      this.population.push({
        chromosome,
        fitness: 0,
        makespan: 0,
        idleDistance: 0,
      })
    }
  }

  // Create a random valid chromosome
  private createRandomChromosome(): Task[] {
    // Shuffle tasks
    const shuffledTasks = [...this.tasks].sort(() => Math.random() - 0.5)

    // Group tasks based on storage constraints
    const taskGroups: Task[][] = []
    let currentGroup: Task[] = []
    let slotsUsed = 0

    for (const task of shuffledTasks) {
      // Check if we need to start a new group
      if (task.type === TaskType.PICKUP_DELIVERY && slotsUsed >= 3) {
        // Can't add pickup+delivery if 3 or more slots are used
        taskGroups.push([...currentGroup])
        currentGroup = []
        slotsUsed = 0
      } else if (slotsUsed >= 4) {
        // Start a new group if all slots are used
        taskGroups.push([...currentGroup])
        currentGroup = []
        slotsUsed = 0
      }

      // Add task to current group
      currentGroup.push(task)

      // Update slots used
      if (task.type === TaskType.DELIVERY) {
        slotsUsed++
      } else if (task.type === TaskType.PICKUP) {
        slotsUsed = Math.max(0, slotsUsed - 1)
      } else if (task.type === TaskType.PICKUP_DELIVERY) {
        // No net change in slots for pickup+delivery
      }
    }

    // Add the last group if not empty
    if (currentGroup.length > 0) {
      taskGroups.push(currentGroup)
    }

    // Flatten groups back to a single chromosome
    return taskGroups.flat()
  }

  // Evaluate fitness of all individuals in the population
  private evaluatePopulation(): void {
    for (const individual of this.population) {
      const { makespan, idleDistance } = this.calculateFitness(individual.chromosome)
      individual.makespan = makespan
      individual.idleDistance = idleDistance
      individual.fitness = this.makeSpanWeight * makespan + this.idleDistanceWeight * idleDistance
    }
  }

  // Calculate fitness (makespan and idle distance) for a chromosome
  private calculateFitness(chromosome: Task[]): { makespan: number; idleDistance: number } {
    let currentTime = 0
    let totalIdleDistance = 0
    let currentPosition: Position = { x: 2, y: 2 } // Start position

    // Simulate AMR executing tasks
    for (const task of chromosome) {
      // Calculate travel time (distance)
      const distance = Math.sqrt(
        Math.pow(task.position.x - currentPosition.x, 2) + Math.pow(task.position.y - currentPosition.y, 2),
      )

      // Add travel time
      currentTime += distance

      // If AMR is empty, count as idle distance
      if (task.type === TaskType.DELIVERY) {
        totalIdleDistance += distance
      }

      // Add processing time
      currentTime += task.processingTime

      // Update position
      currentPosition = { ...task.position }
    }

    return {
      makespan: currentTime,
      idleDistance: totalIdleDistance,
    }
  }

  // Create a new generation through selection, crossover, and mutation
  private createNewGeneration(): Individual[] {
    const newPopulation: Individual[] = []

    // Elitism: Keep the best individuals
    const eliteCount = Math.max(1, Math.floor(this.populationSize * 0.1))
    const sortedPopulation = [...this.population].sort((a, b) => a.fitness - b.fitness)
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push({ ...sortedPopulation[i] })
    }

    // Fill the rest of the population
    while (newPopulation.length < this.populationSize) {
      // Select parents
      const parent1 = this.tournamentSelection()
      const parent2 = this.tournamentSelection()

      // Crossover
      let offspring1, offspring2
      if (Math.random() < this.crossoverRate) {
        ;[offspring1, offspring2] = this.crossover(parent1, parent2)
      } else {
        offspring1 = { ...parent1 }
        offspring2 = { ...parent2 }
      }

      // Mutation
      this.mutate(offspring1)
      this.mutate(offspring2)

      // Add to new population
      newPopulation.push(offspring1)
      if (newPopulation.length < this.populationSize) {
        newPopulation.push(offspring2)
      }
    }

    return newPopulation
  }

  // Tournament selection
  private tournamentSelection(): Individual {
    const tournamentSize = 3
    let best: Individual | null = null

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length)
      const individual = this.population[randomIndex]

      if (!best || individual.fitness < best.fitness) {
        best = individual
      }
    }

    return { ...best! }
  }

  // Partially Mapped Crossover (PMX)
  private crossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    const chromosome1 = [...parent1.chromosome]
    const chromosome2 = [...parent2.chromosome]
    const length = chromosome1.length

    // Select crossover points
    const point1 = Math.floor(Math.random() * (length - 1))
    const point2 = point1 + Math.floor(Math.random() * (length - point1))

    // Create offspring
    const offspring1 = new Array(length).fill(null)
    const offspring2 = new Array(length).fill(null)

    // Copy the mapping section
    for (let i = point1; i <= point2; i++) {
      offspring1[i] = chromosome2[i]
      offspring2[i] = chromosome1[i]
    }

    // Fill the remaining positions
    this.fillRemainingPositions(chromosome1, offspring1, point1, point2)
    this.fillRemainingPositions(chromosome2, offspring2, point1, point2)

    return [
      { chromosome: offspring1, fitness: 0, makespan: 0, idleDistance: 0 },
      { chromosome: offspring2, fitness: 0, makespan: 0, idleDistance: 0 },
    ]
  }

  // Helper for PMX crossover
  private fillRemainingPositions(parent: Task[], offspring: Task[], point1: number, point2: number): void {
    const length = parent.length

    // Create a map of tasks already in offspring
    const usedTasks = new Set<number>()
    for (let i = point1; i <= point2; i++) {
      if (offspring[i]) {
        usedTasks.add(offspring[i].id)
      }
    }

    // Fill remaining positions
    for (let i = 0; i < length; i++) {
      if (i < point1 || i > point2) {
        // Find a task from parent that's not already in offspring
        let j = i
        while (usedTasks.has(parent[j].id)) {
          j = (j + 1) % length
        }

        offspring[i] = parent[j]
        usedTasks.add(parent[j].id)
      }
    }
  }

  // Mutation
  private mutate(individual: Individual): void {
    if (Math.random() > this.mutationRate) return

    const chromosome = individual.chromosome
    const length = chromosome.length

    // Choose mutation type
    if (Math.random() < 0.5) {
      // Swap mutation - swap two random tasks
      const index1 = Math.floor(Math.random() * length)
      const index2 = Math.floor(Math.random() * length)
      ;[chromosome[index1], chromosome[index2]] = [chromosome[index2], chromosome[index1]]
    } else {
      // Inversion mutation - reverse a random segment
      const point1 = Math.floor(Math.random() * (length - 1))
      const point2 = point1 + Math.floor(Math.random() * (length - point1))

      const segment = chromosome.slice(point1, point2 + 1).reverse()
      for (let i = point1; i <= point2; i++) {
        chromosome[i] = segment[i - point1]
      }
    }
  }

  // Find the best individual in the current population
  private findBestIndividual(): Individual {
    return this.population.reduce(
      (best, current) => (!best || current.fitness < best.fitness ? current : best),
      null as unknown as Individual,
    )
  }

  // Calculate population statistics
  private calculatePopulationStatistics(): {
    averageFitness: number
    worstFitness: number
    standardDeviation: number
  } {
    // Calculate average fitness
    const totalFitness = this.population.reduce((sum, individual) => sum + individual.fitness, 0)
    const averageFitness = totalFitness / this.population.length

    // Find worst fitness
    const worstFitness = this.population.reduce(
      (worst, current) => (current.fitness > worst ? current.fitness : worst),
      this.population[0]?.fitness || 0,
    )

    // Calculate standard deviation
    const sumSquaredDifferences = this.population.reduce(
      (sum, individual) => sum + Math.pow(individual.fitness - averageFitness, 2),
      0,
    )
    const standardDeviation = Math.sqrt(sumSquaredDifferences / this.population.length)

    return {
      averageFitness,
      worstFitness,
      standardDeviation,
    }
  }
}
