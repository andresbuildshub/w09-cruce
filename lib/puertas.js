// Doors = requirements or official proofs for a crossing. Verified BY HAND, each with a source and a date.
// Rule from the W9 fight: the LLM never writes a door; no source + date → the door doesn't show.
// A door is a requirement, never a vacancy (the day this lists openings, it's a job board).

const VERIFICADO = '2026-10-08'

const F = {
  lisf: { nombre: 'Ley de Instituciones de Seguros y de Fianzas, art. 93 (texto vigente, última reforma DOF 14-11-2025)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LISF.pdf' },
  s114: { nombre: 'CNSF, Circular S-1.14 "Centros de Aplicación de Exámenes" (capacidad técnica de agentes de seguros persona física)', url: 'https://sidof.segob.gob.mx/notas/docFuente/5123905' },
  ec0784: { nombre: 'CONOCER, Estándar EC0784 "Atención al cliente vía telefónica", versión 7.0 (copia publicada por ILCE)', url: 'https://www.ilce.edu.mx/images/certificaciones/competencias/estandares/EC0784.pdf' },
  ec0254: { nombre: 'CONOCER, Estándar EC0254 "Venta de productos y servicios vía telefónica", versión 6.0 (copia publicada por ILCE)', url: 'https://www.ilce.edu.mx/images/certificaciones/competencias/estandares/EC0254.pdf' },
  ec0305: { nombre: 'CONALEP, Lista de verificación del portafolio de evidencias EC0305 "Prestación de servicios de atención a clientes", versión 2026', url: 'https://www.conalep.edu.mx/sites/default/files/micrositios/daoce/PE/0N0305x_026.pdf' },
}

// Doors for the five upward crossings the fight committed to verify by hand: 4222, 2511, 3115, 4221, 3213.
export const PUERTAS = {
  '4222': {
    titulo: 'Agentes de seguros y servicios financieros',
    verificada: true,
    requisito: 'Para vender seguros como agente necesitas autorización de la Comisión Nacional de Seguros y Fianzas (CNSF). La ley dice: "Para el ejercicio de la actividad de agente de seguros … se requerirá autorización de la Comisión." La capacidad técnica se evalúa con un examen en centros que designa la CNSF.',
    noVerificado: 'Costo, fechas y duración del examen: no los verificamos.',
    fuentes: [F.lisf, F.s114],
    verificado: VERIFICADO,
  },
  '3213': {
    titulo: 'Telefonistas',
    verificada: true,
    requisito: 'Prueba oficial disponible: certificado CONOCER EC0784 "Atención al cliente vía telefónica". No pide título profesional.',
    noVerificado: 'Si hay una licencia obligatoria para este trabajo: no lo verificamos.',
    fuentes: [F.ec0784],
    verificado: VERIFICADO,
  },
  '4221': {
    titulo: 'Agentes y representantes de ventas',
    verificada: true,
    requisito: 'Prueba oficial relacionada: certificado CONOCER EC0254 "Venta de productos y servicios vía telefónica". Certifica venta por teléfono, no venta en campo.',
    noVerificado: 'Si hay una licencia obligatoria para este trabajo: no lo verificamos.',
    fuentes: [F.ec0254],
    verificado: VERIFICADO,
  },
  '2511': { titulo: 'Auxiliares en administración, mercadotecnia y comercio', verificada: false },
  '3115': { titulo: 'Apoyo en actividades administrativas', verificada: false },
}

// "Lleva tu prueba contigo": official proofs of what the person ALREADY does, by origin code.
// These are live, human-observed assessments (EC0305: "Observar en campo o en situación simulada el desempeño
// del candidato"), the one proof format the fight's tests said survives today's models.
export const PRUEBAS_ORIGEN = {
  '3212': [
    { codigo: 'EC0784', titulo: 'Atención al cliente vía telefónica', detalle: 'Certifica justo lo que haces hoy. No pide título profesional.', fuente: F.ec0784, verificado: VERIFICADO },
    { codigo: 'EC0305', titulo: 'Prestación de servicios de atención a clientes', detalle: 'Un evaluador te observa atender (en campo o en situación simulada) unas 2 horas y califica con una lista fija.', fuente: F.ec0305, verificado: VERIFICADO },
  ],
  '4213': [
    { codigo: 'EC0254', titulo: 'Venta de productos y servicios vía telefónica', detalle: 'Certifica justo lo que haces hoy. No pide título profesional.', fuente: F.ec0254, verificado: VERIFICADO },
  ],
  '3122': [],
}

export const PUERTAS_ORDEN = ['4222', '3213', '4221', '2511', '3115']
