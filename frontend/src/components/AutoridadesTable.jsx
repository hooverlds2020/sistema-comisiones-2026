import React, { useState, useEffect } from 'react';
import { Plus, Edit, Search, X, Save, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';

const AutoridadesTable = () => {
  const [autoridades, setAutoridades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: '', cargo: '', activo: true });

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const cargarAutoridades = () => {
    fetch('/api/autoridades')
      .then(res => res.json())
      .then(data => setAutoridades(data))
      .catch(err => console.error(err));
  };

  useEffect(() => { cargarAutoridades(); }, []);
  useEffect(() => { setPaginaActual(1); }, [busqueda]);

  // 🔴 AQUÍ ESTÁ LA NUEVA FUNCIÓN CON ALERTAS Y MANEJO DE ERRORES
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = form.id ? `/api/autoridades/${form.id}` : '/api/autoridades';
    const method = form.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        // ÉXITO: Mostramos alerta, cerramos modal y recargamos tabla
        alert('✅ ¡Autoridad guardada correctamente!');
        setMostrarModal(false);
        cargarAutoridades();
      } else {
        // ERROR DEL SERVIDOR: Lo atrapamos y lo mostramos
        const errorData = await response.text();
        alert(`❌ Error al guardar. El servidor dice: ${errorData}`);
      }
    } catch (error) {
      // ERROR DE RED: Si el servidor de Node está apagado
      console.error(error);
      alert('❌ Error de conexión: No se pudo comunicar con el servidor.');
    }
  };

  const abrirModal = (autoridad = null) => {
    if (autoridad) {
      setForm(autoridad);
    } else {
      setForm({ id: null, nombre: '', cargo: '', activo: true });
    }
    setMostrarModal(true);
  };

  const filtrados = autoridades.filter(a => 
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    a.cargo?.toLowerCase().includes(busqueda.toLowerCase())
  );
  
  const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const itemsActuales = filtrados.slice(indicePrimerItem, indiceUltimoItem);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
              <UserCheck size={28} /> 
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">Catálogo de Autoridades</h1>
              <p className="text-gray-500 font-bold text-sm">Gestiona las firmas autorizadas para los oficios</p>
            </div>
          </div>
          <button onClick={() => abrirModal()} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-black shadow-lg transition-all active:scale-95">
            <Plus size={20} /> Nueva Autoridad
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" placeholder="Buscar por nombre o cargo..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-widest">
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4 text-center">Estatus</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemsActuales.map((a) => (
                  <tr key={a.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 text-sm">{a.nombre}</td>
                    <td className="px-6 py-4 font-medium text-gray-600 text-sm">{a.cargo}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${a.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {a.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => abrirModal(a)} className="text-orange-500 hover:bg-orange-100 p-1.5 rounded-md transition-colors" title="Editar">
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {itemsActuales.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium">
                      No se encontraron autoridades registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">
                Mostrando <span className="font-bold text-gray-900">{indicePrimerItem + 1}</span> a <span className="font-bold text-gray-900">{Math.min(indiceUltimoItem, filtrados.length)}</span> de <span className="font-bold text-gray-900">{filtrados.length}</span> autoridades
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-blue-900 px-4">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button 
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-black text-lg">{form.id ? 'Editar Autoridad' : 'Nueva Autoridad'}</h3>
              <button onClick={() => setMostrarModal(false)} className="text-blue-200 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo (con Grado)</label>
                <input required type="text" placeholder="Ej. Dr. Juan Pérez" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Cargo</label>
                <input required type="text" placeholder="Ej. Director General" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} />
              </div>
              
              <div className="pt-2">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${form.activo ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-bold text-gray-700">
                    {form.activo ? 'Usuario Activo (Firma Autorizada)' : 'Usuario Inactivo'}
                  </div>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-black py-3 rounded-lg transition-colors flex justify-center items-center gap-2"><Save size={20} /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoridadesTable;
