import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Briefcase, UserCheck, Globe, Calendar, Car, Bus, Plane, Plus, Trash2, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

const CrearComision = () => {
  const navigate = useNavigate();

  // --- 1. CATÁLOGOS ---
  const CLAVES_PROGRAMATICAS = [
    { label: "PYI001 - Dirección y Gestión", valor: "4008000 (0121) 2.06.PRDI101.PYI001" },
    { label: "PYI029 - Investigación A", valor: "4008000 (0121) 2.06.PRDI1029.PYI029" },
    { label: "PYI034 - Investigación B", valor: "4008000 (0121) 2.06.PRDI1034.PYI034" },
    { label: "PYI002 - Docencia", valor: "4008000 (0121) 2.06.PRDI202.PYI002" },
    { label: "PYI006 - Difusión Cultural", valor: "4008000 (0121) 2.06.PRDI506.PYI006" },
    { label: "PYI014 - Vinculación", valor: "4008000 (0121) 2.06.PRDI614.PYI014" }
  ];

  const CATALOGO_PERSONAL = [
    { nombre: "Roberto Carlos Hoover Silvano", rfc: "HOSR760103LR7", categoria: "Técnico Académico", adscripcion: "CESMECA" },
    { nombre: "Mtra. Yesenia", rfc: "YES123456ABC", categoria: "Investigador Titular A", adscripcion: "CESMECA" },
    { nombre: "Dr. Emanuel Nájera de León", rfc: "NAJE800101XYZ", categoria: "Director de Centro", adscripcion: "Dirección CESMECA" },
    { nombre: "Lic. Roberto Rico", rfc: "RIC654321000", categoria: "Administrativo", adscripcion: "Secretaría Administrativa" },
    { nombre: "C.P. Paty Ballinas", rfc: "PAT987654000", categoria: "Contador", adscripcion: "Financieros" },
    { nombre: "Mtra. Gabriela Castillejos", rfc: "GAB123456000", categoria: "Investigador Asociado", adscripcion: "CESMECA" }
  ];
  
  const [uiTransporte, setUiTransporte] = useState('Vehículo');
  
  // ESTADO PARA CLAVES MÚLTIPLES
  const [clavesSeleccionadas, setClavesSeleccionadas] = useState([]);
  const [claveTemporal, setClaveTemporal] = useState(""); 

  const [formData, setFormData] = useState({
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    tipo_comision: 'Nacional', 
    comisionado: '', rfc: '', categoria: '', adscripcion: '',
    lugar: '', motivo: '', fecha_inicio: '', fecha_fin: '',
    hora_salida: '', hora_regreso: '', // <--- CAMPOS DE HORA
    medio_transporte: 'Terrestre', 
    vehiculo_marca: '', vehiculo_modelo: '', vehiculo_placas: '',
    cuota_diaria: 0, 
    importe_combustible: 0, importe_otros: 0, importe_pasajes_aereos: 0,    
    importe_pasajes: 0, importe_congresos: 0, importe_viaticos: 0,          
    importe_total: 0, estatus: 'Borrador'
  });

  // SUMA AUTOMÁTICA
  useEffect(() => {
    const total = (parseFloat(formData.importe_combustible) || 0) + 
                  (parseFloat(formData.importe_otros) || 0) + 
                  (parseFloat(formData.importe_pasajes_aereos) || 0) + 
                  (parseFloat(formData.importe_pasajes) || 0) + 
                  (parseFloat(formData.importe_congresos) || 0) + 
                  (parseFloat(formData.importe_viaticos) || 0);
    
    setFormData(prev => ({ ...prev, importe_total: total }));
  }, [formData.importe_combustible, formData.importe_otros, formData.importe_pasajes_aereos, formData.importe_pasajes, formData.importe_congresos, formData.importe_viaticos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Lógica Claves
  const agregarClave = () => {
    if (!claveTemporal) return;
    if (!clavesSeleccionadas.includes(claveTemporal)) {
        setClavesSeleccionadas([...clavesSeleccionadas, claveTemporal]);
        setClaveTemporal(""); 
    }
  };
  const eliminarClave = (claveAEliminar) => {
    setClavesSeleccionadas(clavesSeleccionadas.filter(c => c !== claveAEliminar));
  };

  const handleTransporteUIChange = (e) => {
    const seleccion = e.target.value;
    setUiTransporte(seleccion);
    let nuevosDatos = { ...formData };
    if (seleccion === 'Vehículo') { nuevosDatos.medio_transporte = 'Terrestre'; } 
    else if (seleccion === 'Autobús') { nuevosDatos.medio_transporte = 'Terrestre'; nuevosDatos.vehiculo_marca = ''; nuevosDatos.vehiculo_modelo = ''; nuevosDatos.vehiculo_placas = ''; } 
    else if (seleccion === 'Aéreo') { nuevosDatos.medio_transporte = 'Aéreo'; nuevosDatos.vehiculo_marca = ''; nuevosDatos.vehiculo_modelo = ''; nuevosDatos.vehiculo_placas = ''; }
    setFormData(nuevosDatos);
  };

  const handleComisionadoChange = (e) => {
    const valor = e.target.value;
    let nuevosDatos = { ...formData, comisionado: valor };
    const personalEncontrado = CATALOGO_PERSONAL.find(p => p.nombre === valor);
    if (personalEncontrado) {
        nuevosDatos.rfc = personalEncontrado.rfc;
        nuevosDatos.categoria = personalEncontrado.categoria;
        nuevosDatos.adscripcion = personalEncontrado.adscripcion;
        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        Toast.fire({ icon: 'success', title: 'Datos cargados' });
    }
    setFormData(nuevosDatos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (clavesSeleccionadas.length === 0) {
      Swal.fire('Atención', 'Debes agregar al menos una Clave Programática', 'warning');
      return;
    }
    const clavesFinales = clavesSeleccionadas.join(', ');
    const dataToSend = { ...formData, clave_programatica: clavesFinales };

    try {
      const response = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      if (response.ok) {
        Swal.fire({ title: '¡Guardado!', text: 'Comisión registrada correctamente', icon: 'success', confirmButtonColor: '#1e3a8a' }).then(() => navigate('/'));
      } else {
        const errorData = await response.json();
        Swal.fire('Error', errorData.error || 'Error al guardar', 'error');
      }
    } catch (error) { console.error(error); Swal.fire('Error', 'Fallo de conexión', 'error'); }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
       <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow border border-gray-200">
         <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-blue-900">Nueva Orden de Comisión</h2>
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 flex items-center gap-1"><ArrowLeft size={18}/> Volver</button>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100 flex items-center gap-4">
                    <Globe className="text-indigo-600" size={24} />
                    <div className="w-full">
                        <label className="block text-xs font-bold text-indigo-800 mb-1">TIPO DE COMISIÓN</label>
                        <select name="tipo_comision" value={formData.tipo_comision} onChange={handleChange} className="w-full p-2 border rounded font-bold text-indigo-900 bg-white">
                            <option value="Nacional">NACIONAL / ESTATAL (2 Firmas)</option>
                            <option value="Internacional">INTERNACIONAL (4 Firmas)</option>
                        </select>
                    </div>
                </div>
                <div className="bg-gray-100 p-4 rounded-md border border-gray-200 flex items-center gap-4">
                    <Calendar className="text-gray-600" size={24} />
                    <div className="w-full">
                        <label className="block text-xs font-bold text-gray-700 mb-1">FECHA DE ELABORACIÓN</label>
                        <input type="date" name="fecha_elaboracion" value={formData.fecha_elaboracion} onChange={handleChange} className="w-full p-2 border rounded font-bold text-gray-800" />
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="text-sm font-bold text-blue-800 uppercase mb-3 flex items-center gap-2"><UserCheck size={18}/> 1. Datos del Comisionado</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
                        <input list="personal-list" name="comisionado" value={formData.comisionado} onChange={handleComisionadoChange} className="w-full p-2 border rounded border-blue-300 bg-white" placeholder="Buscar..." autoComplete="off" required />
                        <datalist id="personal-list">{CATALOGO_PERSONAL.map((p, i) => (<option key={i} value={p.nombre} />))}</datalist>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">R.F.C.</label><input name="rfc" value={formData.rfc} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label><input name="categoria" value={formData.categoria} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Adscripción</label><input name="adscripcion" value={formData.adscripcion} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-800 uppercase mb-3">2. Datos del Viaje</h3>
                    <div className="space-y-3">
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Lugar</label><input name="lugar" value={formData.lugar} onChange={handleChange} className="w-full p-2 border rounded" required /></div>
                        
                        {/* FECHAS Y HORAS JUNTAS */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Salida</label>
                                <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><Clock size={12}/> Hora Salida</label>
                                <input type="time" name="hora_salida" value={formData.hora_salida} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Regreso</label>
                                <input type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleChange} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><Clock size={12}/> Hora Regreso</label>
                                <input type="time" name="hora_regreso" value={formData.hora_regreso} onChange={handleChange} className="w-full p-2 border rounded" />
                            </div>
                        </div>

                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Motivo</label><textarea name="motivo" value={formData.motivo} onChange={handleChange} className="w-full p-2 border rounded h-16" required /></div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 flex items-center gap-2">
                       {uiTransporte === 'Aéreo' ? <Plane size={18}/> : uiTransporte === 'Autobús' ? <Bus size={18}/> : <Car size={18}/>} 
                       3. Transporte
                    </h3>
                    <div className="space-y-3">
                         <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Medio de Transporte</label>
                            <select value={uiTransporte} onChange={handleTransporteUIChange} className="w-full p-2 border rounded font-bold text-gray-800 bg-white">
                                <option value="Vehículo">Terrestre - Vehículo Oficial / Particular</option>
                                <option value="Autobús">Terrestre - Autobús / Pasaje</option>
                                <option value="Aéreo">Aéreo</option>
                            </select>
                        </div>
                        {uiTransporte === 'Vehículo' ? (
                            <div className="grid grid-cols-3 gap-2 animate-fadeIn bg-white p-3 rounded border border-gray-200">
                                <div><label className="block text-xs font-bold text-gray-700 mb-1">Marca</label><input name="vehiculo_marca" value={formData.vehiculo_marca} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Ej. Nissan" /></div>
                                <div><label className="block text-xs font-bold text-gray-700 mb-1">Modelo</label><input name="vehiculo_modelo" value={formData.vehiculo_modelo} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Ej. Versa" /></div>
                                <div><label className="block text-xs font-bold text-gray-700 mb-1">Placas</label><input name="vehiculo_placas" value={formData.vehiculo_placas} onChange={handleChange} className="w-full p-2 border rounded" placeholder="XXX-000" /></div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-100 rounded text-center text-gray-500 text-xs italic border border-gray-200">
                                {uiTransporte === 'Aéreo' ? 'Transporte Aéreo. No requiere datos de vehículo.' : 'Transporte por Autobús. No requiere datos de vehículo.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. CLAVE PROGRAMÁTICA */}
            <div className="bg-orange-50 p-6 rounded-md border border-orange-200">
                <h3 className="text-sm font-bold text-orange-900 uppercase mb-4 flex items-center gap-2"><Briefcase size={18}/> 4. Clave Programática y Presupuestal</h3>
                <div className="mb-4">
                    <label className="block text-xs font-bold text-orange-800 mb-1">Agregar Clave Programática</label>
                    <div className="flex gap-2">
                        <select value={claveTemporal} onChange={(e) => setClaveTemporal(e.target.value)} className="w-full p-3 border border-orange-300 rounded bg-white text-gray-700 font-medium">
                            <option value="">-- Seleccione para agregar --</option>
                            {CLAVES_PROGRAMATICAS.map((clave, index) => (<option key={index} value={clave.valor}>{clave.label} ({clave.valor})</option>))}
                        </select>
                        <button type="button" onClick={agregarClave} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded shadow flex items-center gap-1 font-bold"><Plus size={20}/> Agregar</button>
                    </div>
                </div>
                {clavesSeleccionadas.length > 0 && (
                    <div className="mb-6 bg-white border border-orange-200 rounded p-3 shadow-inner">
                        <p className="text-xs font-bold text-gray-500 mb-2">CLAVES ASIGNADAS:</p>
                        <ul className="space-y-2">
                            {clavesSeleccionadas.map((clave, idx) => (
                                <li key={idx} className="flex justify-between items-center bg-orange-50 p-2 rounded border border-orange-100">
                                    <span className="text-sm font-medium text-gray-700">{clave}</span>
                                    <button type="button" onClick={() => eliminarClave(clave)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">26111 - Combustible</label><input type="number" step="0.01" name="importe_combustible" value={formData.importe_combustible} onChange={handleChange} className="w-full pl-6 p-2 border rounded" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">37211 - Pasajes Terrestres</label><input type="number" step="0.01" name="importe_pasajes" value={formData.importe_pasajes} onChange={handleChange} className="w-full pl-6 p-2 border rounded" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">37511 - Viáticos Nacionales</label><input type="number" step="0.01" name="importe_viaticos" value={formData.importe_viaticos} onChange={handleChange} className="w-full pl-6 p-2 border rounded" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">37111 - Pasajes Aéreos</label><input type="number" step="0.01" name="importe_pasajes_aereos" value={formData.importe_pasajes_aereos} onChange={handleChange} className="w-full pl-6 p-2 border rounded bg-white" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">38301 - Congresos y Conv.</label><input type="number" step="0.01" name="importe_congresos" value={formData.importe_congresos} onChange={handleChange} className="w-full pl-6 p-2 border rounded bg-white" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">39202 - Otros Impuestos</label><input type="number" step="0.01" name="importe_otros" value={formData.importe_otros} onChange={handleChange} className="w-full pl-6 p-2 border rounded" /></div>
                </div>
                <div className="mt-6 p-4 bg-orange-100 rounded border border-orange-300 flex justify-between items-center">
                    <span className="font-bold text-orange-900 text-lg">TOTAL AUTORIZADO:</span>
                    <span className="font-black text-2xl text-blue-900">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(formData.importe_total)}</span>
                </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
              <button type="button" onClick={() => navigate('/')} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="px-8 py-3 bg-blue-900 text-white rounded hover:bg-blue-800 flex items-center gap-2 font-bold shadow-lg transition-transform active:scale-95"><Save size={20}/> Guardar Orden</button>
            </div>
         </form>
       </div>
    </div>
  );
};

export default CrearComision;
