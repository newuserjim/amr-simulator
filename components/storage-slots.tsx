"use client"

import type { AMR } from "@/lib/models"

interface StorageSlotsProps {
  amr: AMR
}

export function StorageSlots({ amr }: StorageSlotsProps) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <h2 className="text-lg font-semibold mb-4">AMR Storage Slots</h2>
      <div className="grid grid-cols-2 gap-4">
        {amr.storageSlots.map((slot, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 flex flex-col items-center justify-center h-32 ${
              slot.isOccupied ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="text-lg font-bold mb-2">Slot {index + 1}</div>
            {slot.isOccupied ? (
              <div className="text-center">
                <div className="font-medium">
                  {slot.taskType === 0 ? "Delivery" : slot.taskType === 1 ? "Pickup" : "Pickup+Delivery"}
                </div>
                <div className="text-sm text-gray-500">Task ID: {slot.taskId}</div>
              </div>
            ) : (
              <div className="text-gray-400">Empty</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
