import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { ArrowLeft, Download } from 'lucide-react';
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
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    cargarDatos();
  }, [id]);

  if (loading) return <div className="p-20 text-center font-black text-blue-900">CARGANDO VISTA PREVIA...</div>;
  if (!orden) return <div className="p-20 text-center text-red-600 font-bold">ORDEN NO ENCONTRADA</div>;

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-blue-900 font-bold uppercase text-xs">
            <ArrowLeft size={20}/> Volver al Listado
          </button>
          
          <PDFDownloadLink
            document={<ComisionPDF data={orden} autoridades={autoridades} />}
            fileName={`Comision_${orden.id}.pdf`}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-black shadow-lg hover:bg-green-700 transition-all active:scale-95 text-xs uppercase"
          >
            {({ loading }) => (loading ? 'Generando...' : 'Descargar PDF')}
          </PDFDownloadLink>
        </div>

        <div className="bg-white rounded-xl shadow-2xl h-[85vh] overflow-hidden border border-gray-300">
          <PDFViewer width="100%" height="100%" className="border-none">
            <ComisionPDF data={orden} autoridades={autoridades} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

export default DetalleOrden;
