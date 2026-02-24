import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ComisionesTable from './components/ComisionesTable';
import CrearComision from './components/CrearComision';
import EditarComision from './components/EditarComision';
import DetalleOrden from './components/DetalleOrden';
import Login from './components/Login';
import PersonalTable from './components/PersonalTable';
import VehiculosTable from './components/VehiculosTable'; // 🔴 Importamos Vehículos

function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuarioActivo');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('usuarioActivo');
    setUsuario(null);
  };

  return (
    <Router>
      <Routes>
        {!usuario ? (
          <>
            <Route path="/login" element={<Login onLogin={(user) => setUsuario(user)} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <Route 
            path="*" 
            element={
              <Layout usuario={usuario} onLogout={handleLogout}>
                <Routes>
                  {/* Día a día */}
                  <Route path="/" element={<ComisionesTable />} />
                  <Route path="/crear" element={<CrearComision />} />
                  <Route path="/editar/:id" element={<EditarComision />} />
                  <Route path="/orden/:id" element={<DetalleOrden />} />
                  
                  {/* Catálogos */}
                  <Route path="/personal" element={<PersonalTable />} />
                  <Route path="/vehiculos" element={<VehiculosTable />} /> {/* 🔴 Ruta de Vehículos */}
                  
                  {/* Configuración */}
                  <Route path="/usuarios" element={
                    <div className="p-8 text-center mt-20">
                      <h2 className="text-3xl font-bold text-gray-400">Módulo de Usuarios en construcción 🚧</h2>
                    </div>
                  } />
                </Routes>
              </Layout>
            } 
          />
        )}
      </Routes>
    </Router>
  );
}

export default App;
