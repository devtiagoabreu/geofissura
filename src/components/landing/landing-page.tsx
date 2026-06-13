"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  Building2,
  Sun,
  Moon,
  Activity,
  LineChart,
  AlertTriangle,
  FileText,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Shield,
  BarChart3,
  Bell,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { NeonBackground } from "@/components/landing/neon-background"

const navLinks = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Planos", href: "#planos" },
  { label: "Contato", href: "#contato" },
]

const features = [
  {
    icon: Activity,
    title: "Monitoramento em Tempo Real",
    description: "Sensores IoT transmitem dados de fissuras, inclinação e umidade 24/7 com alertas instantâneos.",
  },
  {
    icon: LineChart,
    title: "Dashboard Analítico",
    description: "Gráficos interativos e relatórios automáticos para acompanhar a evolução das medições.",
  },
  {
    icon: AlertTriangle,
    title: "Alertas Inteligentes",
    description: "Notificações por email e SMS quando os parâmetros ultrapassam os limites de segurança.",
  },
  {
    icon: FileText,
    title: "Laudos e Relatórios",
    description: "Geração automática de laudos técnicos em PDF com histórico completo das medições.",
  },
  {
    icon: Shield,
    title: "Multi-empresas",
    description: "Gestão multi-cliente com isolamento total de dados entre construtoras e obras.",
  },
  {
    icon: Smartphone,
    title: "Acesso Mobile",
    description: "Acompanhe suas edificações de qualquer lugar com interface responsiva e otimizada.",
  },
]

const steps = [
  {
    num: "01",
    title: "Instalação dos Dispositivos",
    description: "Nossa equipe instala os sensores IoT nas fissuras e pontos críticos da sua edificação.",
  },
  {
    num: "02",
    title: "Monitoramento Contínuo",
    description: "Cada dispositivo monitora em tempo real e envia dados automaticamente para a plataforma.",
  },
  {
    num: "03",
    title: "Pague por Dispositivo",
    description: "Você paga por dispositivo instalado mensalmente + plano de dados na nossa nuvem. Sem surpresas.",
  },
]

const stats = [
  { value: "10.000+", label: "Sensores ativos" },
  { value: "500+", label: "Edificações monitoradas" },
  { value: "99.9%", label: "Uptime da plataforma" },
  { value: "< 2s", label: "Tempo de alerta" },
]

export function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">GeoFissura</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                  Entrar
                </Button>
              </Link>
              <a href="https://wa.me/5511971878811" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Solicitar Orçamento</Button>
              </a>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-[var(--text-secondary)] md:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--bg-primary)] px-4 pb-4 md:hidden">
            <nav className="flex flex-col gap-1 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                    Entrar
                  </Button>
                </Link>
                <a href="https://wa.me/5511971878811" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Solicitar Orçamento</Button>
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <section className="relative min-h-[600px] overflow-hidden bg-[#030712] pt-24 md:pt-32">
          <NeonBackground />
          <div className="absolute inset-0">
            <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 md:px-6 md:pb-32">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                Monitoramento inteligente de{" "}
                <span className="gradient-text">edificações</span>
              </h1>

              <p className="mt-4 text-base text-white/60 md:text-lg">
                Plataforma completa para monitoramento de fissuras, trincas e
                movimentações estruturais com sensores IoT, alertas em tempo real
                e relatórios automáticos.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a href="https://wa.me/5511971878811" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white sm:w-auto">
                    Solicitar Orçamento
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <Link href="#recursos">
                  <Button variant="outline" size="lg" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 sm:w-auto">
                    Ver Recursos
                  </Button>
                </Link>
              </div>

              <div className="mt-12 flex items-center justify-center gap-8 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Dispositivos instalados in loco
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Pagamento mensal por dispositivo
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Suporte 24/7
                </span>
              </div>
            </div>

            <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl">
              <div className="overflow-hidden rounded-xl bg-[#0a0f1a]">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs text-white/40">Dashboard — Edifício Comercial Aurora</span>
                </div>
                <div className="grid grid-cols-3 gap-px bg-white/10">
                  {[
                    { label: "Fissura #01", value: "2.4mm", status: "normal" },
                    { label: "Inclinação", value: "0.02°", status: "normal" },
                    { label: "Temperatura", value: "26°C", status: "normal" },
                    { label: "Umidade", value: "68%", status: "alerta" },
                    { label: "Pressão", value: "1.02 bar", status: "normal" },
                    { label: "Sismos", value: "0.2mm/s", status: "normal" },
                  ].map((item) => (
                    <div key={item.label} className="bg-[#0a0f1a] p-4 md:p-6">
                      <p className="text-xs text-white/40">{item.label}</p>
                      <p className="mt-1 text-2xl font-bold text-white md:text-3xl">{item.value}</p>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === "normal"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : item.status === "alerta"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === "normal"
                              ? "bg-emerald-400"
                              : item.status === "alerta"
                                ? "bg-yellow-400"
                                : "bg-red-400"
                          }`}
                        />
                        {item.status === "normal" ? "Normal" : item.status === "alerta" ? "Alerta" : "Crítico"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 px-4 py-2">
                  <span className="text-xs text-white/30">Demais sensores</span>
                </div>
                <div className="grid grid-cols-3 gap-px bg-white/10">
                  {[
                    { label: "Fissura #02", value: "3.1mm", status: "critico" },
                    { label: "Fissura #03", value: "1.8mm", status: "alerta" },
                    { label: "Fissura #04", value: "0.7mm", status: "normal" },
                  ].map((item) => (
                    <div key={item.label} className="bg-[#0a0f1a] p-4 md:p-6">
                      <p className="text-xs text-white/40">{item.label}</p>
                      <p className="mt-1 text-2xl font-bold text-white md:text-3xl">{item.value}</p>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === "normal"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : item.status === "alerta"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === "normal"
                              ? "bg-emerald-400"
                              : item.status === "alerta"
                                ? "bg-yellow-400"
                                : "bg-red-400"
                          }`}
                        />
                        {item.status === "normal" ? "Normal" : item.status === "alerta" ? "Alerta" : "Crítico"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold md:text-4xl gradient-text">{stat.value}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="recursos" className="py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                Tudo que você precisa para monitorar
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                Da instalação dos sensores à geração de laudos, uma plataforma
                completa para engenheiros e construtoras.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="group rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-[var(--border)] bg-[var(--bg-secondary)] py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                Como funciona
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                Em três passos simples você começa a monitorar suas edificações.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.num} className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-xl font-bold text-[var(--brand)]">
                    {step.num}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-[var(--text-secondary)]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-16 text-center md:px-16">
              <div className="absolute inset-0 -z-10">
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/5" />
              </div>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
        Monitore suas edificações
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
        Instalamos nossos dispositivos IoT nas suas edificações.
        Você paga por dispositivo instalado por mês + plano de dados na nuvem.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a href="https://wa.me/5511971878811" target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    className="w-full bg-white text-emerald-700 hover:bg-white/90 sm:w-auto"
                  >
                    Solicitar Orçamento
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </a>
                <Link href="#contato">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-white/30 text-white hover:bg-white/10 sm:w-auto"
                  >
                    Falar com Vendas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contato" className="border-t border-[var(--border)] py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)]">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">GeoFissura</span>
              </div>
              <p className="mt-4 max-w-md text-sm text-[var(--text-secondary)]">
                Plataforma de monitoramento inteligente de edificações. Soluções
                completas para engenharia civil e construção civil.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Produto</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li><Link href="#recursos" className="hover:text-[var(--text-primary)]">Recursos</Link></li>
                <li><Link href="#como-funciona" className="hover:text-[var(--text-primary)]">Como Funciona</Link></li>
                <li><Link href="#planos" className="hover:text-[var(--text-primary)]">Planos</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Empresa</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li><Link href="#" className="hover:text-[var(--text-primary)]">Sobre</Link></li>
                <li><Link href="#" className="hover:text-[var(--text-primary)]">Blog</Link></li>
                <li><Link href="#" className="hover:text-[var(--text-primary)]">Contato</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--text-secondary)]">
            <p>&copy; {new Date().getFullYear()} GeoFissura. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
