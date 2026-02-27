import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, Save, CheckCircle, Info } from 'lucide-react';
import Swal from 'sweetalert2';

const ConfiguracionSistema = () => {
  const [file, setFile] = useState(null);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== 'image/png') {
        Swal.fire('Formato incorrecto', 'Por favor, asegúrate de subir un archivo en formato PNG.', 'warning');
        e.target.value = null; 
        return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
        Swal.fire('Atención', 'Selecciona una imagen primero.', 'warning');
        return;
    }

    const formData = new FormData();
    // 🔴 EL ORDEN CORRECTO QUE SOLUCIONA TODO:
    formData.append('fileName', `membrete_${anio}.png`); // 1. Empacamos el nombre
    formData.append('membrete', file);                   // 2. Empacamos el archivo

    setLoading(true);
    try {
        const response = await fetch('/api/upload-membrete', {
            method: 'POST',
            body: formData, 
        });

        if (response.ok) {
            Swal.fire({
                title: '¡Actualizado!',
                text: `El membrete para el año ${anio} está listo para usarse.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            setFile(null);
            document.getElementById('file-upload').value = '';
        } else {
            Swal.fire('Error', 'Hubo un problema al subir el archivo.', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Fallo de conexión al servidor.', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">Configuración del Sistema</h1>
            <p className="text-gray-500 font-bold text-sm">Personalización y ajustes generales</p>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
            <ImageIcon className="text-blue-600" /> Membrete del PDF
          </h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r">
            <div className="flex items-start">
              <Info className="text-blue-500 mr-3 mt-0.5" size={20} />
              <p className="text-sm text-blue-800">
                Sube aquí la imagen de fondo (membrete) que se usará en los oficios de comisión. <br/>
                <span className="font-bold">Requisitos:</span> El archivo debe ser obligatoriamente formato <strong>PNG</strong> y se recomienda un tamaño de 21.5 x 28 cm (tamaño Carta) para que encaje perfecto en el PDF.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Año de Aplicación</label>
                <input 
                  type="number" 
                  value={anio} 
                  onChange={(e) => setAnio(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Escribe el año en el que se usará este diseño.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Archivo de Imagen (.png)</label>
                <input 
                  id="file-upload"
                  type="file" 
                  accept="image/png"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
              >
                {loading ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Subiendo...</>
                ) : (
                  <><UploadCloud size={20} /> Guardar Membrete</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionSistema;
