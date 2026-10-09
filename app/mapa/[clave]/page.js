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
const personas = n => `${n} ${n === 1 ? 'persona' : 'personas'}`
// INEGI names are long ("Telefonistas y telegrafistas"); the summary uses the first part.
const corto = n => n.split(/,| y | \(/)[0].trim().toLowerCase()

function resumenSueldo(o) {
  const m = o.ingreso_pareado.mediana_cambio, c = o.control_se_quedaron.mediana_cambio
  const signo = x => `${x >= 0 ? '+' : ''}${pct(x)}`
  const igual = Math.abs(m - c) <= 0.03
  return `${igual ? 'en general les fue igual que a quienes se quedaron' : m > c ? 'en general ganaron un poco más que quienes se quedaron' : 'en general ganaron menos que quienes se quedaron'}. De las ${o.ingreso_pareado.n} que dijeron cuánto ganaban antes y después, el cambio típico fue ${signo(m)}; de las ${o.control_se_quedaron.n} que se quedaron, ${signo(c)}.`
}

function Tarjeta({ d, o, salOrigen }) {
  const sal = datos.salarios[d.clave]?.mediana
  const f = flecha(sal, salOrigen)
  return (
    <li className="tarjeta" data-destino={d.clave}>
      <p className="font-semibold">{d.nombre}</p>
      <p className="text-sm"><b>{d.n}</b> de {o.cambio_estricto} cambios se fueron aquí</p>
      {sal && (
        <p className="text-sm">Sueldo típico de todos los que trabajan ahí: {pesos(sal)} al mes{f && <> <span className={`font-bold ${f.clase}`} aria-label={f.texto}>{f.simbolo} {f.texto} que en tu trabajo</span></>}</p>
      )}
      <p className="text-sm">Sin prestaciones: {personas(d.informal_antes)} antes de cambiar → <b>{personas(d.informal_despues)}</b> después</p>
      <Ingreso p={d.ingreso_pareado} />
    </li>
  )
}

function Ingreso({ p }) {
  if (!p || celda(p.n) !== 'visible') {
    return <p className="text-xs text-neutral-600">¿A ellas mismas les subió o bajó el sueldo al cambiar? No sabemos: muy pocas dijeron cuánto ganaban.</p>
  }
  return <p className="mt-1 rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-800"><b>Lo que les pasó a ellas al cambiar</b> (de {p.n} que dijeron cuánto ganaban): {p.sube} ganaron más, {p.igual} igual, {p.baja} ganaron menos.</p>
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

      {/* Persona test round 1 (Marisol): she quit at screen 6; the answer to HER question was at the bottom. Now it's first. */}
      <section className="regla space-y-2" data-testid="en-corto">
        <h2 className="text-lg font-bold">En corto: ¿a los que se fueron les fue mejor o peor?</h2>
        {o.ingreso_pareado && o.control_se_quedaron && (
          <p><b>Sueldo:</b> {resumenSueldo(o)}</p>
        )}
        <p><b>Prestaciones:</b> {o.informal_despues > o.informal_antes ? 'más personas quedaron sin prestaciones' : 'no aumentaron los que quedaron sin prestaciones'}: antes de cambiar, {o.informal_antes} de {o.cambio_estricto} no tenían (un {pct(o.informal_antes / o.cambio_estricto)}); después, <b>{o.informal_despues} ({pct(o.informal_despues / o.cambio_estricto)})</b>.</p>
        {visibles.length > 0 && <p><b>A dónde:</b> los cambios más comunes fueron a {visibles.slice(0, 3).map(d => `${corto(d.nombre)} (${d.n})`).join(', ')}. Muchos otros no los podemos contar bien.</p>}
        {pruebas.length > 0 && <p><b>Lo que existe hoy para ti:</b> un certificado oficial del gobierno de lo que ya sabes hacer. <a href="#prueba" className="liga font-semibold">Cómo sacar tu certificado de {pruebas[0].titulo.toLowerCase()} ↓</a></p>}
      </section>

      {/* ===== OBSERVED LAYER ===== */}
      <section className="space-y-3" data-capa="observado">
        <span className="etiqueta et-obs">Observado · INEGI ENOE 2024–2026</span>
        <h2 className="text-xl font-bold">A dónde se fueron</h2>
        <p className="text-sm">
          El INEGI entrevista a las mismas personas cada 3 meses. Entre 2024 y 2026 vimos <b>{o.cambio_estricto.toLocaleString('es-MX')} veces</b> que alguien de tu trabajo se cambió a otro trabajo, en otro tipo de empresa.
        </p>
        <details className="tarjeta text-sm">
          <summary className="cursor-pointer font-semibold">¿Y los que no se cambiaron? ¿Cuántos se quedaron sin trabajo?</summary>
          De {o.encontrados.toLocaleString('es-MX')} veces que volvimos a encontrar a alguien: {o.misma_ocupacion.toLocaleString('es-MX')} seguían en lo mismo, {o.sin_trabajo.toLocaleString('es-MX')} estaban sin trabajo esa semana,
          {' '}{soloPuesto.toLocaleString('es-MX')} cambiaron solo el nombre del puesto (casi seguro, el mismo trabajo) y {o.cambio_estricto.toLocaleString('es-MX')} cambiaron de verdad.
        </details>

        <div className="ruido text-sm" data-testid="ruido">
          <b>Ojo:</b> el INEGI a veces anota distinto el mismo trabajo (le pasó al {pct(o.ruido_industria_en_los_que_se_quedaron)} de quienes no se movieron).
          Por eso algunos de estos cambios pueden no ser reales, y por eso solo mostramos destinos con 10 casos o más.
        </div>

        <ol className="space-y-2">
          {visibles.slice(0, 5).map(d => <Tarjeta key={d.clave} d={d} o={o} salOrigen={salOrigen} />)}
        </ol>
        {visibles.length > 5 && (
          <details className="tarjeta">
            <summary className="cursor-pointer font-semibold">Ver los otros {visibles.length - 5} destinos con 10 casos o más</summary>
            <ol className="mt-2 space-y-2">
              {visibles.slice(5).map(d => <Tarjeta key={d.clave} d={d} o={o} salOrigen={salOrigen} />)}
            </ol>
          </details>
        )}

        <div className="nosabemos" data-testid="no-sabemos">
          <b>No sabemos:</b> {o.otros.n} cambios más se repartieron en {o.otros.ocupaciones} trabajos distintos, con menos de {MINIMO} casos cada uno.
          Con tan pocos casos no mostramos sueldo ni flecha. Que haya tantos huecos también es un dato: en México casi no hay registro de a dónde se va la gente de este trabajo.
        </div>

        <p className="text-xs text-neutral-600">El “sueldo típico” es de todos los que trabajan en ese destino, no lo que tú ganarías. Los destinos están ordenados por cuántas personas se fueron ahí, no por sueldo.</p>
      </section>

      <section className="space-y-3" data-capa="prueba" id="prueba">
        <h2 className="text-xl font-bold">Lleva tu prueba contigo</h2>
        {pruebas.length === 0
          ? <p className="puerta-no text-sm">Para este trabajo no verificamos un certificado oficial. No lo mostramos.</p>
          : <>
              <p className="text-sm">CONOCER es el organismo del gobierno federal que certifica lo que la gente sabe hacer en su trabajo. Estos son certificados oficiales de lo que <b>ya sabes hacer</b>. Te evalúa una persona que te ve trabajar, no un examen que una IA pueda contestar por ti. Lo puedes sacar mientras todavía tienes trabajo.</p>
              {pruebas.map(p => (
                <div key={p.codigo} className="tarjeta text-sm" data-prueba={p.codigo}>
                  <p className="font-semibold">{p.codigo} · {p.titulo}</p>
                  <p>{p.detalle}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-posible)' }}>Fuente: <a className="liga" href={p.fuente.url} target="_blank" rel="noopener noreferrer">{p.fuente.nombre}</a> · verificado el {p.verificado}</p>
                </div>
              ))}
              <div className="tarjeta text-sm">
                <p className="font-semibold">Cómo empezar</p>
                <ol className="list-decimal pl-5">
                  <li>Pregunta en un centro evaluador autorizado (por ejemplo, el CONALEP o el ICAT de tu ciudad) por el certificado <b>{pruebas[0].codigo}</b>: es el más parecido a lo que haces hoy.{pruebas.length > 1 && <> Si no lo tienen, pregunta por el {pruebas.slice(1).map(p => p.codigo).join(' o ')}.</>}</li>
                  <li>Pide el costo y la fecha: cambia según el centro. Solo encontramos un ejemplo: un centro cobraba MX$4,800 por el EC0305 en 2023 (curso + evaluación + certificado). No sabemos si es caro o barato comparado con otros, ni el precio de 2026.</li>
                  <li>Puedes hacerlo mientras todavía tienes trabajo.</li>
                </ol>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-posible)' }}>Fuente del precio: <a className="liga" href="https://ceune.unach.mx/images/ECE/preciosdeestandareseceunach2023.pdf" target="_blank" rel="noopener noreferrer">ECE-UNACH, precios de estándares 2023</a></p>
              </div>
            </>}
      </section>

      {/* ===== POSSIBLE LAYER — never borrows the observed layer's numbers ===== */}
      <section className="space-y-3" data-capa="posible">
        <span className="etiqueta et-pos">Camino posible, no observado</span>
        <h2 className="text-xl font-bold">Requisitos para entrar a algunos de estos trabajos</h2>
        <p className="text-sm">Esto no son datos de a dónde fue la gente: son reglas y certificados que revisamos a mano. Cada uno dice de dónde lo sacamos.</p>
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

    </div>
  )
}
