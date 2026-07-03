'use client'

import { useState } from 'react'

type Ingreso = {
  id: string
  nombre: string
  ubicacion: string | null
  procedencia: string | null
  edad: number | null
}

type Props = {
  ubicacion: string
  count: number
  personas: Ingreso[]
}

export function AccordionUbicacion({ ubicacion, count, personas }: Props) {
  const [open, setOpen] = useState(false)

  const sorted = [...personas].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es')
  )

  return (
    <div className="border-b border-hairline last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-surface-strong transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{ubicacion}</p>
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          <span className="text-sm text-body">{count.toLocaleString('es')} personas</span>
          <span className="text-muted text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="max-h-[300px] overflow-y-auto border-t border-hairline bg-canvas-soft">
          <button
            onClick={() => setOpen(false)}
            className="sticky top-0 w-full px-6 py-2 text-xs text-muted text-right bg-surface-strong hover:text-ink transition-colors border-b border-hairline"
          >
            Cerrar ▲
          </button>
          <div className="divide-y divide-hairline">
            {sorted.map((p) => (
              <div key={p.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate capitalize">{p.nombre.toLowerCase()}</p>
                  {p.procedencia && (
                    <p className="text-xs text-body mt-0.5">{p.procedencia}</p>
                  )}
                </div>
                {p.edad && (
                  <span className="text-xs text-muted shrink-0">{p.edad} años</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}