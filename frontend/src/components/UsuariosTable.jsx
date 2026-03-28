import React, { useState, useEffect } from 'react';
import { Plus, Edit, Search, X, Save, ShieldCheck, Lock, UserCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const UsuariosTable = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState({ id: null, username: '', password: '', nombre: '', rol: 'Auxiliar', activo: true });

  const cargarUsuarios = () => {
    fetch('/api/usuarios')
      .then(res => res.json())
      .then(data => setUsuarios(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error cargando usuarios:", err));
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = form.id ? `/api/usuarios/${form.id}` : '/api/usuarios';
    const method = form.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        // 🔴 Cambiamos el alert() por un Toast elegante
        Swal.fire({
            title: '¡Guardado!',
            text: 'El usuario se configuró correctamente.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
        setMostrarModal(false);
        cargarUsuarios();
      } else {
        const errorText = await response.text();
        Swal.fire('Error al guardar', errorText, 'error');
      }
    } catch (error) {
      Swal.fire('Error de conexión', 'No se pudo contactar al servidor.', 'error');
    }
  };

  const abrirModal = (u = null) => {
    if (u) {
      setForm({ ...u, password: '' }); 
    } else {
      setForm({ id: null, username: '', password: '', nombre: '', rol: 'Auxiliar', activo: true });
    }
    setMostrarModal(true);
  };

  const filtrados = usuarios.filter(u => 
    (u.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) || 
    (u.username || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">Gestión de Usuarios</h1>
              <p className="text-gray-500 font-bold text-sm">Control de acceso al sistema UNICACH</p>
            </div>
          </div>
          <button onClick={() => abrirModal()} className="bg-blue-700 text-white px-6 py-3 rounded-lg font-black shadow-lg hover:bg-blue-800 flex items-center gap-2 transition-all active:scale-95 w-full md:w-auto justify-center">
            <Plus size={20} /> Nuevo Usuario
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o usuario..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
          />
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b text-[10px] uppercase font-black text-gray-500 tracking-widest">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 text-center">Estatus</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2">
                        <UserCircle size={16} className="text-blue-400" /> {u.nombre}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{u.username}</td>
                    <td className="px-6 py-4 font-medium text-blue-900">{u.rol}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                          <button onClick={() => abrirModal(u)} className="text-orange-500 hover:bg-orange-100 p-2 rounded-md transition-colors" title="Editar Permisos">
                              <Edit size={18} />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-blue-900 px-6 py-4 flex justify-between items-center text-white font-black">
              <h3>{form.id ? 'Editar Acceso' : 'Nuevo Acceso'}</h3>
              <button onClick={() => setMostrarModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input required type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
                  <input required disabled={form.id} type="text" className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={form.username} onChange={e => setForm({...form, username: e.target.value.toLowerCase()})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rol</label>
                  <select className="w-full p-3 border rounded-lg bg-white outline-none" value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
                    <option value="Administradora">Administradora</option>
                    <option value="Auxiliar">Auxiliar</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><Lock size={12}/> {form.id ? 'Cambiar Contraseña (opcional)' : 'Contraseña'}</label>
                <input required={!form.id} type="password" placeholder={form.id ? "Dejar en blanco para mantener" : "Mínimo 6 caracteres"} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
              <div className="pt-2">
                <label className="flex items-center cursor-pointer gap-2">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})} />
                  <span className="text-sm font-bold text-gray-700">Cuenta Autorizada para Acceso</span>
                </label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-100 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors text-gray-600">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-black flex justify-center items-center gap-2 hover:bg-blue-800 transition-colors shadow-lg"><Save size={20} /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosTable;
