import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, User, MapPin, Calendar, Car, DollarSign } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ComisionPDF from './ComisionPDF';

const VerComision = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/ordenes/${id}`)
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error("Error:", err));
  }, [id]);

  if (!data) return <div className="p-8 text-center text-gray-500">Cargando información de la comisión...</div>;

  const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabecera de Acción */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-gray-600 hover:text-blue-900 transition-colors font-medium"
          >
            <ArrowLeft size={20} /> Volver a la lista
          </button>
          
          <PDFDownloadLink 
            document={<ComisionPDF data={data} />} 
            fileName={`comision_${id}_CESMECA.pdf`}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition-all font-bold"
          >
            <Printer size={18} /> Descargar PDF Oficial
          </PDFDownloadLink>
        </div>

        {/* Tarjeta de Información Detallada */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-blue-900 p-5 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider">
                Orden de Comisión: {data.id.toString().padStart(3, '0')}/CESMECA/2026
              </h2>
              <p className="text-blue-200 text-xs mt-1">Vista de consulta de solo lectura</p>
            </div>
            <span className="bg-white text-blue-900 px-4 py-1 rounded-full text-xs font-black uppercase shadow-sm">
                {data.estatus || 'Borrador'}
            </span>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Sección 1: Comisionado */}
            <div className="space-y-4">
              <h3 className="text-blue-900 font-bold border-b pb-2 flex items-center gap-2 uppercase text-sm tracking-tight">
                <User size={18} className="text-blue-700"/> 1. Datos del Comisionado
              </h3>
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase font-bold">Nombre Completo: 
                  <span className="text-gray-900 block font-normal text-base normal-case">{data.comisionado}</span>
                </p>
                <p className="text-xs text-gray-500 uppercase font-bold">R.F.C: 
                  <span className="text-gray-900 block font-normal text-base">{data.rfc || 'No registrado'}</span>
                </p>
                <p className="text-xs text-gray-500 uppercase font-bold">Adscripción: 
                  <span className="text-gray-900 block font-normal text-base normal-case">{data.adscripcion}</span>
                </p>
                <p className="text-xs text-gray-500 uppercase font-bold">Categoría: 
                  <span className="text-gray-900 block font-normal text-base normal-case">{data.categoria}</span>
                </p>
              </div>
            </div>

            {/* Sección 2: Detalles de la Comisión */}
            <div className="space-y-4">
              <h3 className="text-blue-900 font-bold border-b pb-2 flex items-center gap-2 uppercase text-sm tracking-tight">
                <MapPin size={18} className="text-blue-700"/> 2. Itinerario y Motivo
              </h3>
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase font-bold">Lugar de Comisión: 
                  <span className="text-gray-900 block font-normal text-base normal-case">{data.lugar}</span>
                </p>
                <p className="text-xs text-gray-500 uppercase font-bold">Periodo: 
                  <span className="text-gray-900 block font-normal text-base">
                    Del {new Date(data.fecha_inicio).toLocaleDateString()} al {new Date(data.fecha_fin).toLocaleDateString()}
                  </span>
                </p>
                <p className="text-xs text-gray-500 uppercase font-bold">Motivo de la comisión: 
                  <span className="text-gray-900 block font-normal text-base italic normal-case leading-relaxed bg-gray-50 p-2 rounded mt-1 border-l-2 border-gray-300">
                    "{data.motivo}"
                  </span>
                </p>
              </div>
            </div>

            {/* Sección 3: Transporte */}
            <div className="md:col-span-2 space-y-4">
               <h3 className="text-blue-900 font-bold border-b pb-2 flex items-center gap-2 uppercase text-sm tracking-tight">
                <Car size={18} className="text-blue-700"/> 3. Información del Transporte
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <p className="text-xs text-gray-500 uppercase font-bold">Medio: <span className="text-gray-900 block font-normal text-sm">{data.medio_transporte}</span></p>
                <p className="text-xs text-gray-500 uppercase font-bold">Vehículo: <span className="text-gray-900 block font-normal text-sm">{data.vehiculo_marca || 'N/A'}</span></p>
                <p className="text-xs text-gray-500 uppercase font-bold">Modelo: <span className="text-gray-900 block font-normal text-sm">{data.vehiculo_modelo || 'N/A'}</span></p>
                <p className="text-xs text-gray-500 uppercase font-bold">Placas: <span className="text-gray-900 block font-normal text-sm">{data.vehiculo_placas || 'N/A'}</span></p>
              </div>
            </div>

            {/* Sección 4: Finanzas */}
            <div className="md:col-span-2 bg-orange-50 p-6 rounded-lg border border-orange-200">
               <h3 className="text-orange-900 font-bold mb-4 flex items-center gap-2 uppercase text-sm">
                 <DollarSign size={18}/> 4. Desglose de Gastos
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div><p className="text-[10px] text-orange-700 font-bold uppercase">Combustible</p><p className="text-base font-bold text-gray-800">{money(data.importe_combustible)}</p></div>
                  <div><p className="text-[10px] text-orange-700 font-bold uppercase">Pasajes</p><p className="text-base font-bold text-gray-800">{money(data.importe_pasajes)}</p></div>
                  <div><p className="text-[10px] text-orange-700 font-bold uppercase">Viáticos</p><p className="text-base font-bold text-gray-800">{money(data.importe_viaticos)}</p></div>
                  <div><p className="text-[10px] text-orange-700 font-bold uppercase">Otros</p><p className="text-base font-bold text-gray-800">{money(data.importe_otros)}</p></div>
                  <div className="bg-white p-2 rounded shadow-sm border border-orange-200 text-center">
                    <p className="text-[10px] text-blue-900 font-bold uppercase">Total Autorizado</p>
                    <p className="text-lg font-black text-blue-900">{money(data.importe_total)}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-gray-400 text-xs italic">
          Este documento es una representación digital de la orden de comisión generada por el sistema CESMECA 2026.
        </p>
      </div>
    </div>
  );
};

export default VerComision;
