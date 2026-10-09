// The map's rules live here, in one place, so the tests can hold them still.
// Fight rule: under 10 people, the screen says "No sabemos" — no wage, no arrow.
export const MINIMO = 10
// Arrow threshold: a destination's typical wage within ±5% of the origin's reads as "=".
export const UMBRAL = 0.05

export function celda(n) {
  return Number.isInteger(n) && n >= MINIMO ? 'visible' : 'no-sabemos'
}

// Compares the typical wage in the destination (all workers in that code) with the origin's.
// It is NOT what this person would earn — the screen says so next to every arrow.
export function flecha(salarioDestino, salarioOrigen) {
  if (!(salarioDestino > 0) || !(salarioOrigen > 0)) return null
  // Rounded: 9500/10000 − 1 is −0.05000000000000004 in floating point, which drew ↓ on an exact −5% (unit test b).
  const r = Math.round((salarioDestino / salarioOrigen - 1) * 10000) / 10000
  if (r > UMBRAL) return { simbolo: '↑', clase: 'sube', texto: 'gana más', r }
  if (r < -UMBRAL) return { simbolo: '↓', clase: 'baja', texto: 'gana menos', r }
  return { simbolo: '=', clase: 'igual', texto: 'gana parecido', r }
}

export function pesos(n) {
  return '$' + Math.round(n).toLocaleString('es-MX')
}

// Destinations come from the pipeline already filtered to n >= MINIMO; this is the second guard,
// and the order is by how many people went, never by wage (the map doesn't rank where to go).
export function destinosVisibles(origen) {
  return (origen?.destinos || []).filter(d => celda(d.n) === 'visible').sort((a, b) => b.n - a.n)
}

// Words the map must never say: it shows where people went, it doesn't tell anyone where to go.
export const PROHIBIDAS = [/recomend/i, /deber[ií]as/i, /te conviene/i, /mejor opci[oó]n/i, /vacante/i]
