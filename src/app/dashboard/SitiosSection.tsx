'use client'

import { useState } from 'react'
import { NecesidadesGrid } from './NecesidadesGrid'
import { SitiosGrid } from './SitiosGrid'

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

export function SitiosSection({ sitios }: { sitios: Sitio[] }) {
  const [necesidadFiltro, setNecesidadFiltro] = useState<string | null>(null)

  const sitiosFiltrados = necesidadFiltro
    ? sitios.filter((s) => s.necesidades?.includes(necesidadFiltro))
    : sitios

  return (
    <>
      <NecesidadesGrid
        sitios={sitios}
        necesidadActiva={necesidadFiltro}
        onNecesidadClick={(n) => setNecesidadFiltro(n === necesidadFiltro ? null : n)}
      />
      {necesidadFiltro && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-body">
            Mostrando sitios que necesitan <strong className="text-ink capitalize">{necesidadFiltro}</strong>
          </span>
          <button
            onClick={() => setNecesidadFiltro(null)}
            className="text-xs text-text-link hover:underline"
          >
            Ver todos
          </button>
        </div>
      )}
      <SitiosGrid sitios={sitiosFiltrados} />
    </>
  )
}