import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, FileText, Search, Trash2, Copy, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

const ComisionesTable = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [anioActivo, setAnioActivo] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  // 🔴 Estado para controlar el Modal de Confirmación
  const [ordenAEliminar, setOrdenAEliminar] = useState(null);

  useEffect(() => {
    fetch('/api/ordenes')
      .then(res => res.json())
      .then(data => {
          setOrdenes(data);
          const anios = [...new Set(data.map(o => o.anio_folio || 2026))].sort((a, b) => b - a);
          if (anios.length > 0 && !anios.includes(anioActivo)) {
              setAnioActivo(anios[0]);
          }
      })
      .catch(err => console.error("Error al cargar órdenes:", err));
  }, [anioActivo]);

  const aniosDisponibles = [...new Set(ordenes.map(o => o.anio_folio || 2026))].sort((a, b) => b - a);

  const ordenesFiltradas = ordenes.filter(o => {
      const coincideAnio = (o.anio_folio || 2026) === anioActivo;
      const texto = busqueda.toLowerCase();
      const coincideBusqueda = o.comisionado?.toLowerCase().includes(texto) ||
                               o.numero_folio?.toString().includes(texto) || 
                               o.id?.toString().includes(texto);
      return coincideAnio && coincideBusqueda;
  });

  // FUNCIÓN PARA DUPLICAR ORDEN
  const handleDuplicar = async (id) => {
      try {
          const res = await fetch(`/api/ordenes/duplicar/${id}`);
          if (res.ok) {
              const dataParaDuplicar = await res.json();
              localStorage.setItem('borrador_comision', JSON.stringify(dataParaDuplicar));
              
              Swal.fire({
                  title: '¡Información Copiada!',
                  text: 'Los datos están listos. Solo asigna el nombre del nuevo comisionado.',
                  icon: 'success',
                  timer: 2500,
                  showConfirmButton: false
              }).then(() => {
                  navigate('/crear');
              });
          }
      } catch (error) {
          Swal.fire('Error', 'No se pudo copiar la información.', 'error');
      }
  };

  // 🔴 Nueva función de eliminación que usa nuestro modal
  const ejecutarEliminacion = async () => {
      if (ordenAEliminar) {
          try {
              const response = await fetch(`/api/ordenes/${ordenAEliminar.id}`, { method: 'DELETE' });
              if (response.ok) {
                  setOrdenes(ordenes.filter(o => o.id !== ordenAEliminar.id));
                  setOrdenAEliminar(null); // Cierra el modal
              }
          } catch (error) {
              Swal.fire('Error', 'Fallo de conexión con el servidor.', 'error');
          }
      }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">
              Gestión de Oficios
            </h1>
            <p className="text-gray-500 font-bold text-sm">Control y seguimiento de comisiones</p>
          </div>
          
          <button 
            onClick={() => navigate('/crear')}
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-black shadow-lg transition-all active:scale-95"
          >
            <Plus size={20} /> Nueva Comisión
          </button>
        </div>

        {/* Pestañas por Año (Scroll horizontal) */}
        {aniosDisponibles.length > 0 && (
            <div className="flex gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap pt-2 pl-4 custom-scrollbar">
                {aniosDisponibles.map(anio => (
                    <button
                        key={anio}
                        onClick={() => setAnioActivo(anio)}
                        className={`inline-block px-8 py-3 rounded-t-xl font-black text-sm transition-all border border-b-0 -mb-[1px] relative z-10 ${
                            anioActivo === anio
                            ? 'bg-white text-blue-900 border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'
                            : 'bg-gray-200 text-gray-500 border-transparent hover:bg-gray-300 shadow-inner'
                        }`}
                    >
                        Año {anio}
                    </button>
                ))}
            </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl rounded-tl-none shadow-xl border border-gray-200 overflow-hidden relative z-0">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder={`Buscar en el archivo ${anioActivo}...`}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                </div>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                    <tr className="bg-white border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-widest text-center">
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
                        {String(orden.numero_folio || orden.id).padStart(3, '0')}/CESMECA/{orden.anio_folio || 2026}
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
                              onClick={() => handleDuplicar(orden.id)} 
                              className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-md transition-colors"
                              title="Duplicar Comisión"
                            >
                              <Copy size={18} />
                            </button>
                            <button 
                              onClick={() => navigate(`/editar/${orden.id}`)} 
                              className="text-orange-500 hover:bg-orange-100 p-1.5 rounded-md transition-colors"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => navigate(`/orden/${orden.id}`)} 
                              className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-md transition-colors"
                              title="Ver y Generar PDF"
                            >
                              <FileText size={18} />
                            </button>
                            {/* 🔴 Aquí activamos el modal pasándole la orden completa */}
                            <button 
                              onClick={() => setOrdenAEliminar(orden)} 
                              className="text-red-500 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                              title="Eliminar permanentemente"
                            >
                              <Trash2 size={18} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            
            {ordenesFiltradas.length === 0 && (
                <div className="p-10 md:p-20 text-center bg-gray-50">
                <p className="text-gray-400 font-bold italic text-sm md:text-base">No hay oficios registrados para el año {anioActivo}.</p>
                </div>
            )}
        </div>
      </div>

      {/* 🔴 NUEVO MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {ordenAEliminar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800">¿Eliminar Oficio?</h3>
              <p className="text-gray-500 font-medium text-sm">
                Estás a punto de eliminar el oficio de <span className="font-bold text-gray-900">{ordenAEliminar.comisionado}</span> con destino a <span className="font-bold text-gray-900">{ordenAEliminar.lugar}</span>. Esta acción no se puede deshacer.
              </p>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setOrdenAEliminar(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button onClick={ejecutarEliminacion} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-lg transition-colors flex justify-center items-center gap-2">
                  <Trash2 size={20} /> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            height: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
    </div>
  );
};

export default ComisionesTable;
