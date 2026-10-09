// The ONLY place an LLM touches this product: suggesting which of 3 origin codes matches a job description.
// It never writes numbers, wages or doors. Its answer must be one word from a whitelist, or it's discarded.

export const MODELO = 'google/gemini-2.5-flash-lite' // class19 free AI Gateway tier serves this; Anthropic returns 403 (tested 2026-10-01)

export const ORIGENES = {
  '3212': { corto: 'Atiendo llamadas de clientes', largo: 'Información y aclaraciones por teléfono (centro de llamadas)', icono: '📞',
    palabras: ['llamada', 'call', 'atiendo', 'atencion', 'aclaracion', 'soporte', 'informacion', 'cliente', 'conmutador', 'linea', 'queja', 'servicio'] },
  '4213': { corto: 'Vendo por teléfono', largo: 'Ventas por teléfono (televentas)', icono: '💬',
    palabras: ['vend', 'venta', 'televenta', 'ofrezco', 'promocion', 'colocar', 'retencion', 'upgrade', 'contratar', 'meta'] },
  '3122': { corto: 'Cobro por teléfono o en persona', largo: 'Cobranza (cobradores y pagadores)', icono: '💳',
    palabras: ['cobr', 'cobranza', 'adeudo', 'deuda', 'pago', 'moros', 'vencid', 'recuper', 'credito'] },
}
export const PERMITIDAS = ['3212', '4213', '3122', 'ninguno']

// Input guard: 10–400 characters, and no digits or emails reach the prompt (phones, employee numbers, account numbers).
export function limpiar(texto) {
  if (typeof texto !== 'string') return null
  const t = texto
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[correo]')
    .replace(/\d/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400)
  return t.length >= 10 ? t : null
}

export const SISTEMA = `Clasificas descripciones de trabajo escritas por trabajadores mexicanos.
Responde SOLO con JSON: {"clave":"3212"|"4213"|"3122"|"ninguno","razon":"máximo 20 palabras, en español, con 'tú'"}.
3212 = atiende llamadas de clientes: información, aclaraciones, soporte, quejas (centro de llamadas).
4213 = vende por teléfono: televentas, ofrecer productos o planes, metas de venta.
3122 = cobra: cobranza de adeudos, por teléfono o en persona.
ninguno = no es ninguno de los tres.
No agregues números, sueldos, empresas ni consejos.`

// Whatever the model says, only a whitelisted code survives; the reason is trimmed and stripped of digits.
export function normalizarClasificacion(salida) {
  let o = salida
  if (typeof salida === 'string') {
    const m = salida.match(/\{[\s\S]*\}/)
    try { o = JSON.parse(m ? m[0] : salida) } catch { return null }
  }
  if (!o || typeof o !== 'object') return null
  const clave = String(o.clave || '').trim()
  if (!PERMITIDAS.includes(clave)) return null
  const razon = String(o.razon || '').replace(/\d/g, '').replace(/\s+/g, ' ').trim().slice(0, 160)
  return { clave, razon }
}

// Deterministic fallback, labeled SIMULADO on screen: keyword counts, ties → "ninguno".
function sinAcentos(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() }
export function clasificarSimulado(texto) {
  const t = sinAcentos(texto || '')
  const puntos = Object.entries(ORIGENES).map(([c, o]) => [c, o.palabras.filter(p => t.includes(p)).length])
  puntos.sort((a, b) => b[1] - a[1])
  if (puntos[0][1] === 0 || puntos[0][1] === puntos[1][1]) return { clave: 'ninguno', razon: 'Las palabras no alcanzan para decidir. Elige tú una opción.' }
  return { clave: puntos[0][0], razon: `Tu descripción usa palabras de "${ORIGENES[puntos[0][0]].largo.toLowerCase()}".` }
}
