'use client'

import { useMemo } from 'react'

type Persona = {
  created_at: string
  status: string
}

type Props = {
  personas: Persona[]
}

export function LineaDeTiempo({ personas }: Props) {
  const datos = useMemo(() => {
    const map: Record<string, { total: number; resueltos: number }> = {}

    for (const p of personas) {
      const fecha = p.created_at.slice(0, 10)
      if (!map[fecha]) map[fecha] = { total: 0, resueltos: 0 }
      map[fecha].total++
      if (p.status === 'encontrado' || p.status === 'a_salvo') {
        map[fecha].resueltos++
      }
    }

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, s]) => ({
        fecha,
        label: new Date(fecha + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        total: s.total,
        resueltos: s.resueltos,
        sinResolver: s.total - s.resueltos,
      }))
  }, [personas])

  const maxTotal = Math.max(...datos.map((d) => d.total), 1)

  return (
    <div className="bg-surface-card border border-hairline-strong rounded-xl overflow-hidden mb-4">
      <div className="px-6 py-4 border-b border-hairline">
        <h3 className="text-[18px] font-semibold text-ink">Registros por día</h3>
        <p className="text-sm text-body mt-0.5">
          Nuevas personas registradas desde el sismo · verde = resueltas ese día
        </p>
      </div>

      <div className="px-6 py-6">
        <div className="flex items-end gap-2 h-40">
          {datos.map((d) => (
            <div key={d.fecha} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip */}
              <div className="hidden group-hover:flex flex-col items-center mb-1">
                <div className="bg-ink text-on-primary text-xs rounded px-2 py-1 whitespace-nowrap">
                  <p className="font-semibold">{d.label}</p>
                  <p>{d.total} registradas</p>
                  <p className="text-success">{d.resueltos} resueltas</p>
                </div>
              </div>

              {/* Bar */}
              <div
                className="w-full rounded-t-sm flex flex-col justify-end overflow-hidden"
                style={{ height: `${Math.max((d.total / maxTotal) * 100, 4)}%` }}
              >
                <div
                  className="w-full bg-success rounded-t-sm"
                  style={{ height: `${d.total > 0 ? (d.resueltos / d.total) * 100 : 0}%` }}
                />
                <div
                  className="w-full bg-error"
                  style={{ height: `${d.total > 0 ? (d.sinResolver / d.total) * 100 : 0}%` }}
                />
              </div>

              {/* Label */}
              <p className="text-[10px] text-muted text-center leading-tight">{d.label}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-success" />
            <span className="text-xs text-body">Resueltas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-error" />
            <span className="text-xs text-body">Sin resolver</span>
          </div>
        </div>
      </div>
    </div>
  )
}