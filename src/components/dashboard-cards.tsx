"use client"

import { useState } from "react"
import { Building2, Cpu, Activity, AlertTriangle, ExternalLink, ChevronRight } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import Link from "next/link"

interface CardConfig {
  label: string
  icon: any
  color: string
  apiPath: string
  basePath: string
  linkKey: string
}

const cardsConfig: CardConfig[] = [
  { label: "Edificações", icon: Building2, color: "text-emerald-500", apiPath: "/api/edificacoes", basePath: "/edificacoes", linkKey: "id" },
  { label: "Sensores", icon: Cpu, color: "text-blue-500", apiPath: "/api/sensores", basePath: "/sensores", linkKey: "id" },
  { label: "Leituras", icon: Activity, color: "text-violet-500", apiPath: "/api/leituras", basePath: "/leituras", linkKey: "sensorId" },
  { label: "Alertas", icon: AlertTriangle, color: "text-amber-500", apiPath: "/api/notificacoes", basePath: "/notificacoes", linkKey: "id" },
]

export function DashboardCards({ counts }: { counts: Record<string, number> }) {
  const [loadingCard, setLoadingCard] = useState<string | null>(null)
  const [modalCard, setModalCard] = useState<CardConfig | null>(null)
  const [items, setItems] = useState<any[]>([])

  async function handleCardClick(card: CardConfig) {
    setLoadingCard(card.label)
    try {
      const res = await fetch(card.apiPath)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
      setModalCard(card)
    } catch {
      setItems([])
      setModalCard(card)
    } finally {
      setLoadingCard(null)
    }
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cardsConfig.map((card) => {
          const Icon = card.icon
          const count = counts[card.label] ?? 0
          return (
            <button
              key={card.label}
              onClick={() => handleCardClick(card)}
              disabled={loadingCard !== null}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm text-left transition-colors hover:bg-[var(--bg-secondary)] cursor-pointer disabled:opacity-70"
            >
              <div className="flex items-center gap-3">
                <div className={card.color}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
                  <p className="text-3xl font-bold">{count}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <Modal
        open={modalCard !== null}
        onClose={() => { setModalCard(null); setItems([]) }}
        title={modalCard?.label ?? ""}
      >
        {modalCard && (
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Nenhum item encontrado</p>
            ) : (
              items.map((item: any) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  card={modalCard}
                  onClose={() => { setModalCard(null); setItems([]) }}
                />
              ))
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

function ItemRow({ item, card, onClose }: { item: any; card: CardConfig; onClose: () => void }) {
  const href = card.linkKey === "sensorId"
    ? `/sensores/${item.sensorId}`
    : `${card.basePath}/${item.id}`

  const body = (
    <div className="rounded-lg border border-[var(--border)] p-3 text-sm transition-colors hover:bg-[var(--bg-secondary)]">
      {card.label === "Edificações" && (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{item.nome}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.clienteNome}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
        </div>
      )}
      {card.label === "Sensores" && (
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-medium truncate">{item.nome}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
              {item.edificacaoNome} &middot; {item.clienteNome}
            </p>
          </div>
          <span className="shrink-0 rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)] ml-2">
            {item.tipoSensor}
          </span>
        </div>
      )}
      {card.label === "Leituras" && (
        <Link href={`/sensores/${item.sensorId}`} onClick={onClose} className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium truncate">{item.sensorNome ?? `Sensor #${item.sensorId}`}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
              {item.clienteNome}{item.edificacaoNome ? ` \u00b7 ${item.edificacaoNome}` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-sm">
              {String(item.valor)} {item.unidade}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {item.lidaEm ? new Date(item.lidaEm).toLocaleString("pt-BR") : ""}
            </p>
          </div>
        </Link>
      )}
      {card.label === "Alertas" && (
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-medium truncate">{item.titulo}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.mensagem ?? ""}</p>
          </div>
          <span className="shrink-0 text-xs text-[var(--text-secondary)] ml-2">
            {item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR") : ""}
          </span>
        </div>
      )}
    </div>
  )

  if (card.label === "Leituras") return body

  return (
    <Link href={href} onClick={onClose} className="block">
      {body}
    </Link>
  )
}
