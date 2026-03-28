import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

const PersonalTable = () => {
  const [personal, setPersonal] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState({ id: null, nombre: '', rfc: '', categoria: '', adscripcion: 'CESMECA' });

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const [empleadoAEliminar, setEmpleadoAEliminar] = useState(null);

  const cargarPersonal = () => {
    fetch('/api/personal')
      .then(res => res.json())
      .then(data => setPersonal(data))
      .catch(err => console.error(err));
  };

  useEffect(() => { cargarPersonal(); }, []);
  useEffect(() => { setPaginaActual(1); }, [busqueda]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = form.id ? `/api/personal/${form.id}` : '/api/personal';
    const method = form.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        Swal.fire({
            title: '¡Guardado!',
            text: 'El empleado se registró correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
        setMostrarModal(false);
        cargarPersonal();
      } else {
        const errorText = await response.text();
        Swal.fire('Error', `No se pudo guardar: ${errorText}`, 'error');
      }
    } catch (error) {
      Swal.fire('Error de conexión', 'No se pudo contactar al servidor.', 'error');
    }
  };

  const ejecutarEliminacion = async () => {
    if (empleadoAEliminar) {
      await fetch(`/api/personal/${empleadoAEliminar.id}`, { method: 'DELETE' });
      setEmpleadoAEliminar(null);
      cargarPersonal();
    }
  };

  const abrirModal = (empleado = null) => {
    if (empleado) {
      setForm(empleado);
    } else {
      setForm({ id: null, nombre: '', rfc: '', categoria: '', adscripcion: 'CESMECA' });
    }
    setMostrarModal(true);
  };

  const filtrados = personal.filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()));
  const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const itemsActuales = filtrados.slice(indicePrimerItem, indiceUltimoItem);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">Catálogo de Personal</h1>
            <p className="text-gray-500 font-bold text-sm">Gestiona los trabajadores del CESMECA</p>
          </div>
          <button onClick={() => abrirModal()} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-black shadow-lg transition-all active:scale-95">
            <Plus size={20} /> Nuevo Empleado
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" placeholder="Buscar por nombre..." 
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
                  <th className="px-6 py-4">RFC</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemsActuales.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 text-sm">{p.nombre}</td>
                    <td className="px-6 py-4 font-medium text-gray-600 text-sm">{p.rfc}</td>
                    <td className="px-6 py-4 font-medium text-gray-600 text-xs">{p.categoria}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => abrirModal(p)} className="text-orange-500 hover:bg-orange-100 p-1.5 rounded-md" title="Editar"><Edit size={18} /></button>
                        <button onClick={() => setEmpleadoAEliminar(p)} className="text-red-600 hover:bg-red-100 p-1.5 rounded-md" title="Eliminar"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {itemsActuales.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium">
                      No se encontraron registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">
                Mostrando <span className="font-bold text-gray-900">{indicePrimerItem + 1}</span> a <span className="font-bold text-gray-900">{Math.min(indiceUltimoItem, filtrados.length)}</span> de <span className="font-bold text-gray-900">{filtrados.length}</span> empleados
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
              <h3 className="text-white font-black text-lg">{form.id ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
              <button onClick={() => setMostrarModal(false)} className="text-blue-200 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input required type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value.toUpperCase()})} />
              </div>
              
              {/* 🔴 AQUÍ ESTÁ EL CANDADO DEL RFC (PERSONA FÍSICA) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">R.F.C. (Persona Física)</label>
                <input 
                  required 
                  type="text" 
                  maxLength={13} 
                  minLength={13}
                  pattern="^[A-Z&Ñ]{4}[0-9]{6}[A-Z0-9]{3}$"
                  title="El RFC para persona física debe tener exactamente 13 caracteres: 4 letras iniciales, 6 números (AAMMDD) y 3 caracteres de homoclave."
                  placeholder="Ej. GGSJ801220TNA"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase font-mono" 
                  value={form.rfc} 
                  onChange={e => setForm({...form, rfc: e.target.value.toUpperCase().replace(/[^A-Z0-9Ñ&]/g, '')})} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
                <input required type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value.toUpperCase()})} />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-black py-3 rounded-lg transition-colors flex justify-center items-center gap-2"><Save size={20} /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {empleadoAEliminar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800">¿Eliminar Empleado?</h3>
              <p className="text-gray-500 font-medium text-sm">
                Estás a punto de eliminar a <span className="font-bold text-gray-900">{empleadoAEliminar.nombre}</span> del catálogo. Esta acción no se puede deshacer.
              </p>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setEmpleadoAEliminar(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors">
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

export default PersonalTable;
