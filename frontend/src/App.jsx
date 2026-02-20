import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout'; // 🔴 Importamos el Layout
import ComisionesTable from './components/ComisionesTable';
import CrearComision from './components/CrearComision';
import EditarComision from './components/EditarComision';
import DetalleOrden from './components/DetalleOrden';
import Login from './components/Login';

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
          /* Envolvemos todas las pantallas protegidas dentro del Layout */
          <Route 
            path="*" 
            element={
              <Layout usuario={usuario} onLogout={handleLogout}>
                <Routes>
                  {/* Módulo de Oficios (El principal) */}
                  <Route path="/" element={<ComisionesTable />} />
                  <Route path="/crear" element={<CrearComision />} />
                  <Route path="/editar/:id" element={<EditarComision />} />
                  <Route path="/orden/:id" element={<DetalleOrden />} />
                  
                  {/* Módulos Nuevos (Por construir) */}
                  <Route path="/personal" element={
                    <div className="p-8 text-center mt-20">
                      <h2 className="text-3xl font-bold text-gray-400">Módulo de Personal en construcción 🚧</h2>
                      <p className="text-gray-500 mt-2">Aquí gestionaremos a los 80 trabajadores del CESMECA.</p>
                    </div>
                  } />
                  
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
