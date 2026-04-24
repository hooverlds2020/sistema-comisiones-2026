import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, FileText, Search, Trash2, Copy, AlertTriangle, ChevronLeft, ChevronRight, Hash, Shield, CheckCircle, Unlock } from 'lucide-react';
import Swal from 'sweetalert2';

const ComisionesTable = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [usuariosCatalogo, setUsuariosCatalogo] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [anioActivo, setAnioActivo] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  const [ordenAEliminar, setOrdenAEliminar] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 15;
  const [filaResaltada, setFilaResaltada] = useState(null);

  const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo') || '{}');
  const nombreUsuario = usuarioActivo.nombre || 'Desconocido';
  const esAdministrador = nombreUsuario.includes('Roberto') || nombreUsuario.includes('Hoover') || usuarioActivo.rol === 'admin';

  useEffect(() => {
    fetch('/api/ordenes')
      .then(res => res.json())
      .then(data => {
          setOrdenes(data);
          const anios = [...new Set(data.map(o => o.anio_folio || 2026))].sort((a, b) => b - a);
          if (anios.length > 0 && !anios.includes(anioActivo)) setAnioActivo(anios[0]);
      })
      .catch(console.error);

    if (esAdministrador) {
        fetch('/api/usuarios').then(res => res.json()).then(data => setUsuariosCatalogo(data)).catch(console.error);
    }
  }, [anioActivo, esAdministrador]);

  const aniosDisponibles = [...new Set(ordenes.map(o => o.anio_folio || 2026))].sort((a, b) => b - a);
  const ordenesDelAnioGlobal = ordenes.filter(o => (o.anio_folio || 2026) === anioActivo);
  const maxFolio = ordenesDelAnioGlobal.reduce((max, obj) => Math.max(max, parseInt(obj.numero_folio || obj.id, 10)), 0);
  const siguienteFolioString = String(maxFolio + 1).padStart(3, '0');

  const ordenesFiltradas = ordenes.filter(o => {
      if (!esAdministrador) {
          const creadorLimpio = (o.usuario_modificador || '').toLowerCase().trim();
          const userLimpio = nombreUsuario.toLowerCase().trim();
          const esCreador = creadorLimpio === userLimpio || (creadorLimpio.length > 3 && userLimpio.includes(creadorLimpio));
          const partesNombre = userLimpio.split(' ');
          const comisionadoLimpio = (o.comisionado || '').toLowerCase();
          const esViajero = partesNombre[0] && comisionadoLimpio.includes(partesNombre[0]) && (partesNombre[1] ? comisionadoLimpio.includes(partesNombre[1]) : true);
          if (!esCreador && !esViajero) return false; 
      }
      const coincideAnio = (o.anio_folio || 2026) === anioActivo;
      const texto = busqueda.toLowerCase();
      const coincideBusqueda = o.comisionado?.toLowerCase().includes(texto) || o.numero_folio?.toString().includes(texto) || o.id?.toString().includes(texto);
      return coincideAnio && coincideBusqueda;
  });

  useEffect(() => {
      const idGuardado = sessionStorage.getItem('ultimoOficioVisto');
      if (idGuardado && ordenesFiltradas.length > 0) {
          const idNum = parseInt(idGuardado, 10);
          const indexEnLista = ordenesFiltradas.findIndex(o => o.id === idNum);
          if (indexEnLista !== -1) {
              setPaginaActual(Math.floor(indexEnLista / elementosPorPagina) + 1);
              setFilaResaltada(idNum);
              sessionStorage.removeItem('ultimoOficioVisto');
              setTimeout(() => {
                  const el = document.getElementById(`oficio-fila-${idNum}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 150);
              setTimeout(() => setFilaResaltada(null), 3000);
          } else { sessionStorage.removeItem('ultimoOficioVisto'); }
      }
  }, [ordenes, anioActivo, busqueda]);

  useEffect(() => { if(!sessionStorage.getItem('ultimoOficioVisto')) setPaginaActual(1); }, [busqueda, anioActivo]);

  const indiceUltimoElemento = paginaActual * elementosPorPagina;
  const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina;
  const ordenesPaginadas = ordenesFiltradas.slice(indicePrimerElemento, indiceUltimoElemento);
  const totalPaginas = Math.ceil(ordenesFiltradas.length / elementosPorPagina);

  const handleDuplicar = async (id) => {
      try {
          const res = await fetch(`/api/ordenes/duplicar/${id}`);
          if (res.ok) {
              localStorage.setItem('borrador_comision', JSON.stringify(await res.json()));
              Swal.fire({ title: '¡Copiado!', icon: 'success', timer: 2000, showConfirmButton: false }).then(() => navigate('/crear'));
          }
      } catch (error) { Swal.fire('Error', 'No se pudo copiar.', 'error'); }
  };

  const ejecutarEliminacion = async () => {
      if (ordenAEliminar) {
          try {
              const res = await fetch(`/api/ordenes/${ordenAEliminar.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario_modificador: nombreUsuario }) });
              if (res.ok) { setOrdenes(ordenes.filter(o => o.id !== ordenAEliminar.id)); setOrdenAEliminar(null); }
          } catch (error) { Swal.fire('Error', 'Fallo.', 'error'); }
      }
  };

  const handleReasignar = async (orden) => {
      const opciones = {};
      usuariosCatalogo.forEach(u => { opciones[u.nombre] = u.nombre; });
      opciones['Sistema'] = 'Dejar sin asignar (Sistema)';

      const { value: nuevoUsuario } = await Swal.fire({
          title: 'Reasignar Propiedad',
          html: `Selecciona a quién le pertenece el folio <b>${String(orden.numero_folio).padStart(3, '0')}</b>`,
          input: 'select',
          inputOptions: opciones,
          inputPlaceholder: 'Selecciona la secretaria...',
          showCancelButton: true,
          confirmButtonText: 'Transferir',
          cancelButtonText: 'Cancelar',
          inputValue: orden.usuario_modificador || 'Sistema'
      });

      if (nuevoUsuario && nuevoUsuario !== (orden.usuario_modificador || 'Sistema')) {
          const nombreAEnviar = nuevoUsuario === 'Sistema' ? null : nuevoUsuario;
          try {
              const res = await fetch(`/api/ordenes/${orden.id}/reasignar`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nuevo_usuario: nombreAEnviar, admin_usuario: nombreUsuario })
              });
              if (res.ok) {
                  const actualizada = await res.json();
                  setOrdenes(ordenes.map(o => o.id === orden.id ? actualizada : o));
                  Swal.fire({title: '¡Transferido!', icon: 'success', timer: 1500, showConfirmButton: false});
              } else Swal.fire('Error', 'No se pudo reasignar.', 'error');
          } catch (e) { Swal.fire('Error', 'Fallo de red.', 'error'); }
      }
  };

  // 🔥 NUEVA FUNCIÓN: RENUMERAR FOLIO (SOLO ADMIN)
  const handleRenumerar = async (orden) => {
      const { value: formValues } = await Swal.fire({
          title: 'Ajustar Folio Oficial',
          html:
            `<div style="text-align: left; padding: 10px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 11px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 5px;">Número de Folio</label>
                    <input id="swal-input1" class="swal2-input" style="width: 80%; margin: 0;" type="number" value="${orden.numero_folio || orden.id}">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 5px;">Año</label>
                    <input id="swal-input2" class="swal2-input" style="width: 80%; margin: 0;" type="number" value="${orden.anio_folio || 2026}">
                </div>
            </div>`,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Actualizar Folio',
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            return [
              document.getElementById('swal-input1').value,
              document.getElementById('swal-input2').value
            ]
          }
      });

      if (formValues) {
          const [nuevoNumero, nuevoAnio] = formValues;
          try {
              const res = await fetch(`/api/ordenes/${orden.id}/folio`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      nuevo_numero: parseInt(nuevoNumero, 10), 
                      nuevo_anio: parseInt(nuevoAnio, 10), 
                      admin_usuario: nombreUsuario 
                  })
              });
              if (res.ok) {
                  const actualizada = await res.json();
                  setOrdenes(ordenes.map(o => o.id === orden.id ? actualizada : o));
                  Swal.fire({title: '¡Folio Actualizado!', icon: 'success', timer: 1500, showConfirmButton: false});
              } else Swal.fire('Error', 'No se pudo actualizar.', 'error');
          } catch (e) { Swal.fire('Error', 'Fallo de red.', 'error'); }
      }
  };

  const handleCambiarEstatus = async (orden) => {
      const nuevoEstatus = (orden.estatus === 'Concluido') ? 'En Proceso' : 'Concluido';
      const accionTexto = nuevoEstatus === 'Concluido' ? 'concluir y bloquear' : 'reabrir';

      const { isConfirmed } = await Swal.fire({
          title: `¿${accionTexto.charAt(0).toUpperCase() + accionTexto.slice(1)} este oficio?`,
          text: nuevoEstatus === 'Concluido' 
                ? 'Una vez concluido, ya no podrás editarlo. Solo el Administrador podrá reabrirlo.' 
                : 'El oficio volverá a estar disponible para ser editado.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: nuevoEstatus === 'Concluido' ? '#10b981' : '#f59e0b',
          confirmButtonText: `Sí, ${accionTexto}`,
          cancelButtonText: 'Cancelar'
      });

      if (isConfirmed) {
          try {
              const res = await fetch(`/api/ordenes/${orden.id}/estatus`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ estatus: nuevoEstatus, usuario: nombreUsuario })
              });
              if (res.ok) {
                  const actualizada = await res.json();
                  setOrdenes(ordenes.map(o => o.id === orden.id ? actualizada : o));
                  Swal.fire({title: '¡Listo!', text: `El oficio ahora está ${nuevoEstatus}.`, icon: 'success', timer: 1500, showConfirmButton: false});
              }
          } catch (error) { Swal.fire('Error', 'Fallo de conexión.', 'error'); }
      }
  };

  const formatearPeriodo = (orden) => {
      if (orden.es_fechas_multiples) return orden.periodo_texto || 'Varias Fechas';
      if (!orden.fecha_inicio) return '-';
      const fInicio = new Date(orden.fecha_inicio).toLocaleDateString('es-MX', {day:'2-digit', month:'2-digit', year:'2-digit'});
      if (!orden.fecha_fin) return fInicio;
      const fFin = new Date(orden.fecha_fin).toLocaleDateString('es-MX', {day:'2-digit', month:'2-digit', year:'2-digit'});
      return fInicio === fFin ? fInicio : `${fInicio} → ${fFin}`;
  };

  const irAVerOEditar = (ruta, id) => {
      sessionStorage.setItem('ultimoOficioVisto', id);
      navigate(ruta);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">Gestión de Oficios</h1>
            <p className="text-gray-500 font-bold text-sm">Control y seguimiento {esAdministrador ? '(Modo Admin)' : `(${nombreUsuario})`}</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded text-indigo-700"><Hash size={20} /></div>
              <div>
                  <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Siguiente Folio</p>
                  <p className="text-lg font-black text-indigo-900 leading-none">{siguienteFolioString}/CESMECA/{anioActivo}</p>
              </div>
          </div>
          <button onClick={() => navigate('/crear')} className="flex items-center justify-center gap-2 w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-black shadow-lg transition-all active:scale-95">
            <Plus size={20} /> Nueva Comisión
          </button>
        </div>

        {aniosDisponibles.length > 0 && (
            <div className="flex gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap pt-2 pl-4 custom-scrollbar">
                {aniosDisponibles.map(anio => (
                    <button key={anio} onClick={() => setAnioActivo(anio)} className={`inline-block px-8 py-3 rounded-t-xl font-black text-sm transition-all border border-b-0 -mb-[1px] relative z-10 ${anioActivo === anio ? 'bg-white text-blue-900 border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'bg-gray-200 text-gray-500 border-transparent hover:bg-gray-300 shadow-inner'}`}>
                        Año {anio}
                    </button>
                ))}
            </div>
        )}

        <div className="bg-white rounded-xl rounded-tl-none shadow-xl border border-gray-200 overflow-hidden relative z-0">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="relative w-full sm:w-1/2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder={esAdministrador ? `Buscar en todo el archivo ${anioActivo}...` : `Buscar en tus oficios de ${anioActivo}...`} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                </div>
                <div className="text-sm font-bold text-gray-500">Total visibles: {ordenesFiltradas.length} comisiones</div>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                    <tr className="bg-white border-b border-gray-200 text-[10px] uppercase font-black text-gray-500 tracking-widest text-center">
                    <th className="px-3 py-4 md:px-5">Nº Oficio</th>
                    <th className="px-3 py-4 md:px-5 text-left">Comisionado</th>
                    <th className="px-3 py-4 md:px-5 text-left">Destino</th>
                    <th className="px-3 py-4 md:px-5 text-right">Importe</th>
                    <th className="px-3 py-4 md:px-5 text-center">Estatus</th>
                    <th className="px-3 py-4 md:px-5">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-center">
                    {ordenesPaginadas.map((orden) => {
                        const estaBloqueado = orden.estatus === 'Concluido' && !esAdministrador;
                        return (
                            <tr key={orden.id} id={`oficio-fila-${orden.id}`} className={`transition-colors duration-300 ${filaResaltada === orden.id ? 'fila-parpadeo' : 'hover:bg-blue-50/50'}`}>
                                {/* 🔥 CELDA RENUMERAR: CLICABLE SOLO PARA ADMIN */}
                                <td 
                                  className={`px-3 py-4 md:px-5 font-bold text-blue-900 text-xs md:text-sm whitespace-nowrap ${esAdministrador ? 'cursor-pointer hover:text-blue-600 hover:underline bg-blue-50/30' : ''}`}
                                  onClick={() => esAdministrador && handleRenumerar(orden)}
                                  title={esAdministrador ? "Clic para cambiar número de folio o año" : ""}
                                >
                                {String(orden.numero_folio || orden.id).padStart(3, '0')}/CESMECA/{orden.anio_folio || 2026}
                                </td>
                                
                                <td className="px-3 py-4 md:px-5 text-left">
                                    <div className="font-black text-gray-800 text-xs md:text-sm">{orden.comisionado}</div>
                                    <div className="text-[10px] text-gray-500 mt-1">{formatearPeriodo(orden)}</div>
                                    {esAdministrador && (
                                        <div 
                                        onClick={() => handleReasignar(orden)}
                                        className="text-[10px] text-indigo-500 font-bold mt-1 flex items-center gap-1 cursor-pointer hover:text-indigo-700 hover:bg-indigo-50 px-1 py-0.5 rounded transition-all inline-flex border border-transparent hover:border-indigo-200"
                                        title="Clic para transferir este oficio"
                                        >
                                            <Shield size={12} /> Resp: {orden.usuario_modificador || 'Sistema'}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-4 md:px-5 text-gray-600 text-xs md:text-sm font-medium text-left">{orden.lugar}</td>
                                <td className="px-3 py-4 md:px-5 text-xs md:text-sm font-bold text-emerald-700 text-right whitespace-nowrap">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(orden.importe_total || 0)}</td>
                                <td className="px-3 py-4 md:px-5 text-center whitespace-nowrap">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${orden.estatus === 'Concluido' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {orden.estatus === 'Concluido' ? 'Concluido' : 'En Proceso'}
                                    </span>
                                </td>
                                <td className="px-3 py-4 md:px-5">
                                <div className="flex justify-center items-center gap-2">
                                    <button onClick={() => irAVerOEditar(`/orden/${orden.id}`, orden.id)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-md transition-colors" title="Ver y Generar PDF"><FileText size={18} /></button>
                                    <button onClick={() => handleDuplicar(orden.id)} className="text-gray-500 hover:bg-gray-200 p-1.5 rounded-md transition-colors" title="Duplicar"><Copy size={18} /></button>
                                    {!estaBloqueado && (
                                        <button onClick={() => irAVerOEditar(`/editar/${orden.id}`, orden.id)} className="text-orange-500 hover:bg-orange-100 p-1.5 rounded-md transition-colors" title="Editar"><Edit size={18} /></button>
                                    )}
                                    {(!estaBloqueado || esAdministrador) && (
                                        <button 
                                            onClick={() => handleCambiarEstatus(orden)} 
                                            className={`p-1.5 rounded-md transition-colors ${orden.estatus === 'Concluido' ? 'text-amber-500 hover:bg-amber-100' : 'text-emerald-600 hover:bg-emerald-100'}`} 
                                            title={orden.estatus === 'Concluido' ? 'Reabrir oficio (Solo Admin)' : 'Marcar como Concluido (Bloquear)'}
                                        >
                                            {orden.estatus === 'Concluido' ? <Unlock size={18} /> : <CheckCircle size={18} />}
                                        </button>
                                    )}
                                    {esAdministrador && ( <button onClick={() => setOrdenAEliminar(orden)} className="text-red-500 hover:bg-red-100 p-1.5 rounded-md transition-colors" title="Eliminar"><Trash2 size={18} /></button> )}
                                </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                </table>
            </div>
            {totalPaginas > 1 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm text-gray-600 font-medium">Mostrando <span className="font-bold text-blue-900">{indicePrimerElemento + 1}</span> a <span className="font-bold text-blue-900">{Math.min(indiceUltimoElemento, ordenesFiltradas.length)}</span> de <span className="font-bold text-blue-900">{ordenesFiltradas.length}</span> resultados</span>
                    <div className="flex gap-2">
                        <button onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1} className={`px-3 py-1.5 rounded border font-bold text-sm flex items-center gap-1 transition-colors ${paginaActual === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-900 hover:bg-blue-50 hover:border-blue-300 shadow-sm'}`}><ChevronLeft size={16} /> Anterior</button>
                        <div className="hidden sm:flex items-center px-4 font-bold text-sm text-gray-500">Página {paginaActual} de {totalPaginas}</div>
                        <button onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaActual === totalPaginas} className={`px-3 py-1.5 rounded border font-bold text-sm flex items-center gap-1 transition-colors ${paginaActual === totalPaginas ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-900 hover:bg-blue-50 hover:border-blue-300 shadow-sm'}`}>Siguiente <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}
        </div>
      </div>
      {ordenAEliminar && esAdministrador && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="text-red-600" size={32} /></div>
              <h3 className="text-xl font-black text-gray-800">¿Eliminar Oficio?</h3>
              <p className="text-gray-500 font-medium text-sm">Eliminar la orden de <span className="font-bold text-gray-900">{ordenAEliminar.comisionado}</span>. No se puede deshacer.</p>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setOrdenAEliminar(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors">Cancelar</button>
                <button onClick={ejecutarEliminacion} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-lg transition-colors flex justify-center items-center gap-2"><Trash2 size={20} /> Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { height: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; } .fila-parpadeo { animation: flashAlerta 3s ease-out forwards; } @keyframes flashAlerta { 0% { background-color: #fef08a; transform: scale(1.01); box-shadow: inset 0 0 10px rgba(0,0,0,0.1); z-index: 10; position: relative; } 10% { background-color: #fde047; transform: scale(1.01); } 100% { background-color: transparent; transform: scale(1); } }`}</style>
    </div>
  );
};
export default ComisionesTable;
