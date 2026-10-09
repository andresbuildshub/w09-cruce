import { generateText } from 'ai'
import { MODELO, SISTEMA, limpiar, normalizarClasificacion, clasificarSimulado } from '../../../lib/clasificar'

export const maxDuration = 30
const golpes = new Map()
function excedido(ip) {
  const ahora = Date.now()
  const r = (golpes.get(ip) || []).filter(t => ahora - t < 10 * 60 * 1000)
  r.push(ahora); golpes.set(ip, r)
  return r.length > 15
}

// Stateless: nothing is stored or logged about what she typed.
export async function POST(req) {
  const tam = Number(req.headers.get('content-length') || 0)
  if (tam > 2000) return Response.json({ error: 'Texto demasiado largo' }, { status: 413 })
  let b
  try { b = await req.json() } catch { return Response.json({ error: 'Solicitud inválida' }, { status: 400 }) }
  if (typeof b !== 'object' || !b || Object.keys(b).some(k => k !== 'descripcion')) return Response.json({ error: 'Solo se acepta descripcion' }, { status: 400 })
  const texto = limpiar(b.descripcion)
  if (!texto) return Response.json({ error: 'Escribe entre 10 y 400 letras sobre tu trabajo.' }, { status: 400 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local'
  if (excedido(ip)) return Response.json({ error: 'Demasiadas solicitudes. Espera unos minutos.' }, { status: 429 })

  try {
    const { text } = await generateText({ model: MODELO, system: SISTEMA, prompt: `Descripción: "${texto}"`, maxOutputTokens: 120, temperature: 0 })
    const r = normalizarClasificacion(text)
    if (!r) throw new Error('respuesta fuera de la lista permitida')
    return Response.json({ modo: 'real', modelo: MODELO, ...r })
  } catch (e) {
    const msg = String(e?.message || '') + ' ' + String(e?.responseBody || '')
    console.error('clasificar:', e?.name, msg.slice(0, 160))
    const razon = /403|forbidden|free tier|credit card|customer_verification/i.test(msg) ? 'El plan gratuito de AI Gateway no dio acceso al modelo.'
      : /429|rate/i.test(msg) ? 'AI Gateway limitó las solicitudes del plan gratuito.'
      : /lista permitida/.test(msg) ? 'El modelo respondió algo fuera de las opciones permitidas; lo descartamos.'
      : 'No se pudo llamar al modelo.'
    return Response.json({ modo: 'simulado', motivo: razon, ...clasificarSimulado(texto) })
  }
}
