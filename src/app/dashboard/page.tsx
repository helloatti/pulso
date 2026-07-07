import { AccordionUbicacion } from './AccordionUbicacion'
import { BuscadorPersonas } from './BuscadorPersonas'
import { ZonasGrid } from './ZonasGrid'
import { SitiosSection } from './SitiosSection'
import type { Ingreso } from './types'

export const revalidate = 43200

const API_BASE = 'https://venezuelareporta.org/api/v1'

type Persona = {
  id: string
  status: string
  nombre: string
  ciudad: string | null
  zona: string | null
  menor: boolean
  verificado: boolean
  created_at: string
}

type Sitio = {
  id: string
  tipo: string
  nombre: string
  estado_operativo: string
  necesidades: string[]
  frescura: string
  ultimo_reporte_at: string | null
  personas_estimadas: number | null
  lat: number | null
  lng: number | null
}

async function fetchAllPages<T>(endpoint: string, key: string, pageSize = 100): Promise<{ items: T[]; total: number }> {
  const first = await fetch(`${API_BASE}/${endpoint}?limit=${pageSize}&offset=0`, {
    next: { revalidate: 43200 },
  }).then((r) => r.json())

  const total = first.total ?? 0
  if (!total) return { items: first[key] ?? [], total: 0 }

  const pages = Math.ceil(total / pageSize)
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      fetch(`${API_BASE}/${endpoint}?limit=${pageSize}&offset=${(i + 1) * pageSize}`, {
        next: { revalidate: 43200 },
      }).then((r) => r.json())
    )
  )
  return {
    items: [first, ...rest].flatMap((r) => r[key] ?? []),
    total,
  }
}

function normalizeZoneName(name: string): string {
  if (!name || name === 'Sin ubicación' || name.trim().toLowerCase() === 'no indicada') return 'Sin ubicación'
  let n = name.trim().toLowerCase()
  if (n === 'la guaira' || n === 'guaira' || n === 'en la guaira' || n === 'vargas' || n === 'la guaria' || n === 'la guairá') return 'La Guaira'
  if (n === 'tanaguarenas' || n === 'tanaguarena') return 'Tanaguarena'
  if (n === 'maiquetia' || n === 'maiquetía') return 'Maiquetía'
  if (n === 'caribe la guaira' || n === 'la guaira caribe' || n === 'caribe, la guaira' || n === 'la guaira, caribe' || n === 'caribe' || n === 'el caribe') return 'Caribe La Guaira'
  if (n === 'catia la mar' || n === 'la guaira catia la mar' || n === 'catia la mar la guaira' || n === 'catia' || n === 'catia la mar, la guaira' || n === 'la guaira, catia la mar' || n === 'catia la mar playa grande' || n === 'playa grande catia la mar') return 'Catia La Mar'
  if (n === 'caraballeda' || n === 'caraballeda la guaira' || n === 'la guaira caraballeda' || n === 'caraballeda, la guaira' || n === 'la guaira, caraballeda') return 'Caraballeda'
  if (n === 'naiguata' || n === 'naiguatá' || n === 'naiguata la guaira' || n === 'naiguatá la guaira' || n === 'la guaira naiguata' || n === 'la guaira naiguatá') return 'Naiguatá'
  if (n === 'los cocos' || n === 'playa los cocos') return 'Playa Los Cocos'
  if (n === 'playa grande' || n === 'playa grande la guaira' || n === 'la guaira playa grande') return 'Playa Grande'
  if (n === 'los corales' || n === 'los corales la guaira' || n === 'la guaira los corales') return 'Los Corales'
  return n.split(/\s+/).map(word =>
    word ? word.charAt(0).toUpperCase() + word.slice(1) : ''
  ).join(' ')
}

function getEstadoPorZona(zona: string): string {
  const vargas = ['La Guaira', 'Tanaguarena', 'Maiquetía', 'Caribe La Guaira', 'Catia La Mar', 'Caraballeda', 'Naiguatá', 'Playa Los Cocos', 'Playa Grande', 'Los Corales', 'Macuto']
  if (vargas.includes(zona)) return 'La Guaira (Vargas)'
  if (zona === 'Caracas') return 'Distrito Capital'
  if (zona === 'Sin ubicación') return 'Sin ubicación'
  return 'Otros'
}

function calcZonas(personas: Persona[]) {
  const zones: Record<string, { total: number; resueltos: number; estado: string }> = {}
  for (const p of personas) {
    const rawZona = p.zona ?? p.ciudad ?? 'Sin ubicación'
    const z = normalizeZoneName(rawZona)
    const estado = getEstadoPorZona(z)
    if (!zones[z]) zones[z] = { total: 0, resueltos: 0, estado }
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
      estado: s.estado,
    }))
    .sort((a, b) => b.faltantes - a.faltantes)
}

function calcIngresosPorUbicacion(ingresos: Ingreso[]) {
  const map: Record<string, Ingreso[]> = {}
  for (const i of ingresos) {
    const u = i.ubicacion ?? 'Sin ubicación'
    if (!map[u]) map[u] = []
    map[u].push(i)
  }
  return Object.entries(map)
    .map(([ubicacion, personas]) => ({ ubicacion, personas, count: personas.length }))
    .sort((a, b) => b.count - a.count)
}

function KPICard({ label, value, sub, color = 'text-ink' }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="bg-surface-card border border-hairline-strong rounded-xl p-6">
      <p className="text-[11px] font-semibold tracking-[0.88px] uppercase text-muted mb-2">{label}</p>
      <p className={`text-[36px] font-semibold leading-none tracking-[-1.08px] ${color}`}>{value}</p>
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

export default async function PulsoDashboard() {
  const generado_at = new Date().toISOString()

  const [
    { items: personas, total: totalPersonas },
    { items: sitios, total: totalSitios },
    { items: ingresos, total: totalIngresos },
  ] = await Promise.all([
    fetchAllPages<Persona>('personas', 'personas'),
    fetchAllPages<Sitio>('sitios', 'sitios'),
    fetchAllPages<Ingreso>('ingresos', 'personas'),
  ])

  const resueltos = personas.filter((p) => p.status === 'encontrado' || p.status === 'a_salvo').length
  const sinResolver = totalPersonas - resueltos
  const menores = personas.filter((p) => p.menor).length
  const verificados = personas.filter((p) => p.verificado).length
  const pctResueltos = totalPersonas > 0 ? Math.round((resueltos / totalPersonas) * 100) : 0
  const sitiosUnicos = sitios.filter((s, i, arr) =>
    arr.findIndex((x) => x.nombre === s.nombre && x.lat === s.lat && x.lng === s.lng) === i
  )
  const sitiosAbiertos = sitiosUnicos.filter((s) => s.estado_operativo === 'abierto').length
  const sitiosDesconocidos = sitiosUnicos.filter((s) => s.estado_operativo === 'desconocido').length
  const zonas = calcZonas(personas)
  const ingresosPorUbicacion = calcIngresosPorUbicacion(ingresos).slice(0, 20)

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 font-sans">
      <div className="max-w-5xl mx-auto">

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

        <SectionHeader
          title="Buscador de personas"
          sub="Buscá a un familiar por nombre"
        />
        <BuscadorPersonas />

        <SectionHeader
          title="Personas"
          sub={`${totalPersonas.toLocaleString('es')} registradas en el sistema`}
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <KPICard label="Total" value={totalPersonas.toLocaleString('es')} />
          <KPICard label="Resueltos" value={`${pctResueltos}%`} sub={`${resueltos.toLocaleString('es')} personas`} color="text-success" />
          <KPICard label="Sin resolver" value={sinResolver.toLocaleString('es')} color="text-error" />
          <KPICard label="Menores" value={menores.toLocaleString('es')} sub={`${verificados.toLocaleString('es')} verificados`} />
        </div>

        <ZonasGrid zonas={zonas} />

        <SectionHeader
          title="Sitios"
          sub={`${totalSitios} sitios de acopio y refugio registrados`}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <KPICard label="Total sitios" value={totalSitios.toLocaleString('es')} />
          <KPICard label="Abiertos" value={sitiosAbiertos.toLocaleString('es')} color="text-success" />
          <KPICard label="Estado desconocido" value={sitiosDesconocidos.toLocaleString('es')} color="text-muted" />
        </div>

        <SitiosSection sitios={sitiosUnicos} />

        <SectionHeader
          title="Ingresos comunitarios"
          sub={`${totalIngresos.toLocaleString('es')} personas en listas comunitarias`}
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
          <div>
            {ingresosPorUbicacion.map((i) => (
              <AccordionUbicacion
                key={i.ubicacion}
                ubicacion={i.ubicacion}
                count={i.count}
                personas={i.personas}
              />
            ))}
          </div>
        </div>

        <p className="mt-12 text-xs text-muted text-center">
          Datos: <a href="https://venezuelareporta.org" className="text-text-link">venezuelareporta.org</a> · Actualizado cada 12h · Generado {new Date(generado_at).toLocaleString('es')}
        </p>
      </div>
    </main>
  )
}