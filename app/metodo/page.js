import datos from '../../data/cruce.json'
import { MINIMO, UMBRAL } from '../../lib/reglas'
import { MODELO } from '../../lib/clasificar'

export const metadata = { title: 'Cruce · Cómo se hizo' }

export default function Metodo() {
  const m = datos.meta
  return (
    <article className="space-y-4 text-[15px] leading-relaxed">
      <h1 className="text-2xl font-bold">Cómo se hizo y qué no hace</h1>

      <section className="tarjeta space-y-2">
        <h2 className="font-bold">De dónde salen los datos</h2>
        <p>{m.fuente}. La ENOE entrevista a cada vivienda 5 trimestres seguidos, así que se puede ver a la misma persona 3 meses después. Unimos {m.pares} pares de trimestres seguidos ({m.trimestres[0]} a {m.trimestres[m.trimestres.length - 1]}) con la llave de vivienda, hogar y persona del INEGI.</p>
        <p>Ocupaciones: clasificación SINCO 2019 del INEGI. Trabajos de origen: 3212 (centro de llamadas), 4213 (vendedores por teléfono) y 3122 (cobradores).</p>
      </section>

      <section className="tarjeta space-y-2">
        <h2 className="font-bold">Qué contamos como “cambio”</h2>
        <p>Solo cuando cambian <b>la ocupación y el tipo de empresa</b> (clave SCIAN) entre una entrevista y la siguiente. Si solo cambia el nombre del puesto, casi seguro es el mismo trabajo anotado distinto, y no lo contamos.</p>
        <p><b>El ruido que queda:</b> aun así, entre quienes siguieron en la misma ocupación, alrededor de un tercio aparece con otro tipo de empresa. Por eso el mapa lo advierte. No corregimos ese ruido; lo mostramos.</p>
        <p>Una misma persona puede aparecer en más de un par de trimestres, así que contamos <b>cambios</b>, no personas.</p>
      </section>

      <section className="tarjeta space-y-2">
        <h2 className="font-bold">Las reglas del mapa</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Menos de {MINIMO} casos: “No sabemos”. Sin sueldo y sin flecha. Esos casos ni siquiera salen del proceso de datos por separado.</li>
          <li>Sueldo típico: {m.salarios}.</li>
          <li>Flecha: ↑ o ↓ si el sueldo típico del destino está más de {Math.round(UMBRAL * 100)}% arriba o abajo del de tu trabajo; si no, =. No es lo que tú ganarías.</li>
          <li>Orden: por cuántas personas se fueron ahí. Nunca por sueldo, porque el mapa no te dice a dónde ir.</li>
          <li>“Camino posible” va aparte y no usa los números de lo observado. Cada puerta tiene fuente y fecha de verificación, o no se muestra.</li>
        </ul>
      </section>

      <section className="tarjeta space-y-2">
        <h2 className="font-bold">Dónde está la IA y dónde no</h2>
        <p>La IA ({MODELO}, vía Vercel AI Gateway) solo sugiere cuál de los 3 trabajos se parece a lo que escribiste. Su respuesta tiene que ser una de 4 opciones o se descarta. Nunca escribe números, sueldos ni requisitos. Si no responde, una regla de palabras clave sugiere una opción y la pantalla dice SIMULADO.</p>
        <p>Antes de mandar tu texto quitamos números y correos. No lo guardamos ni lo registramos.</p>
      </section>

      <section className="tarjeta space-y-2">
        <h2 className="font-bold">Lo que no hace, a propósito</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>No publica vacantes ni te conecta con empleadores. No es bolsa de trabajo.</li>
          <li>No te califica ni te pide datos. No hay cuenta ni base de datos.</li>
          <li>No esconde cuando a la gente le fue peor. Un mapa que esconde la caída le miente a quien lo usa.</li>
        </ul>
      </section>

      <section className="tarjeta space-y-2">
        <h2 className="font-bold">Límites que conocemos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>La ENOE sigue la vivienda, no a la persona: quien se muda (a veces por un mejor trabajo) se pierde.</li>
          <li>Mucha gente no dice su ingreso (en el centro de llamadas, más de la mitad), así que los cambios de ingreso se basan en pocos casos.</li>
          <li>No sabemos qué clave le pone el INEGI a cada agente de un call center: puede ser 3212, 4213 o 3122.</li>
          <li>No hay datos de vacantes en este mapa; en la investigación no encontramos una fuente pública mexicana.</li>
        </ul>
      </section>
      <p className="text-xs text-neutral-600">Generado el {m.generado}. Código y proceso de datos: github.com/andresbuildshub/w09-cruce (scripts/build_data.py).</p>
    </article>
  )
}
