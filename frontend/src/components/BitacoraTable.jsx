import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock, User, Activity, FileText, AlertTriangle } from 'lucide-react';

const BitacoraTable = () => {
  const [bitacora, setBitacora] = useState([]);
  const [accesoDenegado, setAccesoDenegado] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // ���️ EL CADENERO: Verificamos el rol del usuario activo
    const usuarioString = localStorage.getItem('usuarioActivo');
    if (!usuarioString) {
        navigate('/login');
        return;
    }
    
    const usuario = JSON.parse(usuarioString);
    // Verificamos si el rol contiene la palabra "admin" (ej. "Administrador" o "admin")
    if (!usuario.rol || !usuario.rol.toLowerCase().includes('admin')) {
        setAccesoDenegado(true);
        return;
    }

    // Si es admin, cargamos el historial
    fetch('/api/bitacora')
      .then(res => res.json())
      .then(data => setBitacora(data))
      .catch(err => console.error("Error al cargar bitácora:", err));
  }, [navigate]);

  if (accesoDenegado) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border-t-4 border-red-500">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="text-red-600" size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-800 mb-2">Acceso Restringido</h2>
                  <p className="text-gray-600 mb-6">Esta sección es de auditoría y exclusiva para administradores del sistema.</p>
                  <button onClick={() => navigate('/')} className="w-full bg-blue-900 text-white font-bold py-3 rounded-lg hover:bg-blue-800">
                      Volver al Inicio
                  </button>
              </div>
          </div>
      );
  }

  const getActionColor = (accion) => {
      switch(accion) {
          case 'CREAR': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
          case 'EDITAR': return 'bg-orange-100 text-orange-800 border-orange-200';
          case 'ELIMINAR': return 'bg-red-100 text-red-800 border-red-200';
          case 'LOGIN': return 'bg-blue-100 text-blue-800 border-blue-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200 gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-900 text-white rounded-lg shadow-md">
                    <ShieldAlert size={28} />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">Historial de Auditoría</h1>
                    <p className="text-gray-500 font-bold text-sm">Registro inmutable de movimientos del sistema</p>
                </div>
            </div>
            <button onClick={() => navigate('/')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold transition-colors">
                Volver
            </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-black text-gray-500">
                            <th className="px-6 py-4"><div className="flex items-center gap-2"><Clock size={16}/> Fecha y Hora</div></th>
                            <th className="px-6 py-4"><div className="flex items-center gap-2"><User size={16}/> Usuario</div></th>
                            <th className="px-6 py-4"><div className="flex items-center gap-2"><Activity size={16}/> Acción</div></th>
                            <th className="px-6 py-4"><div className="flex items-center gap-2"><FileText size={16}/> Folio Afectado</div></th>
                            <th className="px-6 py-4">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bitacora.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-12 text-gray-400 font-bold italic">No hay movimientos registrados aún.</td></tr>
                        ) : (
                            bitacora.map((mov) => (
                                <tr key={mov.id} className="hover:bg-gray-50 transition-colors text-sm">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-600">
                                        {new Date(mov.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' })}
                                    </td>
                                    <td className="px-6 py-4 font-black text-blue-900">{mov.usuario}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getActionColor(mov.accion)}`}>
                                            {mov.accion}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-700">{mov.folio || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{mov.detalles}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BitacoraTable;
