import { type Task, TaskType, type Position } from "./models"

interface FIFOSchedulerParams {
  tasks: Task[]
}

export class FIFOScheduler {
  private tasks: Task[]

  constructor(params: FIFOSchedulerParams) {
    this.tasks = params.tasks
  }

  // Schedule tasks using FIFO approach
  public schedule(): Task[] {
    // Create a copy of tasks to work with
    const tasksCopy = [...this.tasks]

    // Result will contain the final task sequence
    const result: Task[] = []

    // Group tasks based on storage constraints
    while (tasksCopy.length > 0) {
      const group: Task[] = []
      let slotsUsed = 0

      // Try to add as many tasks as possible to the current group
      for (let i = 0; i < tasksCopy.length; i++) {
        const task = tasksCopy[i]

        // Check if we can add this task to the current group
        if (task.type === TaskType.PICKUP_DELIVERY && slotsUsed >= 3) {
          // Can't add pickup+delivery if 3 or more slots are used
          continue
        } else if (slotsUsed >= 4) {
          // Start a new group if all slots are used
          break
        }

        // Add task to current group
        group.push(task)

        // Remove task from the list
        tasksCopy.splice(i, 1)
        i--

        // Update slots used
        if (task.type === TaskType.DELIVERY) {
          slotsUsed++
        } else if (task.type === TaskType.PICKUP) {
          slotsUsed = Math.max(0, slotsUsed - 1)
        } else if (task.type === TaskType.PICKUP_DELIVERY) {
          // No net change in slots for pickup+delivery
        }
      }

      // Add the group to the result
      result.push(...group)

      // If we couldn't add any tasks, break to avoid infinite loop
      if (group.length === 0) break
    }

    return result
  }

  // Calculate metrics for a given solution
  public calculateMetrics(solution: Task[]): { makespan: number; idleDistance: number } {
    let currentTime = 0
    let totalIdleDistance = 0
    let currentPosition: Position = { x: 2, y: 2 } // Start position

    // Simulate AMR executing tasks
    for (const task of solution) {
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
}
