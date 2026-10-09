import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Cruce',
  description: 'A dónde fueron, según datos del INEGI, personas que trabajaban en centros de llamadas, televentas y cobranza en México.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <header className="bg-noche text-white">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <Link href="/" className="text-lg font-bold">Cruce</Link>
            <p className="text-sm opacity-85">A dónde fueron personas como tú</p>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-5">{children}</main>
        <footer className="mx-auto max-w-2xl border-t border-arena px-4 pb-8 pt-4 text-xs text-neutral-600">
          <p className="mb-2"><Link className="liga" href="/metodo">Cómo se hizo y qué no hace</Link></p>
          Proyecto de clase (Crystal Ball Studio, semana 9). No es un servicio oficial, no es bolsa de trabajo y no guarda nada de lo que escribes.
          Datos: INEGI, Encuesta Nacional de Ocupación y Empleo (ENOE), microdatos 2024 T1 a 2026 T2, procesados por el autor.
        </footer>
      </body>
    </html>
  )
}
