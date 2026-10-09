// E2E against production at 390 px. Run from a folder with playwright installed: node e2e.mjs [baseUrl] [shotsDir]
import { chromium } from 'playwright'
const BASE = process.argv[2] || 'https://w09-cruce.vercel.app'
const SHOTS = process.argv[3]
const res = []; const ok = (n, c, d = '') => { res.push([c ? 'PASS' : 'FAIL', n, d]) }
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const errores = []; p.on('console', m => { if (m.type() === 'error') errores.push(m.text()) })
const shot = async n => SHOTS && p.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true })

await p.goto(BASE, { waitUntil: 'networkidle' }); await shot('01-inicio')
ok('home: refusal box first', await p.locator('.regla').isVisible())
ok('home: 3 options', (await p.locator('a.opcion').count()) === 3)

await p.fill('#desc', 'contesto llamadas de clientes por cambios de plan y aclaraciones de cobro')
await p.click('button:has-text("Sugiéreme")'); await p.waitForSelector('[data-testid=sugerencia]', { timeout: 30000 }); await shot('02-sugerencia')
const sug = await p.locator('[data-testid=sugerencia]').innerText()
ok('LLM suggestion labeled (IA or SIMULADO)', /Sugerencia de IA|SIMULADO/.test(sug), sug.slice(0, 120))
ok('suggestion → 3212', /centro de llamadas/i.test(sug))
await p.click('text=Sí, es mi trabajo'); await p.waitForURL(/\/mapa\/3212/)
await p.waitForSelector('[data-capa=observado]'); await shot('03-mapa-3212')
const html = await p.content(); const txt = await p.locator('main').innerText()
ok('map: noise box with a %', /\d+%/.test(await p.locator('[data-testid=ruido]').innerText()))
ok('map: plain summary first (persona fix)', await p.locator('[data-testid=en-corto]').isVisible())
ok('map: at least one ↓ shown', (await p.locator('[data-destino] .baja').count()) > 0)
ok('map: "No sabemos" group', await p.locator('[data-testid=no-sabemos]').isVisible())
ok('map: possible layer labeled apart', /Camino posible, no observado/i.test(txt))
ok('map: no forbidden wording', !/recomend|deber[ií]as|te conviene|vacante/i.test(txt))
const cuentas = await p.locator('[data-destino]').evaluateAll(els => els.map(e => +e.querySelector('b').textContent))
ok('map: every visible cell n >= 10, sorted by count', cuentas.every(n => n >= 10) && cuentas.every((n, i) => i === 0 || cuentas[i - 1] >= n), cuentas.join(','))
const puertaNums = await p.locator('[data-capa=posible]').innerText()
ok('possible layer borrows no counts ("de N cambios")', !/ de \d+ cambios/.test(puertaNums))
ok('doors: each verified door has a source + date', (await p.locator('.puerta').count()) === (await p.locator('.puerta :text("Verificado el")').count()))
ok('origin proof EC0784 shown', await p.locator('[data-prueba=EC0784]').isVisible())

for (const c of ['4213', '3122']) { await p.goto(`${BASE}/mapa/${c}`, { waitUntil: 'networkidle' }); ok(`map ${c} renders`, await p.locator('[data-capa=observado]').isVisible()); await shot(`04-mapa-${c}`) }
await p.goto(`${BASE}/metodo`, { waitUntil: 'networkidle' }); await shot('05-metodo'); ok('method page', /Lo que no hace/.test(await p.locator('main').innerText()))
const antes404 = errores.length
const r404 = await p.goto(`${BASE}/mapa/9999`); ok('unknown code → 404', r404.status() === 404)
errores.length = antes404 // the 404 page's own resource error is expected
const api = await p.request.post(`${BASE}/api/clasificar`, { data: { descripcion: 'hola', x: 1 } }); ok('API rejects extra fields', api.status() === 400)
const h = (await p.request.get(BASE)).headers(); ok('security headers', /default-src 'self'/.test(h['content-security-policy']) && h['x-frame-options'] === 'DENY')
ok('no console errors', errores.length === 0, errores.join(' | ').slice(0, 200))
await b.close()
for (const r of res) console.log(r.join(' · '))
console.log(`${res.filter(r => r[0] === 'PASS').length}/${res.length} PASS`)
