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
        <div className="flex items-end gap-2" style={{ height: '160px' }}>
          {datos.map((d) => {
            const barHeight = Math.max((d.total / maxTotal) * 140, 4)
            const resueltosHeight = d.total > 0 ? (d.resueltos / d.total) * barHeight : 0
            const sinResolverHeight = barHeight - resueltosHeight

            return (
              <div key={d.fecha} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                  <div className="bg-ink text-on-primary text-xs rounded px-2 py-1 whitespace-nowrap text-center">
                    <p className="font-semibold">{d.label}</p>
                    <p>{d.total} registradas</p>
                    <p style={{ color: '#16a34a' }}>{d.resueltos} resueltas</p>
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full flex flex-col justify-end" style={{ height: `${barHeight}px` }}>
                  <div style={{ height: `${resueltosHeight}px`, backgroundColor: '#16a34a', borderRadius: resueltosHeight > 0 && sinResolverHeight === 0 ? '2px 2px 0 0' : '0' }} />
                  <div style={{ height: `${sinResolverHeight}px`, backgroundColor: '#eb8e90', borderRadius: sinResolverHeight > 0 ? '2px 2px 0 0' : '0' }} />
                </div>

                {/* Label */}
                <p className="text-[10px] text-muted text-center leading-tight mt-1">{d.label}</p>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-2">
          <div className="flex items-center gap-1.5">
            <div style={{ backgroundColor: '#16a34a' }} className="w-3 h-3 rounded-sm" />
            <span className="text-xs text-body">Resueltas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ backgroundColor: '#eb8e90' }} className="w-3 h-3 rounded-sm" />
            <span className="text-xs text-body">Sin resolver</span>
          </div>
        </div>
      </div>
    </div>
  )
}