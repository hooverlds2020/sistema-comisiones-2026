import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, ChevronLeft, ChevronRight, Layers, AlertTriangle } from 'lucide-react';

const ClavesProgramaticasTable = () => {
  const [claves, setClaves] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState({ id: null, clave: '', descripcion: '' });
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // 🔴 Estado para controlar el Modal de Confirmación
  const [claveAEliminar, setClaveAEliminar] = useState(null);

  const cargarClaves = async () => {
    try {
      const res = await fetch('/api/claves-programaticas');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setClaves(data);
      } else {
        console.error("Respuesta inesperada del servidor:", data);
        setClaves([]);
        alert(`❌ Error del servidor al cargar: ${data.error || 'Respuesta inválida'}`);
      }
    } catch (err) {
      console.error(err);
      setClaves([]);
    }
  };

  useEffect(() => { cargarClaves(); }, []);
  useEffect(() => { setPaginaActual(1); }, [busqueda]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = form.id ? `/api/claves-programaticas/${form.id}` : '/api/claves-programaticas';
    const method = form.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setMostrarModal(false);
        cargarClaves();
      } else {
        const errorData = await response.text();
        alert(`❌ Error al guardar: ${errorData}`);
      }
    } catch (error) {
      alert('❌ Error de conexión con el servidor.');
    }
  };

  // 🔴 Nueva función de eliminación elegante
  const ejecutarEliminacion = async () => {
    if (claveAEliminar) {
      try {
        await fetch(`/api/claves-programaticas/${claveAEliminar.id}`, { method: 'DELETE' });
        setClaveAEliminar(null); // Cierra el modal
        cargarClaves(); // Recarga la tabla
      } catch (error) {
        alert('❌ Error al eliminar la clave.');
      }
    }
  };

  const abrirModal = (clave = null) => {
    if (clave) {
      setForm(clave);
    } else {
      setForm({ id: null, clave: '', descripcion: '' });
    }
    setMostrarModal(true);
  };

  const filtrados = (Array.isArray(claves) ? claves : []).filter(c => 
    (c.clave || '').toLowerCase().includes(busqueda.toLowerCase()) || 
    (c.descripcion || '').toLowerCase().includes(busqueda.toLowerCase())
  );
  
  const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina);
  const indicePrimerItem = (paginaActual - 1) * itemsPorPagina;
  const itemsActuales = filtrados.slice(indicePrimerItem, indicePrimerItem + itemsPorPagina);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
              <Layers size={28} /> 
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">Claves Programáticas</h1>
              <p className="text-gray-500 font-bold text-sm">Catálogo de programas institucionales</p>
            </div>
          </div>
          <button onClick={() => abrirModal()} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-black shadow-lg transition-all active:scale-95">
            <Plus size={20} /> Nueva Clave
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" placeholder="Buscar por clave o descripción..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-widest">
                  <th className="px-6 py-4 w-1/4">Clave</th>
                  <th className="px-6 py-4 w-2/4">Descripción</th>
                  <th className="px-6 py-4 text-center w-1/4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemsActuales.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-blue-900 text-sm">{c.clave}</td>
                    <td className="px-6 py-4 font-medium text-gray-600 text-sm">{c.descripcion}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => abrirModal(c)} className="text-orange-500 hover:bg-orange-100 p-1.5 rounded-md transition-colors" title="Editar"><Edit size={18} /></button>
                        {/* 🔴 Aquí activamos el modal pasándole la clave a eliminar */}
                        <button onClick={() => setClaveAEliminar(c)} className="text-red-600 hover:bg-red-100 p-1.5 rounded-md transition-colors" title="Eliminar"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {itemsActuales.length === 0 && (
                  <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-500 font-medium">No hay claves registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPaginas > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">
                Página <span className="font-bold text-gray-900">{paginaActual}</span> de <span className="font-bold text-gray-900">{totalPaginas}</span>
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={18} /></button>
                <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={18} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE EDICIÓN / CREACIÓN */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-blue-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-black text-lg">{form.id ? 'Editar Clave' : 'Nueva Clave'}</h3>
              <button onClick={() => setMostrarModal(false)} className="text-blue-200 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Clave</label>
                <input required type="text" placeholder="Ej. 123-ABC" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" value={form.clave} onChange={e => setForm({...form, clave: e.target.value.toUpperCase()})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <textarea required rows="3" placeholder="Descripción de la clave..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}></textarea>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-black py-3 rounded-lg transition-colors flex justify-center items-center gap-2"><Save size={20} /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔴 NUEVO MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {claveAEliminar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800">¿Eliminar Clave?</h3>
              <p className="text-gray-500 font-medium text-sm">
                Estás a punto de eliminar la clave <span className="font-bold text-gray-900">{claveAEliminar.clave}</span>. Esta acción no se puede deshacer.
              </p>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setClaveAEliminar(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors">
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
    </div>
  );
};

export default ClavesProgramaticasTable;
