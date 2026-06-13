"use client"

import { useMemo } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

interface Leitura {
  id: number
  valor: string | null
  unidade: string | null
  lidaEm: Date | null
}

interface Props {
  data: Leitura[]
}

export function SensorReadingsChart({ data }: Props) {
  const chartData = useMemo(() => {
    if (data.length === 0) return []
    const sorted = [...data].sort(
      (a, b) => new Date(a.lidaEm ?? 0).getTime() - new Date(b.lidaEm ?? 0).getTime()
    )
    return sorted.map((d) => ({
      time: d.lidaEm
        ? new Date(d.lidaEm).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      valor: Number(d.valor),
    }))
  }, [data])

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
        Leituras ao Longo do Tempo
      </h2>
      {chartData.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-8">
          Nenhuma leitura registrada ainda
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="var(--text-secondary)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--text-secondary)" />
            <Tooltip
              contentStyle={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, fill: "#10b981" }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
