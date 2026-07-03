'use client'

import { useEffect, useState } from 'react'

const API_BASE = 'https://venezuelareporta.org/api/v1'

type Persona = {
  id: string
  status: string
  nombre: string
  ciudad: string | null
  zona: string | null
  menor: boolean
  verificado: boolean
}

type Sitio = {
  id: string
  tipo: string
  nombre: string
  estado_operativo: string
  necesidades: string[]
  personas_estimadas: number | null
  frescura: string
}

type Ingreso = {
  id: string
  nombre: string
  ubicacion: string | null
  procedencia: string | null
}

type Stats = {
  totalPersonas: number
  resueltos: number
  sinResolver: number
  menores: number
  verificados: number
  pctResueltos: number
  zonas: { zone: string; total: number; resueltos: number; faltantes: number; pct: number }[]
  totalSitios: number
  sitiosAbiertos: number
  sitiosCerrados: number
  necesidades: { nombre: string; count: number }[]
  sitiosList: Sitio[]
  totalIngresos: number
  ingresosPorUbicacion: { ubicacion: string; count: number }[]
}

async function fetchAllPages<T>(
  endpoint: string,
  key: string,
  pageSize = 100
): Promise<{ items: T[]; total: number }> {
  const first = await fetch(`${API_BASE}/${endpoint}?limit=${pageSize}&offset=0`).then(
    (r) => r.json()
  )
  const total = first.total ?? first[key]?.length ?? 0
  if (!total) return { items: first[key] ?? [], total: 0 }

  const pages = Math.ceil(total / pageSize)
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      fetch(`${API_BASE}/${endpoint}?limit=${pageSize}&offset=${(i + 1) * pageSize}`).then((r) =>
        r.json()
      )
    )
  )
  return {
    items: [first, ...rest].flatMap((r) => r[key] ?? []),
    total,
  }
}

function calcZonas(personas: Persona[]) {
  const zones: Record<string, { total: number; resueltos: number }> = {}
  for (const p of personas) {
    const z = p.ciudad ?? p.zona ?? 'Sin ubicación'
    if (!zones[z]) zones[z] = { total: 0, resueltos: 0 }
    zones[z].total++
    if (p.status === 'encontrado' || p.status === 'a_salvo') zones[z].resueltos++
  }
  return Object.entries(zones)
    .map(([zone, s]) => ({
      zone,
      total: s.total,
      resueltos: s.resueltos,
      faltantes: s.total - s.resueltos,
      pct: Math.round((s.resueltos / s.total) * 100),
    }))
    .sort((a, b) => b.faltantes - a.faltantes)
}

function calcNecesidades(sitios: Sitio[]) {
  const map: Record<string, number> = {}
  for (const s of sitios) {
    for (const n of s.necesidades ?? []) {
      map[n] = (map[n] ?? 0) + 1
    }
  }
  return Object.entries(map)
    .map(([nombre, count]) => ({ nombre, count }))
    .sort((a, b) => b.count - a.count)
}

function calcIngresosPorUbicacion(ingresos: Ingreso[]) {
  const map: Record<string, number> = {}
  for (const i of ingresos) {
    const u = i.ubicacion ?? 'Sin ubicación'
    map[u] = (map[u] ?? 0) + 1
  }
  return Object.entries(map)
    .map(([ubicacion, count]) => ({ ubicacion, count }))
    .sort((a, b) => b.count - a.count)
}

function KPICard({
  label,
  value,
  sub,
  color = 'text-ink',
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-surface-card border border-hairline-strong rounded-xl p-6">
      <p className="text-[11px] font-semibold tracking-[0.88px] uppercase text-muted mb-2">
        {label}
      </p>
      <p className={`text-[36px] font-semibold leading-none tracking-[-1.08px] ${color}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-body mt-1">{sub}</p>}
    </div>
  )
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mt-12 mb-6 border-b border-hairline pb-4">
      <h2 className="text-[28px] font-semibold tracking-[-0.84px] text-ink">{title}</h2>
      {sub && <p className="text-sm text-body mt-1">{sub}</p>}
    </div>
  )
}

export default function PulsoDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState('Cargando datos...')

  useEffect(() => {
    async function load() {
      try {
        setProgress('Cargando personas...')
        const { items: personas, total: totalPersonas } = await fetchAllPages<Persona>(
          'personas',
          'personas',
          100
        )

        setProgress('Cargando sitios...')
        const { items: sitios, total: totalSitios } = await fetchAllPages<Sitio>(
          'sitios',
          'sitios',
          100
        )

        setProgress('Cargando ingresos...')
        const { items: ingresos, total: totalIngresos } = await fetchAllPages<Ingreso>(
          'ingresos',
          'personas',
          100
        )

        const resueltos = personas.filter(
          (p) => p.status === 'encontrado' || p.status === 'a_salvo'
        ).length
        const sinResolver = totalPersonas - resueltos
        const menores = personas.filter((p) => p.menor).length
        const verificados = personas.filter((p) => p.verificado).length
        const pctResueltos = totalPersonas > 0 ? Math.round((resueltos / totalPersonas) * 100) : 0

        const sitiosAbiertos = sitios.filter((s) => s.estado_operativo === 'abierto').length
        const sitiosCerrados = sitios.filter((s) => s.estado_operativo === 'cerrado').length

        setStats({
          totalPersonas,
          resueltos,
          sinResolver,
          menores,
          verificados,
          pctResueltos,
          zonas: calcZonas(personas),
          totalSitios,
          sitiosAbiertos,
          sitiosCerrados,
          necesidades: calcNecesidades(sitios),
          sitiosList: sitios.slice(0, 15),
          totalIngresos,
          ingresosPorUbicacion: calcIngresosPorUbicacion(ingresos).slice(0, 15),
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <span className="text-[11px] font-semibold tracking-[0.88px] uppercase text-muted">
            Localizalo · Dashboard
          </span>
          <h1 className="mt-2 text-[36px] font-semibold leading-[1.15] tracking-[-1.08px] text-ink">
            Pulso
          </h1>
          <p className="mt-2 text-body text-base">
            Vista en tiempo real del estado de la búsqueda: zonas críticas, sitios de acopio y personas registradas.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-body">{progress}</p>
          </div>
        ) : stats ? (
          <>
            {/* ── PERSONAS ── */}
            <SectionHeader
              title="Personas"
              sub={`${stats.totalPersonas.toLocaleString('es')} registradas en el sistema`}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <KPICard label="Total" value={stats.totalPersonas.toLocaleString('es')} />
              <KPICard
                label="Resueltos"
                value={`${stats.pctResueltos}%`}
                sub={`${stats.resueltos.toLocaleString('es')} personas`}
                color="text-success"
              />
              <KPICard
                label="Sin resolver"
                value={stats.sinResolver.toLocaleString('es')}
                color="text-error"
              />
              <KPICard
                label="Menores"
                value={stats.menores.toLocaleString('es')}
                sub={`${stats.verificados.toLocaleString('es')} verificados`}
              />
            </div>

            {/* Zonas */}
            <div className="bg-surface-card border border-hairline-strong rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-hairline">
                <h3 className="text-[18px] font-semibold text-ink">Zonas con mayor déficit</h3>
                <p className="text-sm text-body mt-0.5">Ordenadas por personas sin resolver</p>
              </div>
              <div className="divide-y divide-hairline">
                {stats.zonas.slice(0, 20).map((z) => (
                  <div key={z.zone} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{z.zone}</p>
                      <p className="text-xs text-body mt-0.5">{z.total.toLocaleString('es')} registradas</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-surface-strong rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full" style={{ width: `${z.pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-success w-8 text-right">{z.pct}%</span>
                      <span className="text-xs text-error font-semibold w-20 text-right">-{z.faltantes.toLocaleString('es')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SITIOS ── */}
            <SectionHeader
              title="Sitios"
              sub={`${stats.totalSitios} sitios de acopio y refugio registrados`}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <KPICard label="Total sitios" value={stats.totalSitios.toLocaleString('es')} />
              <KPICard label="Abiertos" value={stats.sitiosAbiertos.toLocaleString('es')} color="text-success" />
              <KPICard label="Cerrados" value={stats.sitiosCerrados.toLocaleString('es')} color="text-error" />
            </div>

            {/* Necesidades */}
            <div className="bg-surface-card border border-hairline-strong rounded-xl overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-hairline">
                <h3 className="text-[18px] font-semibold text-ink">Necesidades más críticas</h3>
              </div>
              <div className="px-6 py-4 flex flex-wrap gap-2">
                {stats.necesidades.map((n) => (
                  <span key={n.nombre} className="inline-flex items-center gap-1.5 bg-surface-strong rounded-full px-3 py-1 text-xs font-semibold text-ink">
                    {n.nombre}
                    <span className="text-muted font-normal">×{n.count}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Sitios list */}
            <div className="bg-surface-card border border-hairline-strong rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-hairline">
                <h3 className="text-[18px] font-semibold text-ink">Sitios activos</h3>
              </div>
              <div className="divide-y divide-hairline">
                {stats.sitiosList.map((s) => (
                  <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{s.nombre}</p>
                      <p className="text-xs text-body mt-0.5 capitalize">{s.tipo}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.estado_operativo === 'abierto' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      {s.estado_operativo}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── INGRESOS ── */}
            <SectionHeader
              title="Ingresos comunitarios"
              sub={`${stats.totalIngresos.toLocaleString('es')} personas en listas comunitarias`}
            />
            <div className="bg-surface-strong border border-hairline-strong rounded-xl px-6 py-4 mb-6">
              <p className="text-sm text-body">
                ⚠️ <strong>Importante:</strong> aparecer en una lista comunitaria no confirma que la persona esté a salvo. Verificá siempre en el lugar.
              </p>
            </div>
            <div className="bg-surface-card border border-hairline-strong rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-hairline">
                <h3 className="text-[18px] font-semibold text-ink">Por ubicación</h3>
              </div>
              <div className="divide-y divide-hairline">
                {stats.ingresosPorUbicacion.map((i) => (
                  <div key={i.ubicacion} className="px-6 py-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink truncate flex-1">{i.ubicacion}</p>
                    <span className="text-sm text-body ml-4">{i.count.toLocaleString('es')}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-body text-center py-32">No se pudieron cargar los datos.</p>
        )}

        <p className="mt-12 text-xs text-muted text-center">
          Datos: <a href="https://venezuelareporta.org" className="text-text-link">venezuelareporta.org</a> · Localizalo {new Date().getFullYear()}
        </p>
      </div>
    </main>
  )
}