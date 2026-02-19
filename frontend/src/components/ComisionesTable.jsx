import React, { useState, useEffect } from 'react';
import { Eye, Edit, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ComisionPDF from './ComisionPDF';

const ComisionesTable = () => {
  const [comisiones, setComisiones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Carga inicial de datos desde el backend
    fetch('/api/ordenes')
      .then(res => res.json())
      .then(data => setComisiones(data))
      .catch(err => console.error("Error cargando datos:", err));
  }, []);

  // Formateador de fechas para la tabla
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      
      {/* Encabezado Institucional */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-900 mb-8 flex flex-col md:flex-row justify-between items-center">
        <div>
           <h1 className="text-xl font-bold text-blue-900 uppercase tracking-tight">Universidad de Ciencias y Artes de Chiapas</h1>
           <h2 className="text-md text-gray-600 font-semibold">Centro de Estudios Superiores de México y Centroamérica</h2>
           <p className="text-sm text-gray-500 mt-1 italic">Sistema de Gestión de Órdenes de Comisión 2026</p>
        </div>
        <button 
          onClick={() => navigate('/crear')} 
          className="mt-4 md:mt-0 bg-blue-800 hover:bg-blue-900 text-white px-6 py-2 rounded-md shadow-md flex items-center gap-2 transition-all font-bold active:scale-95"
        >
          <Plus size={20} />
          <span>Nueva Comisión</span>
        </button>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-black text-center border-r w-32">Nº Oficio</th>
                <th className="p-4 font-black border-r">Comisionado</th>
                <th className="p-4 font-black border-r">Destino</th>
                <th className="p-4 font-black border-r">Periodo</th>
                <th className="p-4 font-black text-center border-r">Estatus</th>
                <th className="p-4 font-black text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {comisiones.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                  {/* Número de Oficio con Nomenclatura CESMECA */}
                  <td className="p-4 text-center font-mono font-bold text-blue-900 border-r bg-gray-50/30">
                    {item.id.toString().padStart(3, '0')}/CESMECA/2026
                  </td>
                  
                  <td className="p-4 font-semibold text-gray-900 border-r">
                    {item.comisionado}
                  </td>
                  
                  <td className="p-4 text-gray-600 border-r">
                    {item.lugar}
                  </td>
                  
                  <td className="p-4 text-gray-600 border-r">
                    <span className="whitespace-nowrap">{formatDate(item.fecha_inicio)}</span>
                    {item.fecha_fin && item.fecha_fin !== item.fecha_inicio && (
                      <span className="text-gray-400"> → {formatDate(item.fecha_fin)}</span>
                    )}
                  </td>
                  
                  <td className="p-4 text-center border-r">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${
                      item.estatus === 'Autorizado' ? 'bg-green-100 text-green-700 border-green-200' :
                      item.estatus === 'Pagado' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      item.estatus === 'Pendiente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {item.estatus || 'Borrador'}
                    </span>
                  </td>

                  <td className="p-4 flex justify-center gap-3">
                    {/* Botón Ver Detalle (Ojo) */}
                    <button 
                      onClick={() => navigate(`/ver/${item.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" 
                      title="Ver Detalle HTML"
                    >
                      <Eye size={18} />
                    </button>
                    
                    {/* Botón Editar (Lápiz) */}
                    <button 
                      onClick={() => navigate(`/editar/${item.id}`)}
                      className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all" 
                      title="Editar Datos"
                    >
                      <Edit size={18} />
                    </button>

                    {/* Botón Descargar (PDF) */}
                    <PDFDownloadLink 
                      document={<ComisionPDF data={item} />} 
                      fileName={`Comision_${item.id}_CESMECA.pdf`}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all flex items-center justify-center"
                      title="Descargar PDF Oficial"
                    >
                      {({ loading }) => (loading ? '...' : <FileText size={18} />)}
                    </PDFDownloadLink>
                  </td>
                </tr>
              ))}
              
              {comisiones.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400 italic">
                    No se encontraron órdenes de comisión en la base de datos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComisionesTable;
