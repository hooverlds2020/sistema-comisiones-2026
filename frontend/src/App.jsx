import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ComisionesTable from './components/ComisionesTable';
import CrearComision from './components/CrearComision';
import EditarComision from './components/EditarComision';
import DetalleOrden from './components/DetalleOrden';
import Login from './components/Login';
import PersonalTable from './components/PersonalTable';
import VehiculosTable from './components/VehiculosTable';
import AutoridadesTable from './components/AutoridadesTable';
import ClavesProgramaticasTable from './components/ClavesProgramaticasTable';
import ClavesPresupuestalesTable from './components/ClavesPresupuestalesTable';
import UsuariosTable from './components/UsuariosTable';
import ConfiguracionSistema from './components/ConfiguracionSistema';

function App() {
  // 🔴 CORRECCIÓN: Leemos la sesión al instante para evitar el "parpadeo" y que te saque de la ruta
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuarioActivo');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

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
                  <Route path="/vehiculos" element={<VehiculosTable />} />
                  <Route path="/autoridades" element={<AutoridadesTable />} />
                  <Route path="/claves-programaticas" element={<ClavesProgramaticasTable />} />
                  <Route path="/claves-presupuestales" element={<ClavesPresupuestalesTable />} />
                  
                  {/* Configuración */}
                  <Route path="/usuarios" element={<UsuariosTable />} />
		  <Route path="/configuracion" element={<ConfiguracionSistema />} />  
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
