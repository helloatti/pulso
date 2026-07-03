'use client'

import { useState, useEffect, useMemo } from 'react'

type Sitio = {
  id: string
  nombre: string
  tipo: string
  estado_operativo: string
}

export function SitiosGrid({ sitios }: { sitios: Sitio[] }) {
  const [mounted, setMounted] = useState(false)
  const [page, setPage] = useState(0)
  const [tipoFiltro, setTipoFiltro] = useState<string>('Todos')
  const pageSize = 8 // 2 columnas * 4 filas = 8 items
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const tipos = ['Todos', 'refugio', 'acopio', 'clinica', 'otro']

  const sitiosFiltrados = useMemo(() => {
    if (tipoFiltro === 'Todos') return sitios
    return sitios.filter(s => {
      const t = s.tipo.toLowerCase()
      if (tipoFiltro === 'otro') {
        return !['refugio', 'acopio', 'clinica'].includes(t)
      }
      return t === tipoFiltro
    })
  }, [sitios, tipoFiltro])

  const totalPages = Math.ceil(sitiosFiltrados.length / pageSize)
  const currentSitios = sitiosFiltrados.slice(page * pageSize, (page + 1) * pageSize)

  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipoFiltro(e.target.value)
    setPage(0)
  }

  if (!mounted) {
    return (
      <div className="bg-surface-card border border-hairline-strong rounded-xl p-6 flex justify-center items-center h-48 mb-6">
        <p className="text-sm text-muted">Cargando sitios...</p>
      </div>
    )
  }

  return (
    <div className="bg-surface-card border border-hairline-strong rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-hairline flex flex-wrap gap-4 justify-between items-center">
        <h3 className="text-[18px] font-semibold text-ink">Sitios activos</h3>
        
        <select 
          className="bg-canvas border border-hairline rounded-md px-3 py-1.5 text-sm font-medium text-ink outline-none focus:border-hairline-strong shadow-sm cursor-pointer capitalize"
          value={tipoFiltro}
          onChange={handleFiltroChange}
        >
          {tipos.map(t => (
            <option key={t} value={t} className="capitalize">{t}</option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
        {currentSitios.length > 0 ? currentSitios.map((s, index) => (
          <div key={`${s.id}-${index}`} className="border border-hairline rounded-lg p-5 min-h-[100px] flex items-center justify-between gap-4 bg-surface shadow-md">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink leading-tight max-w-[200px]">{s.nombre}</p>
              <p className="text-xs text-body mt-1 capitalize">{s.tipo}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${s.estado_operativo === 'abierto' ? 'bg-green-50 text-success' : 'bg-red-50 text-error'}`}>
              {s.estado_operativo}
            </span>
          </div>
        )) : (
          <p className="text-sm text-muted col-span-full text-center py-8">No hay sitios registrados para este filtro.</p>
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
