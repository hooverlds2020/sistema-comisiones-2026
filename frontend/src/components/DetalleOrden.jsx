import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// 🔴 Cambiamos PDFViewer por BlobProvider
import { PDFDownloadLink, BlobProvider } from '@react-pdf/renderer';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import ComisionPDF from './ComisionPDF';

const DetalleOrden = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [autoridades, setAutoridades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resOrden, resAuth] = await Promise.all([
          fetch(`/api/ordenes/${id}`),
          fetch('/api/autoridades')
        ]);
        if (resOrden.ok && resAuth.ok) {
          setOrden(await resOrden.json());
          setAutoridades(await resAuth.json());
        }
      } catch (error) { 
        console.error("Error al cargar datos:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    cargarDatos();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
      <p className="font-black text-blue-900 text-xs uppercase tracking-widest">Cargando datos...</p>
    </div>
  );
  
  if (!orden) return <div className="p-20 text-center text-red-600 font-bold">Orden no encontrada.</div>;

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Controles Superiores (Responsivos) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-blue-900 font-black text-xs uppercase transition-colors">
            <ArrowLeft size={18}/> Volver al Listado
          </button>
          
          <PDFDownloadLink
            document={<ComisionPDF data={orden} autoridades={autoridades} />}
            fileName={`Comision_${orden.id}_CESMECA.pdf`}
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

        {/* VISOR INTELIGENTE DE PDF */}
        <div className="bg-white rounded-2xl shadow-2xl h-[70vh] md:h-[85vh] overflow-hidden border border-gray-300 flex flex-col">
          <BlobProvider document={<ComisionPDF data={orden} autoridades={autoridades} />}>
            {({ url, loading, error }) => {
              if (loading) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                    <p className="font-bold text-gray-500 text-xs uppercase tracking-widest">Generando Documento...</p>
                  </div>
                );
              }
              if (error) {
                return <div className="flex-1 flex items-center justify-center text-red-600 font-bold">Ocurrió un error al generar el PDF.</div>;
              }
              
              // 🔴 La magia: Usamos <object>. Si el navegador no puede mostrarlo, cae en el <div> de respaldo.
              return (
                <object data={url} type="application/pdf" className="w-full h-full">
                  
                  {/* ESTO SOLO SE MUESTRA EN CELULARES O NAVEGADORES SIN VISOR */}
                  <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6 text-center">
                    <FileText size={64} className="text-gray-300 mb-4" />
                    <h3 className="text-lg md:text-xl font-black text-blue-900 mb-2">Vista previa no disponible</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-md">
                      Tu navegador actual (o teléfono móvil) no soporta la previsualización directa de documentos PDF integrados.
                    </p>
                    <a 
                      href={url} 
                      download={`Comision_${orden.id}_CESMECA.pdf`} 
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95"
                    >
                      <Download size={20} />
                      Descargar para ver
                    </a>
                  </div>

                </object>
              );
            }}
          </BlobProvider>
        </div>

      </div>
    </div>
  );
};

export default DetalleOrden;
