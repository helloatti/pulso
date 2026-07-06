'use client'

import { useState, useCallback, useEffect } from 'react'

type PersonaResult = {
  id: string
  nombre: string
  status: string
  ciudad: string | null
  zona: string | null
  edad: number | null
  cedula: string | null
  descripcion: string | null
  ultima_vez: string | null
  verificado: boolean
  foto_url: string | null
  ficha_url: string | null
  menor: boolean
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  encontrado: { label: 'Encontrado', color: 'bg-green-50 text-success' },
  a_salvo: { label: 'A salvo', color: 'bg-green-50 text-success' },
  buscando: { label: 'Buscando', color: 'bg-red-50 text-error' },
  desaparecido: { label: 'Desaparecido', color: 'bg-red-50 text-error' },
  unknown: { label: 'Desconocido', color: 'bg-surface-strong text-muted' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? STATUS_LABEL.unknown
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>
  )
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-canvas rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export function BuscadorPersonas() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PersonaResult[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const buscar = useCallback(async (q: string) => {
    if (q.trim().length < 2) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(
        `https://venezuelareporta.org/api/v1/personas?q=${encodeURIComponent(q)}&limit=20&offset=0`
      ).then((r) => r.json())
      setResults(res.personas ?? [])
      setTotal(res.total ?? 0)
    } catch {
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
    setQuery('')
    setResults([])
    setTotal(null)
    setSearched(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') buscar(query)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 bg-surface-card border border-hairline-strong rounded-xl px-6 py-4 text-left hover:bg-surface-strong transition-colors"
      >
        <span className="text-xl">🔍</span>
        <div>
          <p className="text-sm font-semibold text-ink">Buscar persona</p>
          <p className="text-xs text-body mt-0.5">Buscá a un familiar por nombre entre 50.000+ registros</p>
        </div>
        <span className="ml-auto text-muted text-sm">→</span>
      </button>

      {/* Modal */}
      {open && (
        <Modal onClose={handleClose}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-hairline flex items-center justify-between shrink-0">
            <h3 className="text-[18px] font-semibold text-ink">Buscar persona</h3>
            <button onClick={handleClose} className="text-muted hover:text-ink text-xl leading-none">×</button>
          </div>

          {/* Search input */}
          <div className="px-6 py-4 border-b border-hairline shrink-0">
            <div className="flex gap-3">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nombre completo o parcial..."
                className="flex-1 bg-canvas border border-hairline-strong rounded-lg px-4 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-ink transition-colors"
              />
              <button
                onClick={() => buscar(query)}
                disabled={loading || query.trim().length < 2}
                className="px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-[#1a1a1a] transition-colors"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {total !== null && searched && (
              <p className="text-xs text-body mt-2">
                {total === 0
                  ? 'No se encontraron resultados'
                  : `${total.toLocaleString('es')} resultados · mostrando primeros 20`}
              </p>
            )}
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1">
            {results.length > 0 && (
              <div className="divide-y divide-hairline">
                {results.map((p) => (
                  <div key={p.id} className="px-6 py-4 flex gap-4">
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nombre} className="w-12 h-12 rounded-lg object-cover shrink-0 bg-surface-strong" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-surface-strong shrink-0 flex items-center justify-center text-muted text-lg">
                        {p.menor ? '👶' : '👤'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-ink capitalize">{p.nombre.toLowerCase()}</p>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        {(p.ciudad || p.zona) && <p className="text-xs text-body">{p.ciudad ?? p.zona}</p>}
                        {p.edad && <p className="text-xs text-body">{p.edad} años</p>}
                        {p.cedula && <p className="text-xs text-body font-mono">{p.cedula}</p>}
                      </div>
                      {p.descripcion && <p className="text-xs text-body mt-1 italic">{p.descripcion}</p>}
                      {p.ultima_vez && <p className="text-xs text-muted mt-0.5">Última vez: {p.ultima_vez}</p>}
                      {p.verificado && <p className="text-xs text-success mt-0.5">✓ Verificado</p>}
                    </div>
                    {p.ficha_url && (
                      <a href={p.ficha_url} target="_blank" rel="noopener noreferrer" className="text-xs text-text-link hover:underline shrink-0 self-start mt-1">
                        Ver ficha →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            {searched && !loading && results.length === 0 && (
              <div className="px-6 py-8 text-center text-body text-sm">
                No se encontraron personas con ese nombre.
              </div>
            )}
            {!searched && (
              <div className="px-6 py-8 text-center text-body text-sm">
                Escribí un nombre y presioná Buscar o Enter.
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}