import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { celda, flecha, destinosVisibles, MINIMO, PROHIBIDAS } from '../lib/reglas.js'
import { PUERTAS, PRUEBAS_ORIGEN } from '../lib/puertas.js'
import { limpiar, normalizarClasificacion, clasificarSimulado, PERMITIDAS } from '../lib/clasificar.js'

const datos = JSON.parse(readFileSync(new URL('../data/cruce.json', import.meta.url)))

test('a) celda: 9 → no-sabemos, 10 → visible', () => {
  assert.equal(celda(9), 'no-sabemos')
  assert.equal(celda(10), 'visible')
  assert.equal(celda(undefined), 'no-sabemos')
})

test('b) flecha: −5.1% → ↓, ±5% → =, +6% → ↑, missing → null', () => {
  assert.equal(flecha(9490, 10000).simbolo, '↓')
  assert.equal(flecha(9500, 10000).simbolo, '=')
  assert.equal(flecha(10500, 10000).simbolo, '=')
  assert.equal(flecha(10600, 10000).simbolo, '↑')
  assert.equal(flecha(null, 10000), null)
})

test('c) every verified door and origin proof has an https source and an ISO date', () => {
  for (const [c, p] of Object.entries(PUERTAS)) {
    if (!p.verificada) { assert.ok(!p.requisito, `${c}: unverified door must carry no requirement text`); continue }
    assert.ok(p.fuentes?.length > 0, `${c}: no source`)
    for (const f of p.fuentes) assert.match(f.url, /^https:\/\//, `${c}: source must be https`)
    assert.match(p.verificado, /^\d{4}-\d{2}-\d{2}$/, `${c}: no verification date`)
  }
  for (const lista of Object.values(PRUEBAS_ORIGEN)) for (const p of lista) {
    assert.match(p.fuente.url, /^https:\/\//); assert.match(p.verificado, /^\d{4}-\d{2}-\d{2}$/)
  }
})

test('d) classifier: whitelist only; input cleaned of digits/emails, 10–400 chars', () => {
  assert.deepEqual(normalizarClasificacion('{"clave":"3212","razon":"atiendes 5 dudas"}'), { clave: '3212', razon: 'atiendes dudas' })
  assert.equal(normalizarClasificacion('{"clave":"2271","razon":"x"}'), null)
  assert.equal(normalizarClasificacion('no sé'), null)
  assert.equal(limpiar('corto'), null)
  assert.equal(limpiar(42), null)
  const t = limpiar('soy agente 55 1234 5678, escribe a ana@izzi.mx para dudas de clientes')
  assert.ok(!/\d/.test(t) && !/@/.test(t))
  assert.equal(limpiar('a'.repeat(900)).length, 400)
  for (const s of ['contesto llamadas de clientes y aclaraciones', 'vendo planes por teléfono y tengo metas de venta', 'hago cobranza de adeudos vencidos'])
    assert.ok(PERMITIDAS.includes(clasificarSimulado(s).clave))
  assert.equal(clasificarSimulado('contesto llamadas de clientes y aclaraciones').clave, '3212')
  assert.equal(clasificarSimulado('hago cobranza de adeudos vencidos').clave, '3122')
})

test('e) pipeline output: no destination cell under the minimum, and visible order is by count', () => {
  for (const [c, o] of Object.entries(datos.origenes)) {
    for (const d of o.destinos) assert.ok(d.n >= MINIMO, `${c}→${d.clave} has n=${d.n}`)
    const v = destinosVisibles(o)
    for (let i = 1; i < v.length; i++) assert.ok(v[i - 1].n >= v[i].n)
    const suma = o.destinos.reduce((s, d) => s + d.n, 0) + o.otros.n
    assert.equal(suma, o.cambio_estricto, `${c}: visible + otros must add up to all strict crossings`)
  }
})

test('f) no forbidden wording (recommend/should/vacancy) in the page source', () => {
  const fuentes = ['../app/page.js', '../app/Elegir.js', '../app/mapa/[clave]/page.js'].map(f => readFileSync(new URL(f, import.meta.url), 'utf8'))
  for (const s of fuentes) for (const re of PROHIBIDAS) {
    // "no publica vacantes" is allowed only inside the explicit refusal sentence
    const limpio = s.replace(/no publica vacantes/gi, '').replace(/no te dice a dónde deberías irte/gi, '')
    assert.ok(!re.test(limpio), `forbidden wording ${re}`)
  }
})
