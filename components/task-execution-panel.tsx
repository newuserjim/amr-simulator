"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, XCircle, Clock, MapPin, Package } from "lucide-react"
import type { DataLogger, TaskExecutionRecord } from "@/lib/data-logger"
import { TaskType } from "@/lib/models"
import type { SchedulingMethod } from "@/components/simulator"

interface TaskExecutionPanelProps {
  dataLogger: DataLogger
  currentSessionId: string
  schedulingMethod: SchedulingMethod
}

export function TaskExecutionPanel({ dataLogger, currentSessionId, schedulingMethod }: TaskExecutionPanelProps) {
  const [taskExecutions, setTaskExecutions] = useState<TaskExecutionRecord[]>([])

  useEffect(() => {
    const updateTaskExecutions = () => {
      if (currentSessionId) {
        const executions = dataLogger.getTaskExecutionRecords(currentSessionId)
        setTaskExecutions(executions)
      }
    }

    // Update task executions periodically
    const interval = setInterval(updateTaskExecutions, 500)
    updateTaskExecutions() // Initial update

    return () => clearInterval(interval)
  }, [dataLogger, currentSessionId])

  // Filter executions by current scheduling method
  const filteredExecutions = taskExecutions.filter((execution) => execution.method === schedulingMethod)

  const getTaskTypeColor = (taskType: TaskType) => {
    switch (taskType) {
      case TaskType.DELIVERY:
        return "bg-blue-100 text-blue-800"
      case TaskType.PICKUP:
        return "bg-green-100 text-green-800"
      case TaskType.PICKUP_DELIVERY:
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour12: false, timeStyle: "medium" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Task Execution Log ({schedulingMethod.toUpperCase()})
        </CardTitle>
        <CardDescription>
          Detailed execution records for each individual task ({filteredExecutions.length} tasks)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {filteredExecutions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No task executions recorded yet.</p>
              <p className="text-sm">Run a simulation to see task execution details.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExecutions
                .sort((a, b) => a.executionOrder - b.executionOrder)
                .map((execution, index) => (
                  <div key={`${execution.taskId}-${execution.executionOrder}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{execution.executionOrder}
                        </Badge>
                        <Badge className={getTaskTypeColor(execution.taskType)}>
                          Task {execution.taskId} - {TaskType[execution.taskType]}
                        </Badge>
                        {execution.isSuccessful ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{formatTime(execution.startTime)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">Duration:</span>
                          <span>{formatDuration(execution.executionDuration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="font-medium">Distance:</span>
                          <span>{execution.distanceTraveled.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Position:</span>
                          <span className="ml-1">
                            ({execution.amrPositionBefore.x}, {execution.amrPositionBefore.y}) → (
                            {execution.amrPositionAfter.x}, {execution.amrPositionAfter.y})
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Slots:</span>
                          <span className="ml-1">
                            {execution.storageSlotsBeforeExecution.filter((s) => s.isOccupied).length} →{" "}
                            {execution.storageSlotsAfterExecution.filter((s) => s.isOccupied).length} occupied
                          </span>
                        </div>
                      </div>
                    </div>

                    {execution.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <strong>Error:</strong> {execution.errorMessage}
                      </div>
                    )}

                    <div className="mt-2 flex gap-1">
                      {execution.storageSlotsAfterExecution.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className={`w-6 h-6 border rounded text-xs flex items-center justify-center ${
                            slot.isOccupied ? "bg-green-100 border-green-300" : "bg-gray-100 border-gray-300"
                          }`}
                          title={`Slot ${slotIndex + 1}: ${slot.isOccupied ? "Occupied" : "Empty"}`}
                        >
                          {slotIndex + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
