import Link from 'next/link'
import { notFound } from 'next/navigation'
import datos from '../../../data/cruce.json'
import { ORIGENES } from '../../../lib/clasificar'
import { celda, flecha, pesos, destinosVisibles, MINIMO } from '../../../lib/reglas'
import { PUERTAS, PUERTAS_ORDEN, PRUEBAS_ORIGEN } from '../../../lib/puertas'

export function generateStaticParams() {
  return Object.keys(ORIGENES).map(clave => ({ clave }))
}

export async function generateMetadata({ params }) {
  const { clave } = await params
  return { title: ORIGENES[clave] ? `Cruce · ${ORIGENES[clave].largo}` : 'Cruce' }
}

const pct = x => `${Math.round(x * 100)}%`

function Ingreso({ p }) {
  if (!p || celda(p.n) !== 'visible') {
    return <p className="text-xs text-neutral-600">¿Les subió o bajó el ingreso? No sabemos: muy pocas personas dijeron su ingreso antes y después.</p>
  }
  return <p className="text-xs text-neutral-700">De {p.n} que dijeron su ingreso antes y después: <b className="sube">{p.sube} ganaron más</b>, {p.igual} igual, <b className="baja">{p.baja} ganaron menos</b>.</p>
}

export default async function Mapa({ params }) {
  const { clave } = await params
  const o = datos.origenes[clave]
  if (!o || !ORIGENES[clave]) notFound()
  const salOrigen = datos.salarios[clave]?.mediana
  const visibles = destinosVisibles(o)
  const soloPuesto = o.cambio_crudo - o.cambio_estricto
  const pruebas = PRUEBAS_ORIGEN[clave] || []

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm text-neutral-600"><Link href="/" className="liga">← Cambiar de trabajo</Link></p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">{ORIGENES[clave].largo}</h1>
        <p className="text-sm text-neutral-600">Clave INEGI (SINCO) {clave} · unas {o.personas_estimadas.toLocaleString('es-MX')} personas en México hacen este trabajo, según la ENOE.</p>
        {salOrigen && <p className="mt-2">En tu trabajo, el sueldo típico es <b>{pesos(salOrigen)} al mes</b>.</p>}
      </section>

      {/* ===== OBSERVED LAYER ===== */}
      <section className="space-y-3" data-capa="observado">
        <span className="etiqueta et-obs">Observado · INEGI ENOE 2024–2026</span>
        <h2 className="text-xl font-bold">A dónde se fueron</h2>
        <p className="text-sm">
          El INEGI entrevista a las mismas personas cada 3 meses. Las buscamos otra vez 3 meses después ({o.encontrados.toLocaleString('es-MX')} veces entre 2024 y 2026):
          {' '}{o.misma_ocupacion.toLocaleString('es-MX')} seguían en lo mismo, {o.sin_trabajo.toLocaleString('es-MX')} estaban sin trabajo,
          {' '}{soloPuesto.toLocaleString('es-MX')} cambiaron solo el nombre del puesto (casi seguro, el mismo trabajo) y
          {' '}<b>{o.cambio_estricto.toLocaleString('es-MX')} cambiaron de trabajo y de tipo de empresa</b>. Esos son los cambios de abajo.
        </p>

        <div className="ruido text-sm" data-testid="ruido">
          <b>⚠️ Cuidado, hay ruido.</b> Entre quienes siguieron en el mismo trabajo, {pct(o.ruido_industria_en_los_que_se_quedaron)} aparecen con otro tipo de empresa de una entrevista a la siguiente.
          O sea, el INEGI a veces anota distinto el mismo trabajo, y parte de los cambios de abajo puede no ser un cambio real.
        </div>

        <ol className="space-y-2">
          {visibles.map(d => {
            const f = flecha(datos.salarios[d.clave]?.mediana, salOrigen)
            return (
              <li key={d.clave} className="tarjeta" data-destino={d.clave}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{d.nombre}</p>
                    <p className="text-sm"><b>{d.n}</b> de {o.cambio_estricto} cambios</p>
                    {datos.salarios[d.clave]?.mediana && (
                      <p className="text-sm">Sueldo típico ahí: {pesos(datos.salarios[d.clave].mediana)} al mes{f && <> · <span className={f.clase}>{f.texto} que en tu trabajo</span></>}</p>
                    )}
                    <p className="text-sm">Sin prestaciones (informal): {d.informal_antes} antes → <b>{d.informal_despues}</b> después</p>
                    <Ingreso p={d.ingreso_pareado} />
                  </div>
                  {f && <span className={`flecha ${f.clase}`} aria-label={f.texto}>{f.simbolo}</span>}
                </div>
              </li>
            )
          })}
        </ol>

        <div className="nosabemos" data-testid="no-sabemos">
          <b>No sabemos:</b> {o.otros.n} cambios más se repartieron en {o.otros.ocupaciones} trabajos distintos, con menos de {MINIMO} casos cada uno.
          Con tan pocos casos no mostramos sueldo ni flecha. Que haya tantos huecos también es un dato: en México casi no hay registro de a dónde se va la gente de este trabajo.
        </div>

        <div className="tarjeta text-sm">
          <p><b>En total, sin prestaciones (informal):</b> {o.informal_antes} de {o.cambio_estricto} antes de cambiar → <b>{o.informal_despues}</b> después.</p>
          {o.ingreso_pareado && o.control_se_quedaron && (
            <p className="mt-1">Ingreso de quienes cambiaron y lo dijeron antes y después ({o.ingreso_pareado.n}): cambio típico {o.ingreso_pareado.mediana_cambio >= 0 ? '+' : ''}{pct(o.ingreso_pareado.mediana_cambio)}.
              Los que se quedaron ({o.control_se_quedaron.n}): {o.control_se_quedaron.mediana_cambio >= 0 ? '+' : ''}{pct(o.control_se_quedaron.mediana_cambio)}.</p>
          )}
          <p className="mt-1 text-xs text-neutral-600">La flecha compara el sueldo típico de todos los que trabajan en ese destino con el de tu trabajo. No es lo que tú ganarías. Están ordenados por cuántas personas se fueron ahí, no por sueldo.</p>
        </div>
      </section>

      {/* ===== POSSIBLE LAYER — never borrows the observed layer's numbers ===== */}
      <section className="space-y-3" data-capa="posible">
        <span className="etiqueta et-pos">Camino posible, no observado</span>
        <h2 className="text-xl font-bold">Qué puerta hay que cruzar</h2>
        <p className="text-sm">Requisitos y certificados para algunos trabajos. Esto no son datos de a dónde fue la gente: son reglas que revisamos a mano, con su fuente.</p>
        {PUERTAS_ORDEN.map(c => {
          const p = PUERTAS[c]
          if (!p.verificada) return (
            <div key={c} className="puerta-no text-sm" data-puerta={c}><b>{p.titulo}:</b> puerta no verificada, así que no la mostramos.</div>
          )
          return (
            <div key={c} className="puerta text-sm" data-puerta={c}>
              <p className="font-semibold">{p.titulo}</p>
              <p className="mt-1">{p.requisito}</p>
              <p className="mt-1 text-neutral-600">{p.noVerificado}</p>
              <ul className="mt-1 text-xs" style={{ color: 'var(--color-posible)' }}>
                {p.fuentes.map(f => <li key={f.url}>Fuente: <a className="liga" href={f.url} target="_blank" rel="noopener noreferrer">{f.nombre}</a></li>)}
                <li>Verificado el {p.verificado}</li>
              </ul>
            </div>
          )
        })}
      </section>

      <section className="space-y-3" data-capa="prueba">
        <h2 className="text-xl font-bold">Lleva tu prueba contigo</h2>
        {pruebas.length === 0
          ? <p className="puerta-no text-sm">Para este trabajo no verificamos un certificado oficial. No lo mostramos.</p>
          : <>
              <p className="text-sm">Certificados oficiales (CONOCER) de lo que <b>ya sabes hacer</b>. Te evalúa una persona que te ve trabajar, no un examen que una IA pueda contestar por ti. Lo puedes sacar mientras todavía tienes trabajo.</p>
              {pruebas.map(p => (
                <div key={p.codigo} className="tarjeta text-sm" data-prueba={p.codigo}>
                  <p className="font-semibold">{p.codigo} · {p.titulo}</p>
                  <p>{p.detalle}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-posible)' }}>Fuente: <a className="liga" href={p.fuente.url} target="_blank" rel="noopener noreferrer">{p.fuente.nombre}</a> · verificado el {p.verificado}</p>
                </div>
              ))}
              <p className="text-xs text-neutral-600">Costo: depende del centro evaluador; no lo verificamos para 2026.</p>
            </>}
      </section>
    </div>
  )
}
