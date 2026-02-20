import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, FileText, Search, LogOut, User } from 'lucide-react';

const ComisionesTable = ({ usuario, onLogout }) => {
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/ordenes')
      .then(res => res.json())
      .then(data => setOrdenes(data))
      .catch(err => console.error("Error al cargar órdenes:", err));
  }, []);

  const ordenesFiltradas = ordenes.filter(o => 
    o.comisionado?.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.id?.toString().includes(busqueda)
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-black text-blue-900 uppercase tracking-tight">
              UNICACH - CESMECA
            </h1>
            <p className="text-blue-700 font-bold text-sm">Control de Comisiones 2026</p>
          </div>
          
          {/* Bloque de Usuario + Botón de Nueva Comisión */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            
            {/* Saludo y Cerrar Sesión (Solo se muestra si 'usuario' existe) */}
            {usuario && (
              <div className="flex items-center gap-3 bg-gray-100 px-4 py-2.5 rounded-lg w-full sm:w-auto justify-center border border-gray-200 shadow-sm">
                <User size={18} className="text-blue-600" />
                <div className="flex flex-col text-left">
                  <span className="text-xs text-gray-500 font-bold leading-none">{usuario.rol}</span>
                  <span className="text-sm text-gray-800 font-black leading-tight">{usuario.nombre}</span>
                </div>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <button 
                  onClick={onLogout} 
                  className="text-gray-400 hover:text-red-600 transition-colors p-1" 
                  title="Cerrar Sesión"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}

            <button 
              onClick={() => navigate('/crear')}
              className="flex items-center justify-center gap-2 w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-black shadow-lg transition-all active:scale-95"
            >
              <Plus size={20} /> Nueva Comisión
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por comisionado o número de oficio..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Tabla Responsiva */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-widest text-center">
                  <th className="px-4 py-4 md:px-6">Nº Oficio</th>
                  <th className="px-4 py-4 md:px-6 text-left">Comisionado</th>
                  <th className="px-4 py-4 md:px-6 text-left">Destino</th>
                  <th className="px-4 py-4 md:px-6">Periodo</th>
                  <th className="px-4 py-4 md:px-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-center">
                {ordenesFiltradas.map((orden) => (
                  <tr key={orden.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4 md:px-6 font-bold text-blue-900 text-xs md:text-sm whitespace-nowrap">
                      {orden.id?.toString().padStart(3, '0')}/CESMECA/2026
                    </td>
                    <td className="px-4 py-4 md:px-6 font-black text-gray-800 text-xs md:text-sm text-left">
                      {orden.comisionado}
                    </td>
                    <td className="px-4 py-4 md:px-6 text-gray-600 text-xs md:text-sm font-medium text-left">
                      {orden.lugar}
                    </td>
                    <td className="px-4 py-4 md:px-6 text-[10px] md:text-xs font-bold text-gray-500 whitespace-nowrap">
                      {new Date(orden.fecha_inicio).toLocaleDateString('es-MX', {day:'2-digit', month:'2-digit', year:'2-digit'})}
                      {orden.fecha_fin && ` → ${new Date(orden.fecha_fin).toLocaleDateString('es-MX', {day:'2-digit', month:'2-digit', year:'2-digit'})}`}
                    </td>
                    <td className="px-4 py-4 md:px-6">
                      <div className="flex justify-center gap-2 md:gap-3">
                        <button 
                          onClick={() => navigate(`/editar/${orden.id}`)} 
                          className="text-orange-500 hover:bg-orange-100 p-1.5 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/orden/${orden.id}`)} 
                          className="text-red-600 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                          title="Ver y Generar PDF"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {ordenesFiltradas.length === 0 && (
            <div className="p-10 md:p-20 text-center">
              <p className="text-gray-400 font-bold italic text-sm md:text-base">No se encontraron registros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComisionesTable;
