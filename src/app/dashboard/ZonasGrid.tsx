'use client'

import { useState, useMemo, useEffect } from 'react'

type Zona = {
  zone: string
  estado: string
  total: number
  resueltos: number
  faltantes: number
  pct: number
}

export function ZonasGrid({ zonas }: { zonas: Zona[] }) {
  const [mounted, setMounted] = useState(false)
  const [page, setPage] = useState(0)
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const pageSize = 9
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const estados = useMemo(() => {
    const unique = new Set(zonas.map(z => z.estado))
    return ['Todos', ...Array.from(unique)].filter(e => e !== 'Sin ubicación')
  }, [zonas])

  const zonasFiltradas = useMemo(() => {
    if (estadoFiltro === 'Todos') return zonas
    return zonas.filter(z => z.estado === estadoFiltro)
  }, [zonas, estadoFiltro])

  const totalPages = Math.ceil(zonasFiltradas.length / pageSize)
  const currentZonas = zonasFiltradas.slice(page * pageSize, (page + 1) * pageSize)

  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEstadoFiltro(e.target.value)
    setPage(0)
  }

  if (!mounted) {
    return (
      <div className="bg-surface-card border border-hairline-strong rounded-xl p-6 flex justify-center items-center h-64 mb-4">
        <p className="text-sm text-muted">Cargando zonas...</p>
      </div>
    )
  }

  return (
    <div className="bg-surface-card border border-hairline-strong rounded-xl overflow-hidden mb-4">
      <div className="px-6 py-4 border-b border-hairline flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h3 className="text-[18px] font-semibold text-ink">Zonas con mayor déficit</h3>
          <p className="text-sm text-body mt-0.5">Ordenadas por personas sin resolver</p>
        </div>
        <select 
          className="bg-canvas border border-hairline rounded-md px-3 py-1.5 text-sm font-medium text-ink outline-none focus:border-hairline-strong shadow-sm cursor-pointer"
          value={estadoFiltro}
          onChange={handleFiltroChange}
        >
          {estados.map(est => (
            <option key={est} value={est}>{est}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-6">
        {currentZonas.length > 0 ? currentZonas.map((z) => (
          <div key={z.zone} className="border border-hairline rounded-lg p-5 min-h-[110px] flex flex-col justify-between bg-surface shadow-md">
            <div className="mb-4">
              <p className="text-sm font-semibold text-ink leading-tight max-w-[180px]">{z.zone}</p>
              <p className="text-xs text-body mt-1">{z.total.toLocaleString('es')} registradas</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-success">{z.pct}%</span>
              <div className="flex-1 h-1.5 bg-surface-strong rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${z.pct}%` }} />
              </div>
              <span className="text-xs text-error font-semibold">-{z.faltantes.toLocaleString('es')}</span>
            </div>
          </div>
        )) : (
          <p className="text-sm text-muted col-span-full text-center py-8">No hay zonas para este estado.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-hairline flex items-center justify-between bg-canvas">
          <button 
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded bg-surface-strong text-sm font-semibold text-ink disabled:opacity-50 hover:bg-surface-hover transition-colors"
          >
            Anterior
          </button>
          <span className="text-xs text-body">Página {page + 1} de {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded bg-surface-strong text-sm font-semibold text-ink disabled:opacity-50 hover:bg-surface-hover transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
