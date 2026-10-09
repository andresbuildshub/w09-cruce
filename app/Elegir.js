'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ORIGENES } from '../lib/clasificar'

export default function Elegir() {
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState('libre') // libre | pensando | listo | error
  const [r, setR] = useState(null)

  async function sugerir(e) {
    e.preventDefault()
    setEstado('pensando'); setR(null)
    try {
      const res = await fetch('/api/clasificar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ descripcion: texto }) })
      const j = await res.json()
      if (!res.ok) { setR({ error: j.error || 'No se pudo.' }); setEstado('error'); return }
      setR(j); setEstado('listo')
    } catch { setR({ error: 'Sin conexión. Elige una opción de arriba.' }); setEstado('error') }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">¿Cuál es tu trabajo hoy?</h2>
      {Object.entries(ORIGENES).map(([clave, o]) => (
        <Link key={clave} href={`/mapa/${clave}`} className="opcion" data-clave={clave}>
          <span aria-hidden className="text-xl">{o.icono}</span>
          <span>{o.corto}<span className="block text-xs font-normal text-neutral-600">{o.largo}</span></span>
        </Link>
      ))}

      <form onSubmit={sugerir} className="tarjeta mt-4 space-y-2">
        <label htmlFor="desc" className="font-semibold">¿No sabes cuál? Cuéntanos qué haces en tu trabajo</label>
        <textarea id="desc" rows={3} maxLength={400} value={texto} onChange={e => setTexto(e.target.value)}
          placeholder="Ej.: contesto llamadas de clientes por cambios de plan y aclaraciones de cobro" />
        <p className="text-xs text-neutral-600">No escribas tu nombre, tu empresa ni números. No guardamos lo que escribes. Quitamos los números antes de usarlo.</p>
        <button className="boton" disabled={texto.trim().length < 10 || estado === 'pensando'}>{estado === 'pensando' ? 'Pensando…' : 'Sugiéreme una opción'}</button>
      </form>

      {estado === 'error' && <p className="tarjeta text-baja">{r?.error}</p>}
      {estado === 'listo' && r && (
        <div className="tarjeta space-y-2" data-testid="sugerencia">
          {r.modo === 'real'
            ? <span className="etiqueta et-ia">Sugerencia de IA, tú decides</span>
            : <span className="etiqueta et-sim">SIMULADO · sin IA: {r.motivo}</span>}
          {r.clave === 'ninguno'
            ? <p>No parece ninguno de los tres trabajos que cubre este mapa. Si crees que sí, elige tú la opción de arriba.</p>
            : <>
                <p>Parece <b>“{ORIGENES[r.clave].largo}”</b>. {r.razon}</p>
                <div className="flex flex-wrap gap-2">
                  <Link className="boton" href={`/mapa/${r.clave}`}>Sí, es mi trabajo</Link>
                  <button className="boton boton-sec" onClick={() => { setEstado('libre'); setR(null) }}>No, elijo yo</button>
                </div>
              </>}
        </div>
      )}
    </section>
  )
}
