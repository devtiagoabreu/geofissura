import { db } from "@/lib/db"
import { visionDevices, visionObservations } from "@/lib/db/schema/vision"
import { Eye, Camera, Activity, AlertTriangle } from "lucide-react"

export default async function VisionPage() {
  const devices = await db.select().from(visionDevices)
    .orderBy(visionDevices.createdAt)

  const recentObs = await db.select().from(visionObservations)
    .orderBy(visionObservations.capturedAt)
    .limit(50)

  const deviceCount = devices.length
  const activeDevices = devices.filter(d => d.isActive).length
  const totalObs = recentObs.length

  const taskTypeCounts = devices.reduce((acc, d) => {
    acc[d.taskType] = (acc[d.taskType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vision Platform</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Dispositivos de visao computacional e observacoes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-1">
            <Camera className="h-4 w-4" />
            Devices
          </div>
          <p className="text-2xl font-bold">{deviceCount}</p>
          <p className="text-xs text-[var(--text-secondary)]">{activeDevices} ativos</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-1">
            <Eye className="h-4 w-4" />
            Observacoes
          </div>
          <p className="text-2xl font-bold">{totalObs}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-1">
            <Activity className="h-4 w-4" />
            Tarefas
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(taskTypeCounts).map(([task, count]) => (
              <span key={task} className="px-2 py-0.5 rounded text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                {task}: {count}
              </span>
            ))}
            {Object.keys(taskTypeCounts).length === 0 && (
              <span className="text-xs text-[var(--text-secondary)]">Nenhum</span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
            Webhook
          </div>
          <p className="text-sm font-mono text-[var(--text-secondary)]">/api/v1/vision/webhook</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">Devices</h2>
        </div>
        {devices.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhum device registrado. Devices sao enviados via webhook do vision-platform.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    device.isActive
                      ? "bg-green-900/50 text-green-400"
                      : "bg-red-900/50 text-red-400"
                  }`}>
                    {device.isActive ? "● Ativo" : "● Inativo"}
                  </span>
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <div className="flex gap-2 text-xs text-[var(--text-secondary)]">
                      <span className="font-mono">{device.deviceId}</span>
                      <span>{device.localId}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded text-xs bg-purple-900/50 text-purple-400">
                    {device.deviceType}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-400">
                    {device.taskType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">Observacoes Recentes</h2>
        </div>
        {recentObs.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma observacao registrada
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {recentObs.map((obs) => (
              <div key={obs.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm font-mono">{obs.observationId}</p>
                  <div className="flex gap-2 text-xs text-[var(--text-secondary)]">
                    <span>{obs.deviceId}</span>
                    <span>{obs.localId}</span>
                    <span>{obs.taskType}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--text-secondary)]">
                  <span className={`px-2 py-0.5 rounded ${
                    obs.status === "received" ? "bg-blue-900/50 text-blue-400" :
                    obs.status === "processed" ? "bg-green-900/50 text-green-400" :
                    "bg-gray-800 text-gray-400"
                  }`}>
                    {obs.status}
                  </span>
                  {obs.qualityScore != null && (
                    <p className="mt-0.5">Q: {(obs.qualityScore * 100).toFixed(0)}%</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
