import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ComisionesTable from './components/ComisionesTable';
import CrearComision from './components/CrearComision';
import EditarComision from './components/EditarComision';
import DetalleOrden from './components/DetalleOrden';
import Login from './components/Login'; // 🔴 Importamos el nuevo componente

function App() {
  // Estado para saber si hay alguien logueado
  const [usuario, setUsuario] = useState(null);

  // Al cargar la app, revisamos si ya se habían logueado antes (para no pedir contraseña cada vez que refrescan)
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuarioActivo');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  // Función para cerrar sesión (la podemos poner en la cabecera más adelante si quieres)
  const handleLogout = () => {
    localStorage.removeItem('usuarioActivo');
    setUsuario(null);
  };

  return (
    <Router>
      <Routes>
        {/* Si NO hay usuario, cualquier ruta los manda al Login */}
        {!usuario ? (
          <>
            <Route path="/login" element={<Login onLogin={(user) => setUsuario(user)} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          /* Si SÍ hay usuario, tienen acceso a todo el sistema */
          <>
            <Route path="/" element={<ComisionesTable usuario={usuario} onLogout={handleLogout} />} />
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
