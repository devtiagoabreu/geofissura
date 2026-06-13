"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ReativarButtonProps {
  apiPath: string
  redirectTo: string
}

export function ReativarButton({ apiPath, redirectTo }: ReativarButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleReativar() {
    setLoading(true)
    try {
      const res = await fetch(apiPath, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Edificação reativada com sucesso")
      router.push(redirectTo)
      router.refresh()
    } catch {
      toast.error("Erro ao reativar")
      setLoading(false)
    }
  }

  return (
    <Button size="sm" onClick={handleReativar} disabled={loading}>
      {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
      Reativar
    </Button>
  )
}
