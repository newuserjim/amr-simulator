import { Simulator } from "@/components/simulator"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">AMR Task Scheduling Simulator</h1>
      <Simulator />
    </main>
  )
}
