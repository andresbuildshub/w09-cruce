import Elegir from './Elegir'

export default function Inicio() {
  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold leading-tight">Si sales del centro de llamadas, ¿a dónde se fueron los que ya salieron?</h1>
        <p className="mt-2">Con datos del INEGI te mostramos <b>a dónde se movieron</b> personas que hacían tu mismo trabajo, cuánto se gana ahí y si quedaron con o sin prestaciones.</p>
      </section>
      <div className="regla text-sm">
        <b>Lo que este sitio nunca hace:</b> no te dice a dónde deberías irte, no te califica, no te pide tu nombre, no guarda lo que escribes y no publica vacantes.
        Si los datos dicen que a muchos les fue peor, te lo decimos igual.
      </div>
      <Elegir />
    </div>
  )
}
