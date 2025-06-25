import { DataLogger } from "./data-logger"

// Create a singleton instance of DataLogger
let dataLoggerInstance: DataLogger | null = null

export function createDataLogger(): DataLogger {
  if (!dataLoggerInstance) {
    dataLoggerInstance = new DataLogger()
  }
  return dataLoggerInstance
}
