"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, FileSpreadsheet, Database, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { DataLogger, SimulationLog, AlgorithmLog } from "@/lib/data-logger"

interface ExportPanelProps {
  dataLogger: DataLogger
  simulationLogs: SimulationLog[]
  algorithmLogs: AlgorithmLog[]
  currentSessionId: string
  generationLogsCount: number
}

export function ExportPanel({
  dataLogger,
  simulationLogs,
  algorithmLogs,
  currentSessionId,
  generationLogsCount,
}: ExportPanelProps) {
  const [exportOptions, setExportOptions] = useState({
    simulationSteps: true,
    algorithmResults: true,
    generationData: true,
    taskData: true,
    summaryReport: true,
    taskExecutions: true,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExportOptionChange = (option: keyof typeof exportOptions, checked: boolean) => {
    setExportOptions((prev) => ({
      ...prev,
      [option]: checked,
    }))
  }

  const exportToExcel = async () => {
    if (!currentSessionId) {
      setExportError("No active session to export")
      return
    }

    setIsExporting(true)
    setExportError(null)

    try {
      await dataLogger.exportToExcel(currentSessionId, exportOptions)
      // Success - no need to show success message as file download will indicate success
    } catch (error) {
      console.error("Export failed:", error)
      setExportError(error instanceof Error ? error.message : "Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const exportToJSON = () => {
    if (!currentSessionId) {
      setExportError("No active session to export")
      return
    }

    setExportError(null)

    try {
      dataLogger.exportToJSON(currentSessionId)
    } catch (error) {
      console.error("JSON export failed:", error)
      setExportError(error instanceof Error ? error.message : "JSON export failed. Please try again.")
    }
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all recorded data? This action cannot be undone.")) {
      dataLogger.clearAllData()
      setExportError(null)
    }
  }

  const hasAnyData = simulationLogs.length > 0 || algorithmLogs.length > 0 || generationLogsCount > 0
  const hasSelectedOptions = Object.values(exportOptions).some((v) => v)
  const taskExecutionCount = dataLogger.getTaskExecutionRecords(currentSessionId).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          數據匯出
        </CardTitle>
        <CardDescription>匯出模擬數據和分析結果</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {exportError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{exportError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-medium">匯出選項</Label>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="taskExecutions"
                checked={exportOptions.taskExecutions}
                onCheckedChange={(checked) => handleExportOptionChange("taskExecutions", checked as boolean)}
              />
              <Label htmlFor="taskExecutions" className="text-sm">
                任務執行記錄 ({taskExecutionCount} 筆)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="simulationSteps"
                checked={exportOptions.simulationSteps}
                onCheckedChange={(checked) => handleExportOptionChange("simulationSteps", checked as boolean)}
              />
              <Label htmlFor="simulationSteps" className="text-sm">
                模擬步驟 ({simulationLogs.reduce((total, log) => total + log.steps.length, 0)} 筆)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="algorithmResults"
                checked={exportOptions.algorithmResults}
                onCheckedChange={(checked) => handleExportOptionChange("algorithmResults", checked as boolean)}
              />
              <Label htmlFor="algorithmResults" className="text-sm">
                演算法結果 ({algorithmLogs.length} 筆)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="generationData"
                checked={exportOptions.generationData}
                onCheckedChange={(checked) => handleExportOptionChange("generationData", checked as boolean)}
              />
              <Label htmlFor="generationData" className="text-sm">
                GA 世代演化數據 ({generationLogsCount} 筆)
              </Label>
              {generationLogsCount > 100 && (
                <span className="text-xs text-amber-600">(大量數據，匯出可能需要較長時間)</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="taskData"
                checked={exportOptions.taskData}
                onCheckedChange={(checked) => handleExportOptionChange("taskData", checked as boolean)}
              />
              <Label htmlFor="taskData" className="text-sm">
                任務配置數據
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="summaryReport"
                checked={exportOptions.summaryReport}
                onCheckedChange={(checked) => handleExportOptionChange("summaryReport", checked as boolean)}
              />
              <Label htmlFor="summaryReport" className="text-sm">
                摘要報告
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={exportToExcel}
            className="w-full"
            disabled={!currentSessionId || !hasSelectedOptions || !hasAnyData || isExporting}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isExporting ? "匯出中..." : "匯出到 Excel"}
          </Button>

          <Button
            onClick={exportToJSON}
            variant="outline"
            className="w-full"
            disabled={!currentSessionId || !hasAnyData}
          >
            <Download className="mr-2 h-4 w-4" />
            匯出到 JSON
          </Button>
        </div>

        <div className="pt-2 border-t">
          <Button onClick={clearAllData} variant="destructive" size="sm" className="w-full" disabled={!hasAnyData}>
            清除所有數據
          </Button>
        </div>

        {currentSessionId && (
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            <div>會話 ID: {currentSessionId.split("_")[1]}</div>
            <div>模擬日誌: {simulationLogs.length}</div>
            <div>演算法日誌: {algorithmLogs.length}</div>
            <div>GA 世代記錄: {generationLogsCount}</div>
            <div>任務執行: {taskExecutionCount}</div>
            <div>總步驟: {simulationLogs.reduce((total, log) => total + log.steps.length, 0)}</div>
          </div>
        )}

        {!hasAnyData && currentSessionId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>沒有可匯出的數據。運行模擬以生成數據。</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
