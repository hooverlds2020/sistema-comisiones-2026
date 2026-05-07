import React from 'react';
import Plantilla2Firmas from './formatos_pdf/Plantilla2Firmas';
import Plantilla3Firmas from './formatos_pdf/Plantilla3Firmas';
import Plantilla4Firmas from './formatos_pdf/Plantilla4Firmas';

const ComisionPDF = ({ data, autoridades = [] }) => {
  if (!data) return null;

  const tipoComisionStr = String(data.tipo_comision || '').toUpperCase();
  // Extraemos la categoría del comisionado (Ej: "DIRECTOR CESMECA-UNICACH" o "PROFESOR INVESTIGADOR")
  const categoriaComisionado = String(data.categoria || '').toUpperCase();

  // --- LÓGICA DE RUTEO DINÁMICA ---
  const esInternacional = tipoComisionStr.includes('INTERNACIONAL');
  
  // SOLUCIÓN: Evaluamos el CARGO, no el nombre. Así sobrevive a cambios de administración.
  const esDirectorViajando = categoriaComisionado.includes('DIRECTOR');

  // REGLA 1: Si viaja el Director AL EXTRANJERO (3 Firmas)
  if (esDirectorViajando && esInternacional) {
    return <Plantilla3Firmas data={data} autoridades={autoridades} />;
  }

  // REGLA 2: Si viaja cualquier otro personal AL EXTRANJERO (4 Firmas)
  if (!esDirectorViajando && esInternacional) {
    return <Plantilla4Firmas data={data} autoridades={autoridades} />;
  }

  // REGLA 3: Por defecto, cualquier viaje Nacional/Estatal (2 Firmas)
  return <Plantilla2Firmas data={data} autoridades={autoridades} />;
};

export default ComisionPDF;
