// Task types
export enum TaskType {
  DELIVERY = 0,
  PICKUP = 1,
  PICKUP_DELIVERY = 2,
}

// Position in the factory
export interface Position {
  x: number
  y: number
}

// Task model
export class Task {
  id: number
  type: TaskType
  position: Position
  processingTime: number

  constructor(params: {
    id: number
    type: TaskType
    position: Position
    processingTime?: number
  }) {
    this.id = params.id
    this.type = params.type
    this.position = params.position
    this.processingTime = params.processingTime || 5 // Default processing time
  }

  // Calculate distance from another position
  distanceFrom(pos: Position): number {
    return Math.sqrt(Math.pow(this.position.x - pos.x, 2) + Math.pow(this.position.y - pos.y, 2))
  }
}

// Storage slot model
export interface StorageSlot {
  isOccupied: boolean
  taskId?: number
  taskType?: TaskType
}

// AMR model
export class AMR {
  position: Position
  storageSlots: StorageSlot[]

  constructor(params?: {
    position?: Position
    storageSlots?: StorageSlot[]
  }) {
    this.position = params?.position || { x: 2, y: 2 } // Default position
    this.storageSlots = params?.storageSlots || [
      { isOccupied: false },
      { isOccupied: false },
      { isOccupied: false },
      { isOccupied: false },
    ]
  }

  // Check if AMR can handle a task based on storage constraints
  canHandleTask(task: Task): boolean {
    const occupiedSlots = this.storageSlots.filter((slot) => slot.isOccupied).length

    switch (task.type) {
      case TaskType.DELIVERY:
      case TaskType.PICKUP:
        // For pure delivery or pickup, need at least one free slot
        return occupiedSlots < 4
      case TaskType.PICKUP_DELIVERY:
        // For pickup+delivery, need at least one free slot for pickup
        return occupiedSlots < 3
      default:
        return false
    }
  }

  // Execute a task and update AMR state
  executeTask(task: Task): void {
    // Move AMR to task position
    this.position = { ...task.position }

    // Update storage slots based on task type
    switch (task.type) {
      case TaskType.DELIVERY:
        // Find first empty slot and occupy it
        for (let i = 0; i < this.storageSlots.length; i++) {
          if (!this.storageSlots[i].isOccupied) {
            this.storageSlots[i] = {
              isOccupied: true,
              taskId: task.id,
              taskType: task.type,
            }
            break
          }
        }
        break

      case TaskType.PICKUP:
        // Simulate pickup - free up a slot
        for (let i = 0; i < this.storageSlots.length; i++) {
          if (this.storageSlots[i].isOccupied) {
            this.storageSlots[i] = { isOccupied: false }
            break
          }
        }
        break

      case TaskType.PICKUP_DELIVERY:
        // First do pickup (free a slot)
        let pickupDone = false
        for (let i = 0; i < this.storageSlots.length; i++) {
          if (this.storageSlots[i].isOccupied) {
            this.storageSlots[i] = { isOccupied: false }
            pickupDone = true
            break
          }
        }

        // Then do delivery (occupy a slot)
        if (pickupDone) {
          for (let i = 0; i < this.storageSlots.length; i++) {
            if (!this.storageSlots[i].isOccupied) {
              this.storageSlots[i] = {
                isOccupied: true,
                taskId: task.id,
                taskType: task.type,
              }
              break
            }
          }
        }
        break
    }
  }

  // Get available slots count
  get availableSlots(): number {
    return this.storageSlots.filter((slot) => !slot.isOccupied).length
  }
}
