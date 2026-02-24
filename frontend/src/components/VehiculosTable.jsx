import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, ChevronLeft, ChevronRight, Car } from 'lucide-react';

const VehiculosTable = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState({ id: null, marca: '', modelo: '', placas: '' });

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const cargarVehiculos = () => {
    fetch('/api/vehiculos')
      .then(res => res.json())
      .then(data => setVehiculos(data))
      .catch(err => console.error(err));
  };

  useEffect(() => { cargarVehiculos(); }, []);
  useEffect(() => { setPaginaActual(1); }, [busqueda]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = form.id ? `/api/vehiculos/${form.id}` : '/api/vehiculos';
    const method = form.id ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setMostrarModal(false);
    cargarVehiculos();
  };

  const eliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este vehículo?')) {
      await fetch(`/api/vehiculos/${id}`, { method: 'DELETE' });
      cargarVehiculos();
    }
  };

  const abrirModal = (vehiculo = null) => {
    if (vehiculo) {
      setForm(vehiculo);
    } else {
      setForm({ id: null, marca: '', modelo: '', placas: '' });
    }
    setMostrarModal(true);
  };

  const filtrados = vehiculos.filter(v => 
    v.marca?.toLowerCase().includes(busqueda.toLowerCase()) || 
    v.modelo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.placas?.toLowerCase().includes(busqueda.toLowerCase())
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
              <Car size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">Catálogo de Vehículos</h1>
              <p className="text-gray-500 font-bold text-sm">Gestiona la flotilla oficial del CESMECA</p>
            </div>
          </div>
          <button onClick={() => abrirModal()} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-black shadow-lg transition-all active:scale-95">
            <Plus size={20} /> Nuevo Vehículo
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" placeholder="Buscar por marca, modelo o placas..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-widest">
                  <th className="px-6 py-4">Marca</th>
                  <th className="px-6 py-4">Modelo</th>
                  <th className="px-6 py-4">Placas</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemsActuales.map((v) => (
                  <tr key={v.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 text-sm">{v.marca}</td>
                    <td className="px-6 py-4 font-medium text-gray-600 text-sm">{v.modelo}</td>
                    <td className="px-6 py-4 font-black text-blue-900 text-sm">{v.placas}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => abrirModal(v)} className="text-orange-500 hover:bg-orange-100 p-1.5 rounded-md" title="Editar"><Edit size={18} /></button>
                        <button onClick={() => eliminar(v.id)} className="text-red-600 hover:bg-red-100 p-1.5 rounded-md" title="Eliminar"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {itemsActuales.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium">
                      No se encontraron vehículos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">
                Mostrando <span className="font-bold text-gray-900">{indicePrimerItem + 1}</span> a <span className="font-bold text-gray-900">{Math.min(indiceUltimoItem, filtrados.length)}</span> de <span className="font-bold text-gray-900">{filtrados.length}</span> vehículos
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
              <h3 className="text-white font-black text-lg">{form.id ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
              <button onClick={() => setMostrarModal(false)} className="text-blue-200 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Marca</label>
                <input required type="text" placeholder="Ej. NISSAN" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" value={form.marca} onChange={e => setForm({...form, marca: e.target.value.toUpperCase()})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Modelo</label>
                <input required type="text" placeholder="Ej. TSURU 2015" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value.toUpperCase()})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Placas</label>
                <input required type="text" placeholder="Ej. DPY-123-A" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" value={form.placas} onChange={e => setForm({...form, placas: e.target.value.toUpperCase()})} />
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

export default VehiculosTable;
