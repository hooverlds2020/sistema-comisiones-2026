import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ArrowLeft, Download, FileText, Eye, Send } from 'lucide-react';
import ComisionPDF from './ComisionPDF';
import Swal from 'sweetalert2';

const DetalleOrden = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [autoridades, setAutoridades] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfErrorPreview, setPdfErrorPreview] = useState(false);
  const [enviandoRevision, setEnviandoRevision] = useState(false);
  const [mostrarObservar, setMostrarObservar] = useState(false);
  const [textoObservacion, setTextoObservacion] = useState('');
  const [procesandoRevision, setProcesandoRevision] = useState(false);
  const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo') || '{}');
  const esRevisora = usuarioActivo.rol === 'Administradora';

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const enviarARevision = async () => {
    if (!pdfBlob) return;
    setEnviandoRevision(true);
    try {
      const pdfBase64 = await blobToBase64(pdfBlob);
      const res = await fetch(`/api/ordenes/${orden.id}/revision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'enviar_revision', usuario: usuarioActivo.nombre || 'Sistema', pdfBase64 }),
      });
      if (res.ok) {
        const actualizada = await res.json();
        setOrden(actualizada);
        Swal.fire({ icon: 'success', title: 'Enviada a revisión', text: 'La orden se envió correctamente para su revisión.', confirmButtonColor: '#4f46e5' });
      } else {
        Swal.fire({ icon: 'error', title: 'No se pudo enviar', text: 'Ocurrió un problema al enviar a revisión. Intenta de nuevo.', confirmButtonColor: '#dc2626' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un error al enviar a revisión.', confirmButtonColor: '#dc2626' });
    } finally {
      setEnviandoRevision(false);
    }
  };

  const aprobarOrden = async () => {
    setProcesandoRevision(true);
    try {
      const res = await fetch(`/api/ordenes/${orden.id}/revision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'aprobar', usuario: usuarioActivo.nombre || 'Sistema' }),
      });
      if (res.ok) {
        setOrden(await res.json());
        Swal.fire({ icon: 'success', title: 'Orden aprobada', text: 'La orden fue aprobada correctamente. Cuando estés lista, puedes enviarla al comisionado.', confirmButtonColor: '#059669' });
      } else {
        Swal.fire({ icon: 'error', title: 'No se pudo aprobar', text: 'Ocurrió un problema al aprobar la orden. Intenta de nuevo.', confirmButtonColor: '#dc2626' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un error al aprobar la orden.', confirmButtonColor: '#dc2626' });
    } finally {
      setProcesandoRevision(false);
    }
  };

  const enviarAlComisionado = async () => {
    if (!pdfBlob || !orden.comisionado_email) return;
    setProcesandoRevision(true);
    try {
      const pdfBase64 = await blobToBase64(pdfBlob);
      const res = await fetch(`/api/ordenes/${orden.id}/revision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'enviar_comisionado', usuario: usuarioActivo.nombre || 'Sistema', pdfBase64 }),
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Enviado al comisionado', text: `Se envió el documento a ${orden.comisionado_email}.`, confirmButtonColor: '#059669' });
      } else {
        const data = await res.json().catch(() => ({}));
        Swal.fire({ icon: 'error', title: 'No se pudo enviar', text: data.error || 'Ocurrió un problema al enviar el correo. Intenta de nuevo.', confirmButtonColor: '#dc2626' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un error al enviar el correo.', confirmButtonColor: '#dc2626' });
    } finally {
      setProcesandoRevision(false);
    }
  };

  const enviarObservacion = async () => {
    if (!textoObservacion.trim()) { Swal.fire({ icon: 'warning', title: 'Falta la observación', text: 'Escribe una observación antes de continuar.', confirmButtonColor: '#d97706' }); return; }
    setProcesandoRevision(true);
    try {
      const res = await fetch(`/api/ordenes/${orden.id}/revision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'observar', observaciones: textoObservacion, usuario: usuarioActivo.nombre || 'Sistema' }),
      });
      if (res.ok) {
        setOrden(await res.json());
        setMostrarObservar(false);
        setTextoObservacion('');
        Swal.fire({ icon: 'success', title: 'Observación enviada', text: 'La observación se envió correctamente.', confirmButtonColor: '#dc2626' });
      } else {
        Swal.fire({ icon: 'error', title: 'No se pudo enviar', text: 'Ocurrió un problema al enviar la observación. Intenta de nuevo.', confirmButtonColor: '#dc2626' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un error al enviar la observación.', confirmButtonColor: '#dc2626' });
    } finally {
      setProcesandoRevision(false);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resOrden, resAutoridades] = await Promise.all([
            fetch(`/api/ordenes/${id}`),
            fetch('/api/autoridades')
        ]);

        if (resOrden.ok) setOrden(await resOrden.json());
        if (resAutoridades.ok) setAutoridades(await resAutoridades.json());

      } catch (error) { 
        console.error("Error al cargar datos:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    cargarDatos();
  }, [id]);

  const documentoPdf = useMemo(() => (orden ? <ComisionPDF data={orden} autoridades={autoridades} /> : null), [orden, autoridades]);

  useEffect(() => {
    let cancelado = false;
    setPdfBlob(null);
    setPdfErrorPreview(false);
    if (documentoPdf) {
      import('@react-pdf/renderer').then(({ pdf }) => {
        pdf(documentoPdf).toBlob().then((generatedBlob) => {
          if (!cancelado) setPdfBlob(generatedBlob);
        }).catch(() => { if (!cancelado) setPdfErrorPreview(true); });
      });
    }
    return () => { cancelado = true; };
  }, [documentoPdf]);

  const pdfUrl = useMemo(() => (pdfBlob ? URL.createObjectURL(pdfBlob) : null), [pdfBlob]);
  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [pdfUrl]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
      <p className="font-black text-blue-900 text-xs uppercase tracking-widest">Cargando datos...</p>
    </div>
  );
  
  if (!orden) return <div className="p-20 text-center text-red-600 font-bold">Orden no encontrada.</div>;

  // 🔴 AQUÍ ESTÁ LA MAGIA: Construimos el nombre perfecto del archivo
  const numeroFolio = String(orden.numero_folio || '000').padStart(3, '0');
  const nombreArchivo = `${numeroFolio} - ${orden.comisionado}.pdf`;

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-blue-900 font-black text-xs uppercase transition-colors">
            <ArrowLeft size={18}/> Volver al Listado
          </button>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={enviarARevision}
              disabled={!pdfBlob || enviandoRevision}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95 text-xs uppercase w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {enviandoRevision ? 'Enviando...' : (orden.revision_estatus ? 'Reenviar a Revisión' : 'Enviar a Revisión')}
            </button>
            <PDFDownloadLink
              document={documentoPdf} 
              fileName={nombreArchivo} // 🔴 APLICAMOS EL NOMBRE AL BOTÓN VERDE
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg font-black shadow-lg hover:bg-green-700 transition-all active:scale-95 text-xs uppercase w-full md:w-auto"
            >
              {({ loading }) => (
                <>
                  <Download size={18} />
                  {loading ? 'Preparando archivo...' : 'Descargar Orden PDF'}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        {orden.revision_estatus && (
          <div className={`mb-4 rounded-xl p-4 border-2 ${
            orden.revision_estatus === 'Aprobada' ? 'bg-emerald-50 border-emerald-300' :
            orden.revision_estatus === 'Con Observaciones' ? 'bg-red-50 border-red-300' :
            'bg-amber-50 border-amber-300'
          }`}>
            <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
              orden.revision_estatus === 'Aprobada' ? 'text-emerald-700' :
              orden.revision_estatus === 'Con Observaciones' ? 'text-red-700' :
              'text-amber-700'
            }`}>
              Estado de revisión: {orden.revision_estatus}
            </p>
            {orden.revision_estatus === 'Con Observaciones' && orden.observaciones_revision && (
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{orden.observaciones_revision}</p>
            )}

            {orden.revision_estatus === 'Aprobada' && (
              <div className="mt-3">
                <button
                  onClick={enviarAlComisionado}
                  disabled={!pdfBlob || !orden.comisionado_email || procesandoRevision}
                  className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-xs uppercase hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesandoRevision ? 'Enviando...' : 'Enviar al Comisionado'}
                </button>
                {!orden.comisionado_email && (
                  <p className="text-xs text-gray-500 mt-1">Agrega el correo del comisionado en "Editar Orden" para poder enviarlo (opcional).</p>
                )}
              </div>
            )}

            {esRevisora && (orden.revision_estatus === 'Pendiente' || orden.revision_estatus === 'Con Observaciones') && (
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button
                  onClick={aprobarOrden}
                  disabled={!pdfBlob || procesandoRevision}
                  className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-xs uppercase hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {procesandoRevision ? 'Procesando...' : 'Aprobar'}
                </button>
                <button
                  onClick={() => setMostrarObservar(true)}
                  disabled={procesandoRevision}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg font-bold text-xs uppercase hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  Regresar con Observaciones
                </button>
              </div>
            )}

            {mostrarObservar && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-red-200">
                <textarea
                  value={textoObservacion}
                  onChange={(e) => setTextoObservacion(e.target.value)}
                  placeholder="Escribe la observación para quien capturó la orden..."
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={enviarObservacion} disabled={procesandoRevision} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-red-700 disabled:opacity-50">
                    {procesandoRevision ? 'Enviando...' : 'Enviar Observación'}
                  </button>
                  <button onClick={() => { setMostrarObservar(false); setTextoObservacion(''); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-gray-300">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl h-[70vh] md:h-[85vh] overflow-hidden border border-gray-300 flex flex-col">
          {!pdfUrl && !pdfErrorPreview && (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="font-bold text-gray-500 text-xs uppercase tracking-widest">Generando Documento...</p>
            </div>
          )}
          {pdfErrorPreview && (
            <div className="flex-1 flex items-center justify-center text-red-600 font-bold">Ocurrió un error al generar el PDF.</div>
          )}
          {pdfUrl && !pdfErrorPreview && (
            <object data={pdfUrl} type="application/pdf" className="w-full h-full">
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6 text-center">
                <FileText size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg md:text-xl font-black text-blue-900 mb-2">Vista previa no disponible</h3>
                <p className="text-gray-500 text-sm mb-8 max-w-md">
                  Tu dispositivo no soporta la lectura de PDFs dentro de esta pantalla. Elige una opción:
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95">
                    <Eye size={20} /> Ver Documento
                  </a>
                  <a href={pdfUrl} download={nombreArchivo} className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold shadow-sm hover:bg-gray-300 transition-all active:scale-95">
                    <Download size={20} /> Guardar PDF
                  </a>
                </div>
              </div>
            </object>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleOrden;
