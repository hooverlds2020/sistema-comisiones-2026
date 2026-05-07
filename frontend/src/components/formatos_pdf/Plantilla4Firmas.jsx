import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const numeroALetras = (amount) => {
  if (!amount || isNaN(amount)) return 'CERO PESOS 00/100 M.N.';
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const diez_veinte = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  let entero = Math.floor(amount);
  let centavos = Math.round((amount - entero) * 100);
  let letras = '';
  if (entero === 0) letras = 'CERO';
  else if (entero < 1000000) {
      let miles = Math.floor(entero / 1000);
      let resto = entero % 1000;
      if (miles > 0) {
          if (miles === 1) letras += 'UN MIL ';
          else letras += convertirGrupo(miles, unidades, decenas, diez_veinte, centenas) + ' MIL ';
      }
      if (resto > 0 || miles === 0) letras += convertirGrupo(resto, unidades, decenas, diez_veinte, centenas);
  } else letras = 'CANTIDAD MUY GRANDE';
  return `(${letras.trim()} PESOS ${centavos.toString().padStart(2, '0')}/100 M.N.)`;
};

const convertirGrupo = (n, u, d, dv, c) => {
    let output = '';
    if (n === 100) return 'CIEN';
    let cent = Math.floor(n / 100);
    let resto = n % 100;
    if (cent > 0) output += c[cent] + ' ';
    if (resto > 0) {
        if (resto < 10) output += u[resto];
        else if (resto >= 10 && resto < 20) output += dv[resto - 10];
        else {
            let dec = Math.floor(resto / 10);
            let uni = resto % 10;
            output += d[dec];
            if (uni > 0) output += ' Y ' + u[uni];
        }
    }
    return output.trim();
};

const formatFechaLarga = (dateString) => {
    if (!dateString) return 'FECHA PENDIENTE';
    try {
        const fecha = new Date(dateString);
        if (isNaN(fecha.getTime())) return 'FECHA PENDIENTE';
        const dia = fecha.getUTCDate();
        const mes = fecha.toLocaleString('es-MX', { month: 'long', timeZone: 'UTC' }).toUpperCase();
        const anio = fecha.getUTCFullYear();
        return `${dia} DE ${mes} DE ${anio}`;
    } catch(e) { return 'FECHA PENDIENTE'; }
};

const date = (dateString) => {
  if (!dateString) return '';
  try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString('es-MX');
  } catch(e) { return ''; }
};

const formatHora = (horaString) => {
    if (!horaString) return '';
    return `${horaString.substring(0, 5)} hrs.`;
};

const money = (amount) => {
    const val = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
};

// MÁRGENES ESTANDARIZADOS (Igual que 2 y 3 firmas)
const PAD_TOP    = 110; 
const PAD_BOTTOM = 55;  
const PAD_LEFT   = 28;
const PAD_RIGHT  = 55;

const styles = StyleSheet.create({
  page: { paddingTop: PAD_TOP, paddingBottom: PAD_BOTTOM, paddingLeft: PAD_LEFT, paddingRight: PAD_RIGHT, fontSize: 8, fontFamily: 'Helvetica', flexDirection: 'column' },
  background: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 2, marginBottom: 4 }, 
  mainTable: { borderWidth: 1, borderColor: '#000', width: '100%', flex: 1, flexDirection: 'column' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', minHeight: 14, alignItems: 'center' },
  rowMotivo: { flexDirection: 'column', borderBottomWidth: 1, borderColor: '#000', padding: 4 },
  col100: { width: '100%', padding: 2 },
  col65: { width: '65%', padding: 2, borderRightWidth: 1, borderColor: '#000' },
  col35: { width: '35%', padding: 2 },
  col40: { width: '40%', padding: 2, borderRightWidth: 1, borderColor: '#000' },
  col30: { width: '30%', padding: 2, borderRightWidth: 1, borderColor: '#000' },
  col20: { width: '20%', padding: 2, borderRightWidth: 1, borderColor: '#000', justifyContent: 'center' },
  col20Last: { width: '20%', padding: 2, justifyContent: 'center' },
  label: { fontSize: 7, fontWeight: 'bold', marginBottom: 1 },
  value: { fontSize: 8 },
  gastosRow: { flexDirection: 'row', width: '100%', marginBottom: 0 },
  colGastoDesc: { width: '75%', padding: 1, paddingLeft: 2 },
  colGastoMonto: { width: '25%', padding: 1, paddingRight: 5, alignItems: 'flex-end' },
});

const Firma = ({ nombre, cargo }) => (
  <View style={{ alignItems: 'center', paddingBottom: 4, justifyContent: 'flex-end', width: '100%', height: '100%' }}>
    <View style={{ borderTopWidth: 1, borderColor: '#000', width: '80%', marginBottom: 2 }} />
    <Text style={{ fontSize: 7, fontWeight: 'bold', textAlign: 'center' }}>{nombre}</Text>
    <Text style={{ fontSize: 6, textAlign: 'center' }}>{cargo}</Text>
  </View>
);

const FirmaHeader = ({ left, right }) => (
  <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f0f0f0', minHeight: 13, alignItems: 'center' }}>
    <View style={{ width: right ? '50%' : '100%', padding: 2, borderRightWidth: right ? 1 : 0, borderColor: '#000' }}>
      <Text style={{ fontSize: 7, fontWeight: 'bold', textAlign: 'center' }}>{left}</Text>
    </View>
    {right && (
      <View style={{ width: '50%', padding: 2 }}>
        <Text style={{ fontSize: 7, fontWeight: 'bold', textAlign: 'center' }}>{right}</Text>
      </View>
    )}
  </View>
);

const FilaDosFirmas = ({ izq, der, altura }) => (
  <View style={{ flexDirection: 'row', borderBottomWidth: 0, borderColor: '#000', height: altura, alignItems: 'flex-end' }}>
    <View style={{ width: '50%', borderRightWidth: 1, borderColor: '#000', height: '100%' }}><Firma nombre={izq.nombre} cargo={izq.cargo} /></View>
    <View style={{ width: '50%', height: '100%' }}><Firma nombre={der.nombre} cargo={der.cargo} /></View>
  </View>
);

const Plantilla4Firmas = ({ data, autoridades = [] }) => {
  if (!data) return null;
  const getAutoridad = (tipoCargo) => {
    const auth = autoridades.find(a => a.cargo && a.cargo.toUpperCase().includes(tipoCargo.toUpperCase()));
    return auth ? { nombre: auth.nombre.toUpperCase(), cargo: auth.cargo.toUpperCase() } : { nombre: "CARGO NO ENCONTRADO", cargo: tipoCargo.toUpperCase() };
  };

  const DIRECTOR = getAutoridad("DIRECTOR");
  const SECRETARIO = getAutoridad("SECRETARIO");
  const RECTORA = getAutoridad("RECTORA");
  const comisionadoNombre = (data.comisionado || '').toUpperCase();
  const categoriaComisionado = (data.categoria || '').toUpperCase();
  const textoImporteLetras = numeroALetras(data.importe_total);
  const textoFechaLugar = `SAN CRISTOBAL DE LAS CASAS, CHIAPAS; ${formatFechaLarga(data.fecha_elaboracion)}`;
  const tieneGastos = parseFloat(data.importe_total) > 0;
  const clavesFormateadas = (tieneGastos && data.clave_programatica) ? data.clave_programatica.replace(/  Y  /g, ', ') : 'NO APLICA - SIN RECURSO ASIGNADO';
  const anioMembrete = data.anio_folio || 2026;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://orden-comision.clickwebhoover.online';
  const imagenUrl = `${baseUrl}/membrete_2026.png`;
  const numeroFolioOficial = String(data.numero_folio || '000').padStart(3, '0');

  const fechaInicioFmt = date(data.fecha_inicio);
  const fechaFinFmt = date(data.fecha_fin);
  const textoPeriodo = data.es_fechas_multiples ? data.periodo_texto : ((fechaInicioFmt === fechaFinFmt && fechaInicioFmt !== '') ? fechaInicioFmt : `${fechaInicioFmt} al ${fechaFinFmt}`);

  let lineasVirtualesMotivo = 0;
  if (data.motivo) {
      const saltosDeLinea = (data.motivo.match(/\n/g) || []).length;
      lineasVirtualesMotivo = saltosDeLinea + Math.ceil(data.motivo.length / 100);
  }
  let maxLineasFechas = data.es_fechas_multiples ? Math.max((data.dias_salida || '').trim().split('\n').filter(Boolean).length, (data.dias_regreso || '').trim().split('\n').filter(Boolean).length) : 2;
  const pesoTotalDocumento = maxLineasFechas + lineasVirtualesMotivo;

  const isSuperCompact = data.es_fechas_multiples && pesoTotalDocumento >= 14;
  const isCompact = data.es_fechas_multiples && pesoTotalDocumento >= 9;

  const dynamicFontSize = isSuperCompact ? 5.5 : (isCompact ? 7.0 : 8.0);
  const dynamicLineHeight = isSuperCompact ? 1.0 : (isCompact ? 1.15 : 1.3);
  
  // Usamos exactamente los mismos valores de altura de firmas que el de 3
  const firmaH = isSuperCompact ? 35 : (isCompact ? 45 : 60); 
  const gapConformidad = isSuperCompact ? 5 : (isCompact ? 15 : 25);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Image src={imagenUrl} style={styles.background} fixed />
        <Text style={styles.headerTitle}>ANEXO V. FORMATO ÚNICO DE COMISIÓN</Text>
        
        <View style={styles.mainTable}>
          <View style={styles.row}>
            <View style={styles.col100}><Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 9 }}>OFICIO DE COMISIÓN/ {numeroFolioOficial}/CESMECA/{anioMembrete}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={styles.col65}><Text style={styles.label}>NOMBRE DEL COMISIONADO:</Text><Text style={styles.value}>{comisionadoNombre}</Text></View>
            <View style={styles.col35}><Text style={styles.label}>R.F.C.:</Text><Text style={styles.value}>{data.rfc || ''}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={styles.col65}><Text style={styles.label}>CATEGORÍA:</Text><Text style={styles.value}>{categoriaComisionado}</Text></View>
            <View style={styles.col35}><Text style={styles.label}>ADSCRIPCIÓN:</Text><Text style={styles.value}>CESMECA</Text></View>
          </View>
          
          <View style={[styles.rowMotivo, { minHeight: 35 }]}><Text style={styles.label}>MOTIVO DE LA COMISIÓN:</Text><Text style={{ ...styles.value, textAlign: 'justify' }}>{data.motivo || ''}</Text></View>

          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', minHeight: 26 }}>
            <View style={{ width: '40%', borderRightWidth: 1, borderColor: '#000' }} />
            <View style={styles.col20}><Text style={{ fontSize: 7, fontWeight: 'bold', textAlign: 'center' }}>PERIODO</Text><Text style={{ fontSize: 7, textAlign: 'center' }}>{textoPeriodo}</Text></View>
            <View style={styles.col20}><Text style={{ fontSize: 7, fontWeight: 'bold', textAlign: 'center' }}>CUOTA DIARIA</Text><Text style={{ fontSize: 6, textAlign: 'center' }}>{data.cuota_diaria || ''}</Text></View>
            <View style={styles.col20Last}><Text style={{ fontSize: 7, fontWeight: 'bold', textAlign: 'center' }}>IMPORTE ACORDADO</Text><Text style={{ fontSize: 7, fontWeight: 'bold', textAlign: 'center' }}>{money(data.importe_viaticos)}</Text></View>
          </View>

          <View style={styles.row}><View style={styles.col100}><Text style={{ fontSize: 7, fontWeight: 'bold' }}>LUGAR DE COMISIÓN: <Text style={{ fontWeight: 'normal', fontSize: 8 }}>{data.lugar || ''}</Text></Text></View></View>

          {data.es_fechas_multiples ? (
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', alignItems: 'flex-start', paddingVertical: 2, minHeight: 14 }}>
                <View style={{ width: '50%', padding: 2 }}><Text style={{ fontSize: 7, fontWeight: 'bold' }}>DÍA Y HORA DE SALIDA: </Text><Text style={{ fontWeight: 'bold', fontSize: dynamicFontSize, marginTop: 2, marginLeft: 20, lineHeight: dynamicLineHeight }}>{data.dias_salida || ''}</Text></View>
                <View style={{ width: '50%', padding: 2 }}><Text style={{ fontSize: 7, fontWeight: 'bold' }}>DE REGRESO: </Text><Text style={{ fontWeight: 'bold', fontSize: dynamicFontSize, marginTop: 2, marginLeft: 20, lineHeight: dynamicLineHeight }}>{data.dias_regreso || ''}</Text></View>
              </View>
          ) : (
              <View style={styles.row}>
                <View style={styles.col100}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>DÍA Y HORA DE SALIDA:  <Text style={{ fontWeight: 'normal', fontSize: 9 }}>{fechaInicioFmt} - {formatHora(data.hora_salida)}</Text>{'    '}DÍA Y HORA DE REGRESO: <Text style={{ fontWeight: 'normal', fontSize: 9 }}>{fechaFinFmt} - {formatHora(data.hora_regreso)}</Text></Text></View>
              </View>
          )}

          <View style={styles.row}><View style={styles.col100}><Text style={{ fontSize: 7, fontWeight: 'bold' }}>MEDIO DE TRANSPORTE: <Text style={{ fontWeight: 'normal', fontSize: 8 }}>{data.medio_transporte || ''}</Text></Text></View></View>

          {data.vehiculo_marca && (
            <View style={styles.row}>
              <View style={styles.col40}><Text style={styles.label}>MARCA:</Text><Text style={styles.value}>{data.vehiculo_marca}</Text></View>
              <View style={styles.col30}><Text style={styles.label}>MODELO:</Text><Text style={styles.value}>{data.vehiculo_modelo}</Text></View>
              <View style={{ width: '30%', padding: 2 }}><Text style={styles.label}>PLACAS:</Text><Text style={styles.value}>{data.vehiculo_placas}</Text></View>
            </View>
          )}

          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', flex: 1.5, minHeight: 40, alignItems: 'stretch' }}>
            <View style={{ width: '100%', padding: 2, display: 'flex', flexDirection: 'column' }}>
              <View style={{ width: '50%' }}>
                <View><Text style={{ fontSize: 7 }}><Text style={{ fontWeight: 'bold' }}>CLAVE PROGRAMÁTICA: </Text>{clavesFormateadas}</Text></View>
                {parseFloat(data.importe_combustible) > 0 && <View style={styles.gastosRow}><View style={styles.colGastoDesc}><Text>26111.- COMBUSTIBLE</Text></View><View style={styles.colGastoMonto}><Text style={{ fontWeight: 'bold' }}>{money(data.importe_combustible)}</Text></View></View>}
                {parseFloat(data.importe_pasajes_aereos) > 0 && <View style={styles.gastosRow}><View style={styles.colGastoDesc}><Text>37111.- PASAJES NACIONALES AÉREOS</Text></View><View style={styles.colGastoMonto}><Text style={{ fontWeight: 'bold' }}>{money(data.importe_pasajes_aereos)}</Text></View></View>}
                {parseFloat(data.importe_pasajes) > 0 && <View style={styles.gastosRow}><View style={styles.colGastoDesc}><Text>37211.- PASAJES NACIONALES TERRESTRES</Text></View><View style={styles.colGastoMonto}><Text style={{ fontWeight: 'bold' }}>{money(data.importe_pasajes)}</Text></View></View>}
                {parseFloat(data.importe_viaticos) > 0 && <View style={styles.gastosRow}><View style={styles.colGastoDesc}><Text>37511.- VIÁTICOS NACIONALES</Text></View><View style={styles.colGastoMonto}><Text style={{ fontWeight: 'bold' }}>{money(data.importe_viaticos)}</Text></View></View>}
                {parseFloat(data.importe_congresos) > 0 && <View style={styles.gastosRow}><View style={styles.colGastoDesc}><Text>38301.- CONGRESOS Y CONVENCIONES</Text></View><View style={styles.colGastoMonto}><Text style={{ fontWeight: 'bold' }}>{money(data.importe_congresos)}</Text></View></View>}
                {parseFloat(data.importe_otros) > 0 && <View style={styles.gastosRow}><View style={styles.colGastoDesc}><Text>39202.- OTROS IMPTOS. Y DERECHOS</Text></View><View style={styles.colGastoMonto}><Text style={{ fontWeight: 'bold' }}>{money(data.importe_otros)}</Text></View></View>}
              </View>
              <View style={{ flex: 1 }} />
              <View style={{ flexDirection: 'row', width: '50%', borderTopWidth: 1, borderTopStyle: 'dashed', borderColor: '#000', marginTop: 1, paddingTop: 1 }}>
                <View style={styles.colGastoDesc}><Text style={{ fontWeight: 'bold' }}>IMPORTE TOTAL:</Text></View>
                <View style={styles.colGastoMonto}><Text style={{ fontWeight: 'bold' }}>{money(data.importe_total)}</Text></View>
              </View>
            </View>
          </View>
          
          <View style={styles.row}><View style={styles.col100}><Text style={{ fontSize: 7, textAlign: 'right', paddingRight: 5 }}>{textoFechaLugar}</Text></View></View>
          
          <View style={{ flex: 1 }} /> 

          <View style={{ flexShrink: 0 }}>
            <FirmaHeader left="COMISIONADO" right="AUTORIZA" />
            <FilaDosFirmas izq={{ nombre: comisionadoNombre, cargo: categoriaComisionado }} der={DIRECTOR} altura={firmaH} />
            <FirmaHeader left="Vo. Bo." right="Vo. Bo." />
            <FilaDosFirmas izq={SECRETARIO} der={RECTORA} altura={firmaH} />
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#000', backgroundColor: '#f0f0f0', minHeight: 13, alignItems: 'center' }}>
              <View style={{ width: '100%', padding: 2 }}><Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 7 }}>GASTOS A COMPROBAR</Text></View>
            </View>
            <View style={{ padding: 4, paddingBottom: 15 }}>
              <Text style={{ fontSize: 6.8, textAlign: 'justify', color: '#000', lineHeight: 1.15, paddingHorizontal: 4 }}>
                RECIBÍ: DE LA UNIVERSIDAD AUTÓNOMA DE CIENCIAS Y ARTES DE CHIAPAS LA CANTIDAD DE <Text style={{ fontWeight: 'bold' }}>{money(data.importe_total)}</Text>{' '}
                <Text style={{ fontWeight: 'bold' }}>{textoImporteLetras}</Text>{' '}
                POR EL (LOS) CONCEPTOS ANTES DESCRITOS, LOS CUALES DEBERÁN SER COMPROBADOS DE ACUERDO A LA FUENTE DE FINANCIAMIENTO O DEVUELTOS A MÁS TARDAR EL QUINTO DÍA POSTERIOR A LA CONCLUSIÓN DE LA COMISIÓN; DE NO CUMPLIRSE ESTA CONDICIÓN, DOY MI CONSENTIMIENTO Y AUTORIZACIÓN PARA QUE SE DESCUENTE EN LA NÓMINA DE SUELDOS MÁS PRÓXIMA O DE ALGUNA OTRA PERCEPCIÓN QUE ME CORRESPONDA (ARTÍCULO 33 DEL REGLAMENTO DE NORMAS Y TARIFAS PARA LA APLICACIÓN DE VIÁTICOS Y PASAJES DE LA UNICACH).
              </Text>
              <View style={{ alignItems: 'center', paddingTop: 15, paddingBottom: 5 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 7, fontWeight: 'bold', marginBottom: isSuperCompact ? 5 : 10 }}>FIRMA DE CONFORMIDAD</Text>
                  <View style={{ height: gapConformidad }} />
                  <View style={{ width: 220, alignItems: 'center' }}>
                    <View style={{ borderTopWidth: 1, borderColor: '#000', width: '100%', marginBottom: 2 }} />
                    <Text style={{ fontSize: 7, fontWeight: 'bold' }}>{comisionadoNombre}</Text>
                    <Text style={{ fontSize: 6 }}>{categoriaComisionado}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ borderTopWidth: 1, borderColor: '#000', paddingVertical: 4 }}>
          <Text style={{ fontSize: 6.5, textAlign: 'center', paddingHorizontal: 10 }}>
            DECLARO BAJO PROTESTA DE DECIR VERDAD QUE LOS DATOS CONTENIDOS EN ESTE DOCUMENTO SON VERÍDICOS Y MANIFIESTO TENER CONOCIMIENTO DE LAS SANCIONES QUE SE APLICARÁN EN CASO CONTRARIO.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
export default Plantilla4Firmas;
