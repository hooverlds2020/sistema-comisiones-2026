import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Briefcase, UserCheck, Globe, Calendar, Car, Bus, Plane, Plus, Trash2, Calculator, X, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

const CrearComision = () => {
  const navigate = useNavigate();

  const [catalogoPersonal, setCatalogoPersonal] = useState([]);
  const [catalogoVehiculos, setCatalogoVehiculos] = useState([]);
  const [catalogoClaves, setCatalogoClaves] = useState([]);

  const [uiTransporte, setUiTransporte] = useState('Vehículo');
  const [clavesSeleccionadas, setClavesSeleccionadas] = useState([]);
  const [claveTemporal, setClaveTemporal] = useState("");

  const [showDropdown, setShowDropdown] = useState(false);
  const [showModalCuota, setShowModalCuota] = useState(false);
  const [calcDias, setCalcDias] = useState("");
  const [calcMonto, setCalcMonto] = useState("");
  const [calcMedios, setCalcMedios] = useState("");
  const [calcMontoMedio, setCalcMontoMedio] = useState("");

  // 1. CARGA INTELIGENTE DESDE EL DISCO DURO (AUTOGUARDADO)
  const [formData, setFormData] = useState(() => {
    const borradorGuardado = localStorage.getItem('borrador_comision');
    if (borradorGuardado) {
      const parsedBorrador = JSON.parse(borradorGuardado);
      // Recuperar las claves seleccionadas del borrador
      if (parsedBorrador.clave_programatica) {
          setClavesSeleccionadas(parsedBorrador.clave_programatica.split(', ').filter(c => c));
      }
      return parsedBorrador;
    }
    // Si no hay borrador, cargamos los valores por defecto
    return {
      fecha_elaboracion: new Date().toISOString().split('T')[0],
      tipo_comision: 'Nacional', 
      comisionado: '', rfc: '', categoria: '', adscripcion: '',
      lugar: '', motivo: '', fecha_inicio: '', fecha_fin: '',
      hora_salida: '', hora_regreso: '', 
      medio_transporte: 'Terrestre', 
      vehiculo_marca: '', vehiculo_modelo: '', vehiculo_placas: '',
      cuota_diaria: '', 
      importe_combustible: 0, importe_otros: 0, importe_pasajes_aereos: 0,    
      importe_pasajes: 0, importe_congresos: 0, importe_viaticos: 0,          
      importe_total: 0, estatus: 'Borrador'
    };
  });

  // 2. GUARDAR EN EL DISCO DURO CADA VEZ QUE EL USUARIO ESCRIBE ALGO
  useEffect(() => {
    const datosARespaldar = { ...formData, clave_programatica: clavesSeleccionadas.join(', ') };
    localStorage.setItem('borrador_comision', JSON.stringify(datosARespaldar));
  }, [formData, clavesSeleccionadas]);

  // Protección contra caídas de internet en los catálogos
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [resPersonal, resVehiculos, resClaves] = await Promise.all([
          fetch('/api/personal').catch(() => null),
          fetch('/api/vehiculos').catch(() => null),
          fetch('/api/claves-programaticas').catch(() => null)
        ]);

        if (!resPersonal || !resVehiculos || !resClaves || !resPersonal.ok || !resVehiculos.ok || !resClaves.ok) {
            throw new Error("Fallo de conexión a internet");
        }

        setCatalogoPersonal(await resPersonal.json());
        setCatalogoVehiculos(await resVehiculos.json());
        setCatalogoClaves(await resClaves.json());
      } catch (error) {
        Swal.fire({
          title: 'Conexión Inestable',
          text: 'Hubo un bajón de internet y no se cargaron los catálogos. Por favor, presiona F5 para intentar de nuevo. ¡Tus datos tecleados están a salvo!',
          icon: 'warning',
          confirmButtonColor: '#1e3a8a'
        });
      }
    };
    cargarCatalogos();
  }, []);

  // Calculadora automática de totales
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

  const agregarClave = () => {
    if (!claveTemporal) return;
    if (!clavesSeleccionadas.includes(claveTemporal)) {
        setClavesSeleccionadas([...clavesSeleccionadas, claveTemporal]);
        setClaveTemporal(""); 
    }
  };

  const eliminarClave = (claveAEliminar) => { setClavesSeleccionadas(clavesSeleccionadas.filter(c => c !== claveAEliminar)); };

  const handleTransporteUIChange = (e) => {
    const seleccion = e.target.value;
    setUiTransporte(seleccion);
    let nuevosDatos = { ...formData };
    if (seleccion === 'Vehículo') { nuevosDatos.medio_transporte = 'Terrestre'; } 
    else if (seleccion === 'Autobús') { nuevosDatos.medio_transporte = 'Terrestre'; nuevosDatos.vehiculo_marca = ''; nuevosDatos.vehiculo_modelo = ''; nuevosDatos.vehiculo_placas = ''; } 
    else if (seleccion === 'Aéreo') { nuevosDatos.medio_transporte = 'Aéreo'; nuevosDatos.vehiculo_marca = ''; nuevosDatos.vehiculo_modelo = ''; nuevosDatos.vehiculo_placas = ''; }
    setFormData(nuevosDatos);
  };

  const handleVehiculoChange = (e) => {
      const index = e.target.value;
      if (index !== "") {
          const vehiculo = catalogoVehiculos[index];
          setFormData(prev => ({ ...prev, vehiculo_marca: vehiculo.marca, vehiculo_modelo: vehiculo.modelo, vehiculo_placas: vehiculo.placas }));
      }
  };

  const handleComisionadoChange = (e) => {
    const valor = e.target.value;
    let nuevosDatos = { ...formData, comisionado: valor };
    const personalEncontrado = catalogoPersonal.find(p => p.nombre.toLowerCase() === valor.toLowerCase());
    if (personalEncontrado) {
        nuevosDatos.rfc = personalEncontrado.rfc;
        nuevosDatos.categoria = personalEncontrado.categoria;
        nuevosDatos.adscripcion = personalEncontrado.adscripcion;
    }
    setFormData(nuevosDatos);
    setShowDropdown(true);
  };

  const aplicarCalculadora = () => {
      let lineas = []; let total = 0;
      if(calcDias && calcMonto) {
          const sum = parseFloat(calcDias) * parseFloat(calcMonto); total += sum;
          lineas.push(`${calcDias} x ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calcMonto)}`);
      }
      if(calcMedios && calcMontoMedio) {
           const numMedios = parseInt(calcMedios); const sum = numMedios * parseFloat(calcMontoMedio); total += sum;
           lineas.push(`${numMedios === 1 ? '½' : numMedios + ' medios'} x ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calcMontoMedio)}`);
      }
      if(lineas.length > 0) {
          const texto = lineas.join('\n') + ` = ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}`;
          setFormData({...formData, cuota_diaria: texto});
      }
      setShowModalCuota(false);
  };

  // Función para vaciar el borrador manualmente si el usuario quiere empezar de cero
  const limpiarBorrador = () => {
    Swal.fire({
      title: '¿Limpiar formulario?',
      text: "Se borrarán todos los datos que has capturado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('borrador_comision');
        window.location.reload(); // Recarga la página para tener el formulario en blanco
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (clavesSeleccionadas.length === 0) { Swal.fire('Atención', 'Agrega al menos una Clave Programática', 'warning'); return; }
    const datosFinales = { ...formData, clave_programatica: clavesSeleccionadas.join(', ') };

    try {
      const response = await fetch('/api/ordenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datosFinales) });
      if (response.ok) { 
          // 🔴 3. SI SE GUARDÓ EXITOSAMENTE, BORRAMOS EL RESPALDO LOCAL Y REDIRIGIMOS A LA TABLA PRINCIPAL
          localStorage.removeItem('borrador_comision');

          Swal.fire({ 
              title: '¡Guardado!', 
              text: 'Comisión registrada con éxito', 
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
          }).then(() => {
              // 🔴 AQUÍ ESTÁ EL AJUSTE: Ahora regresa al listado principal
              navigate('/', { replace: true }); 
          }); 
      } 
      else { Swal.fire('Error', 'Error al guardar', 'error'); }
    } catch (error) { Swal.fire('Error', 'Fallo de conexión', 'error'); }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans relative">
       {showModalCuota && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md border-t-4 border-blue-600">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2"><Calculator/> Asistente de Cuota Diaria</h3>
                        <button onClick={()=>setShowModalCuota(false)} className="text-gray-500 hover:text-red-500"><X/></button>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded border">
                            <label className="block text-xs font-bold mb-2 text-gray-700">DÍAS COMPLETOS</label>
                            <div className="flex gap-2 items-center">
                                <input type="number" placeholder="Cant. Días" value={calcDias} onChange={(e)=>setCalcDias(e.target.value)} className="w-1/3 p-2 border rounded" />
                                <span>X $</span>
                                <input type="number" placeholder="Costo x Día" value={calcMonto} onChange={(e)=>setCalcMonto(e.target.value)} className="w-2/3 p-2 border rounded" />
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded border">
                            <label className="block text-xs font-bold mb-2 text-gray-700">MEDIOS DÍAS (½)</label>
                            <div className="flex gap-2 items-center">
                                <input type="number" placeholder="Cant. Medios" value={calcMedios} onChange={(e)=>setCalcMedios(e.target.value)} className="w-1/3 p-2 border rounded" />
                                <span>X $</span>
                                <input type="number" placeholder="Costo Medio Día" value={calcMontoMedio} onChange={(e)=>setCalcMontoMedio(e.target.value)} className="w-2/3 p-2 border rounded" />
                            </div>
                        </div>
                        <button type="button" onClick={aplicarCalculadora} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">Generar Fórmula Automática</button>
                    </div>
                </div>
            </div>
        )}

       <div className="max-w-6xl mx-auto bg-white p-4 md:p-8 rounded-lg shadow border border-gray-200">
         <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="text-xl md:text-2xl font-bold text-blue-900">Nueva Orden de Comisión</h2>
            <div className="flex items-center gap-3">
              <button onClick={limpiarBorrador} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-bold bg-red-50 px-3 py-1 rounded border border-red-200">
                <RefreshCw size={14}/> Limpiar
              </button>
              <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm md:text-base"><ArrowLeft size={18}/> Volver</button>
            </div>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100 flex items-center gap-4">
                    <Globe className="text-indigo-600 flex-shrink-0" size={24} />
                    <div className="w-full">
                        <label className="block text-xs font-bold text-indigo-800 mb-1">TIPO DE COMISIÓN</label>
                        <select name="tipo_comision" value={formData.tipo_comision} onChange={handleChange} className="w-full p-2 border rounded font-bold text-indigo-900 bg-white">
                            <option value="Nacional">NACIONAL / ESTATAL</option>
                            <option value="Internacional">INTERNACIONAL</option>
                        </select>
                    </div>
                </div>
                <div className="bg-gray-100 p-4 rounded-md border border-gray-200 flex items-center gap-4">
                    <Calendar className="text-gray-600 flex-shrink-0" size={24} />
                    <div className="w-full">
                        <label className="block text-xs font-bold text-gray-700 mb-1">FECHA DE ELABORACIÓN</label>
                        <input type="date" name="fecha_elaboracion" value={formData.fecha_elaboracion} onChange={handleChange} className="w-full p-2 border rounded font-bold text-gray-800" />
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="text-sm font-bold text-blue-800 uppercase mb-3 flex items-center gap-2"><UserCheck size={18}/> 1. Datos del Comisionado</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo</label>
                        <input 
                            type="text"
                            name="comisionado" 
                            value={formData.comisionado} 
                            onChange={handleComisionadoChange} 
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            className="w-full p-2 border rounded border-blue-300 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all" 
                            placeholder="Escribe para buscar un trabajador..." 
                            autoComplete="off" 
                            required 
                        />
                        {showDropdown && (
                            <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-2xl max-h-60 overflow-y-auto">
                                {catalogoPersonal
                                    .filter(p => p.nombre.toLowerCase().includes((formData.comisionado || '').toLowerCase()))
                                    .map((p, i) => (
                                        <li 
                                            key={i} 
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev, 
                                                    comisionado: p.nombre, rfc: p.rfc, categoria: p.categoria, adscripcion: p.adscripcion
                                                }));
                                                setShowDropdown(false);
                                            }}
                                            className="p-3 cursor-pointer hover:bg-blue-100 text-sm font-bold text-gray-700 border-b border-gray-100 last:border-b-0 transition-colors"
                                        >
                                            {p.nombre}
                                        </li>
                                ))}
                                {catalogoPersonal.filter(p => p.nombre.toLowerCase().includes((formData.comisionado || '').toLowerCase())).length === 0 && (
                                    <li className="p-3 text-sm text-gray-500 italic text-center">No se encontraron resultados</li>
                                )}
                            </ul>
                        )}
                    </div>

                    <div><label className="block text-xs font-bold text-gray-700 mb-1">R.F.C.</label><input name="rfc" value={formData.rfc} onChange={handleChange} className="w-full p-2 border rounded bg-gray-50" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label><input name="categoria" value={formData.categoria} onChange={handleChange} className="w-full p-2 border rounded bg-gray-50" /></div>
                    <div className="md:col-span-4"><label className="block text-xs font-bold text-gray-700 mb-1">Adscripción</label><input name="adscripcion" value={formData.adscripcion} onChange={handleChange} className="w-full p-2 border rounded bg-gray-50" /></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-800 uppercase mb-3">2. Datos del Viaje</h3>
                    <div className="space-y-3">
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Lugar</label><input name="lugar" value={formData.lugar} onChange={handleChange} className="w-full p-2 border rounded" required /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Fecha Inicio</label><input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className="w-full p-2 border rounded" required /></div>
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Hora Salida</label><input type="time" name="hora_salida" value={formData.hora_salida} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Fecha Fin</label><input type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleChange} className="w-full p-2 border rounded" required /></div>
                            <div><label className="block text-xs font-bold text-gray-700 mb-1">Hora Regreso</label><input type="time" name="hora_regreso" value={formData.hora_regreso} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                        </div>
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Motivo</label><textarea name="motivo" value={formData.motivo} onChange={handleChange} className="w-full p-2 border rounded h-16" required /></div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 flex items-center gap-2">
                        {uiTransporte === 'Aéreo' ? <Plane size={18}/> : uiTransporte === 'Autobús' ? <Bus size={18}/> : <Car size={18}/>} 3. Transporte
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
                            <div className="space-y-2 animate-fadeIn">
                                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Vehículo Oficial CESMECA</label>
                                    <select onChange={handleVehiculoChange} className="w-full p-2 border border-blue-300 rounded bg-white text-sm">
                                        <option value="">-- Seleccionar --</option>
                                        {catalogoVehiculos.map((v, idx) => (
                                            <option key={idx} value={idx}>{v.marca} {v.modelo} ({v.placas})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded border border-gray-200">
                                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Marca</label><input name="vehiculo_marca" value={formData.vehiculo_marca} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-gray-50" /></div>
                                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Modelo</label><input name="vehiculo_modelo" value={formData.vehiculo_modelo} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-gray-50" /></div>
                                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Placas</label><input name="vehiculo_placas" value={formData.vehiculo_placas} onChange={handleChange} className="w-full p-2 border rounded text-sm bg-gray-50" /></div>
                                </div>
                            </div>
                        ) : (<div className="p-4 bg-gray-100 rounded text-center text-gray-500 text-xs italic border">No requiere datos de vehículo.</div>)}
                    </div>
                </div>
            </div>

            <div className="bg-orange-50 p-4 md:p-6 rounded-md border border-orange-200">
                <h3 className="text-sm font-bold text-orange-900 uppercase mb-4 flex items-center gap-2"><Briefcase size={18}/> 4. Finanzas y Presupuesto</h3>
                
                <div className="mb-6 bg-white p-4 rounded border border-orange-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <label className="block text-xs font-bold text-gray-800">FÓRMULA DE CUOTA DIARIA</label>
                        <button type="button" onClick={()=>setShowModalCuota(true)} className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded font-bold hover:bg-indigo-200 w-full sm:w-auto justify-center"><Calculator size={14}/> Usar Calculadora Mágica</button>
                    </div>
                    <textarea name="cuota_diaria" value={formData.cuota_diaria} onChange={handleChange} rows="2" className="w-full p-2 border rounded font-mono text-sm text-gray-700 bg-gray-50 focus:bg-white" placeholder="Ej. 7 x $1,826.00&#10;½ x $949.52 = $13,731.52"></textarea>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-bold text-orange-800 mb-1">Clave Programática</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <select value={claveTemporal} onChange={(e) => setClaveTemporal(e.target.value)} className="w-full p-3 border border-orange-300 rounded bg-white text-gray-700 font-medium">
                            <option value="">-- Seleccione para agregar --</option>
                            {catalogoClaves.map((clave, index) => (
                                <option key={index} value={clave.clave}>{clave.clave} ({clave.descripcion})</option>
                            ))}
                        </select>
                        <button type="button" onClick={agregarClave} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 sm:py-2 rounded shadow flex justify-center items-center gap-2 font-bold transition-colors w-full sm:w-auto"><Plus size={20}/> Agregar</button>
                    </div>
                </div>
                {clavesSeleccionadas.length > 0 && (
                    <div className="mb-6 bg-white border border-orange-200 rounded p-4 shadow-sm">
                        <div className="space-y-2">
                            {clavesSeleccionadas.map((clave, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-orange-50 p-2 rounded border border-orange-100 break-all gap-2">
                                    <span className="text-sm font-bold text-gray-700 leading-tight">{clave}</span>
                                    <button type="button" onClick={() => eliminarClave(clave)} className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"><Trash2 size={18}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pt-4 border-t border-orange-200">
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">26111 - Combustible</label><input type="number" step="0.01" name="importe_combustible" value={formData.importe_combustible} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">37111 - Pasajes Aéreos</label><input type="number" step="0.01" name="importe_pasajes_aereos" value={formData.importe_pasajes_aereos} onChange={handleChange} className="w-full p-2 border rounded bg-white" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">37211 - Pasajes Terrestres</label><input type="number" step="0.01" name="importe_pasajes" value={formData.importe_pasajes} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">37511 - Viáticos</label><input type="number" step="0.01" name="importe_viaticos" value={formData.importe_viaticos} onChange={handleChange} className="w-full p-2 border rounded border-blue-400 bg-blue-50 focus:bg-white" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">38301 - Congresos y Conv.</label><input type="number" step="0.01" name="importe_congresos" value={formData.importe_congresos} onChange={handleChange} className="w-full p-2 border rounded bg-white" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">39202 - Otros Impuestos</label><input type="number" step="0.01" name="importe_otros" value={formData.importe_otros} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                </div>

                <div className="mt-6 p-4 bg-orange-100 rounded border border-orange-300 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-2 sm:gap-0">
                    <span className="font-bold text-orange-900 text-lg">IMPORTE TOTAL ACORDADO:</span>
                    <span className="font-black text-2xl md:text-3xl text-blue-900">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(formData.importe_total)}</span>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4 mt-8 pt-4 border-t">
              <button type="button" onClick={() => navigate('/')} className="w-full sm:w-auto px-4 py-3 sm:py-2 border rounded hover:bg-gray-50 text-gray-700 font-bold">Cancelar</button>
              <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-900 text-white rounded hover:bg-blue-800 flex justify-center items-center gap-2 font-bold shadow-lg transition-transform active:scale-95"><Save size={20}/> Guardar Cambios</button>
            </div>
         </form>
       </div>
    </div>
  );
};

export default CrearComision;
