'use client'

import { useMemo } from 'react'

type Sitio = {
  id: string
  nombre: string
  tipo: string
  estado_operativo: string
  necesidades: string[]
  frescura: string
  ultimo_reporte_at: string | null
  personas_estimadas: number | null
}

type Props = {
  sitios: Sitio[]
  necesidadActiva: string | null
  onNecesidadClick: (n: string) => void
}

const NECESIDAD_EMOJI: Record<string, string> = {
  agua: '💧',
  alimentos: '🍽️',
  medicinas: '💊',
  higiene: '🧼',
  ropa: '👕',
  panales: '👶',
  colchones: '🛏️',
  frazadas: '🧣',
  voluntarios: '🙋',
}

function formatFecha(iso: string | null): string {
  if (!iso) return 'Sin fecha'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'hace 1 día'
  return `hace ${diff} días`
}

export function NecesidadesGrid({ sitios, necesidadActiva, onNecesidadClick }: Props) {
  const necesidadesStats = useMemo(() => {
    const map: Record<string, {
      totalSitios: number
      sitiosAbiertos: number
      sitiosDesactualizados: number
      ultimoReporte: string | null
    }> = {}

    for (const s of sitios) {
      for (const n of s.necesidades ?? []) {
        if (!map[n]) map[n] = { totalSitios: 0, sitiosAbiertos: 0, sitiosDesactualizados: 0, ultimoReporte: null }
        map[n].totalSitios++
        if (s.estado_operativo === 'abierto') map[n].sitiosAbiertos++
        if (s.frescura === 'desactualizado') map[n].sitiosDesactualizados++
        if (s.ultimo_reporte_at) {
          if (!map[n].ultimoReporte || s.ultimo_reporte_at > map[n].ultimoReporte!) {
            map[n].ultimoReporte = s.ultimo_reporte_at
          }
        }
      }
    }

    return Object.entries(map)
      .map(([nombre, stats]) => ({ nombre, ...stats }))
      .sort((a, b) => b.sitiosAbiertos - a.sitiosAbiertos)
  }, [sitios])

  return (
    <div className="bg-surface-card border border-hairline-strong rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-hairline">
        <h3 className="text-[18px] font-semibold text-ink">Necesidades más críticas</h3>
        <p className="text-sm text-body mt-0.5">Click en una necesidad para filtrar los sitios</p>
      </div>
      <div className="divide-y divide-hairline">
        {necesidadesStats.map((n) => {
          const desactualizadosPct = n.totalSitios > 0
            ? Math.round((n.sitiosDesactualizados / n.totalSitios) * 100)
            : 0
          const activa = necesidadActiva === n.nombre

          return (
            <button
              key={n.nombre}
              onClick={() => onNecesidadClick(n.nombre)}
              className={`w-full px-6 py-4 flex items-center gap-4 text-left transition-colors ${activa ? 'bg-surface-strong' : 'hover:bg-surface-strong'}`}
            >
              <span className="text-2xl w-8 shrink-0">
                {NECESIDAD_EMOJI[n.nombre] ?? '📦'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold capitalize ${activa ? 'text-ink' : 'text-ink'}`}>
                  {n.nombre}
                  {activa && <span className="ml-2 text-xs text-text-link">● activo</span>}
                </p>
                <p className="text-xs text-body mt-0.5">
                  {n.sitiosAbiertos} sitios abiertos · último reporte {formatFecha(n.ultimoReporte)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {desactualizadosPct > 50 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-error">
                    {desactualizadosPct}% desact.
                  </span>
                )}
                <span className="text-sm font-semibold text-ink w-6 text-right">
                  {n.totalSitios}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}