import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ComisionesTable from './components/ComisionesTable';
import CrearComision from './components/CrearComision';
import EditarComision from './components/EditarComision';
import DetalleOrden from './components/DetalleOrden';
import Login from './components/Login';

function App() {
  const [usuario, setUsuario] = useState(null);

  // Revisa si ya hay alguien logueado al refrescar la página
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuarioActivo');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('usuarioActivo');
    setUsuario(null);
  };

  return (
    <Router>
      <Routes>
        {/* Si NO hay usuario, mandamos al Login */}
        {!usuario ? (
          <>
            <Route path="/login" element={<Login onLogin={(user) => setUsuario(user)} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          /* Si SÍ hay usuario, habilitamos el sistema y le pasamos los datos a la tabla */
          <>
            <Route 
              path="/" 
              element={<ComisionesTable usuario={usuario} onLogout={handleLogout} />} 
            />
            <Route path="/crear" element={<CrearComision />} />
            <Route path="/editar/:id" element={<EditarComision />} />
            <Route path="/orden/:id" element={<DetalleOrden />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
