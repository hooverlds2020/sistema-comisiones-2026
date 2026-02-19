import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calculator } from 'lucide-react';

const CreateComision = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    comisionado: '', rfc: '', categoria: '', adscripcion: '',
    lugar: '', motivo: '',
    fecha_inicio: '', fecha_fin: '', hora_salida: '', hora_regreso: '',
    medio_transporte: 'Terrestre', vehiculo_marca: '', vehiculo_modelo: '', vehiculo_placas: '',
    clave_programatica: '', cuota_diaria: 0,
    importe_combustible: 0, importe_pasajes: 0, importe_viaticos: 0, importe_otros: 0,
    importe_total: 0, estatus: 'Borrador'
  });

  // Cálculo automático del total cuando cambian los montos
  useEffect(() => {
    const total = parseFloat(formData.importe_combustible || 0) + 
                  parseFloat(formData.importe_pasajes || 0) + 
                  parseFloat(formData.importe_viaticos || 0) + 
                  parseFloat(formData.importe_otros || 0);
    setFormData(prev => ({ ...prev, importe_total: total }));
  }, [formData.importe_combustible, formData.importe_pasajes, formData.importe_viaticos, formData.importe_otros]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) navigate('/');
      else alert('Error al guardar');
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold uppercase">Nueva Orden de Comisión</h2>
            <p className="text-blue-200 text-sm">Formato Único de Comisión (Anexo V)</p>
          </div>
          <button onClick={() => navigate('/')} className="text-white hover:bg-blue-800 p-2 rounded"><ArrowLeft /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">

          {/* SECCIÓN 1: DATOS DEL COMISIONADO */}
          <div>
            <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">I. Datos del Comisionado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1">Nombre Completo</label>
                <input required type="text" name="comisionado" value={formData.comisionado} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">R.F.C.</label>
                <input type="text" name="rfc" value={formData.rfc} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
               <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Categoría</label>
                <input type="text" name="categoria" value={formData.categoria} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1">Adscripción (Departamento)</label>
                <input type="text" name="adscripcion" value={formData.adscripcion} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS DE LA COMISIÓN */}
          <div>
            <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">II. Datos de la Comisión</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-600 mb-1">Lugar de Comisión</label>
                <input required type="text" name="lugar" value={formData.lugar} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
               <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-600 mb-1">Motivo de la Comisión</label>
                <textarea name="motivo" rows="2" value={formData.motivo} onChange={handleChange} className="w-full border p-2 rounded"></textarea>
              </div>

              {/* Fechas y Horas */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Fecha Inicio</label>
                <input required type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Fecha Fin</label>
                <input required type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleChange} className="w-full border p-2 rounded" />
              </div>
               <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Hora Salida</label>
                    <input type="time" name="hora_salida" value={formData.hora_salida} onChange={handleChange} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Hora Regreso</label>
                    <input type="time" name="hora_regreso" value={formData.hora_regreso} onChange={handleChange} className="w-full border p-2 rounded" />
                  </div>
               </div>
            </div>
          </div>

          {/* SECCIÓN 3: TRANSPORTE */}
          <div>
            <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">III. Medio de Transporte</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Tipo</label>
                <select name="medio_transporte" value={formData.medio_transporte} onChange={handleChange} className="w-full border p-2 rounded bg-white">
                  <option value="Terrestre">Terrestre</option>
                  <option value="Aéreo">Aéreo</option>
                </select>
              </div>
              {formData.medio_transporte === 'Terrestre' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Marca</label>
                    <input type="text" name="vehiculo_marca" placeholder="Ej. Nissan" value={formData.vehiculo_marca} onChange={handleChange} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Modelo</label>
                    <input type="text" name="vehiculo_modelo" placeholder="Ej. Versa" value={formData.vehiculo_modelo} onChange={handleChange} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Placas</label>
                    <input type="text" name="vehiculo_placas" placeholder="XXX-000" value={formData.vehiculo_placas} onChange={handleChange} className="w-full border p-2 rounded" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECCIÓN 4: DESGLOSE FINANCIERO */}
          <div>
            <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">IV. Gastos a Comprobar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
               <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Clave Programática</label>
                  <input type="text" name="clave_programatica" value={formData.clave_programatica} onChange={handleChange} className="w-full border p-2 rounded" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Cuota Diaria ($)</label>
                  <input type="number" name="cuota_diaria" value={formData.cuota_diaria} onChange={handleChange} className="w-full border p-2 rounded text-right" />
               </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 bg-blue-50 p-4 rounded border border-blue-100">
               <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Combustible</label>
                  <input type="number" name="importe_combustible" value={formData.importe_combustible} onChange={handleChange} className="w-full border p-2 rounded text-right font-bold text-gray-700" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Pasajes/Peajes</label>
                  <input type="number" name="importe_pasajes" value={formData.importe_pasajes} onChange={handleChange} className="w-full border p-2 rounded text-right font-bold text-gray-700" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Viáticos</label>
                  <input type="number" name="importe_viaticos" value={formData.importe_viaticos} onChange={handleChange} className="w-full border p-2 rounded text-right font-bold text-gray-700" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Otros</label>
                  <input type="number" name="importe_otros" value={formData.importe_otros} onChange={handleChange} className="w-full border p-2 rounded text-right font-bold text-gray-700" />
               </div>
               <div className="flex flex-col justify-end">
                  <label className="block text-xs font-bold text-blue-900 mb-1 text-right">TOTAL AUTORIZADO</label>
                  <div className="bg-blue-800 text-white p-2 rounded text-right font-bold text-lg">
                    $ {formData.importe_total.toFixed(2)}
                  </div>
               </div>
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => navigate('/')} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-2 rounded shadow flex items-center gap-2 font-bold disabled:opacity-50">
              <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Comisión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateComision;
