import { Task, TaskType, type Position } from "./models"

// Generate random tasks for simulation
export function generateRandomTasks(count: number): Task[] {
  const tasks: Task[] = []

  for (let i = 0; i < count; i++) {
    // Generate random position (avoiding edges and home position)
    const position: Position = {
      x: 3 + Math.floor(Math.random() * 12),
      y: 3 + Math.floor(Math.random() * 8),
    }

    // Ensure positions are not too close to each other
    if (
      tasks.some((task) => Math.abs(task.position.x - position.x) < 2 && Math.abs(task.position.y - position.y) < 2)
    ) {
      i-- // Try again
      continue
    }

    // Generate random task type with distribution:
    // 50% delivery, 30% pickup, 20% pickup+delivery
    let type: TaskType
    const rand = Math.random()
    if (rand < 0.5) {
      type = TaskType.DELIVERY
    } else if (rand < 0.8) {
      type = TaskType.PICKUP
    } else {
      type = TaskType.PICKUP_DELIVERY
    }

    // Generate random processing time between 3 and 10
    const processingTime = 3 + Math.floor(Math.random() * 8)

    // Create task
    tasks.push(
      new Task({
        id: i + 1,
        type,
        position,
        processingTime,
      }),
    )
  }

  return tasks
}
