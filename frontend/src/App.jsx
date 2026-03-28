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
import BitacoraTable from './components/BitacoraTable'; // Ì¥¥ Se importa la Bit√°cora

function App() {
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
                  {/* D√≠a a d√≠a */}
                  <Route path="/" element={<ComisionesTable />} />
                  <Route path="/crear" element={<CrearComision />} />
                  <Route path="/editar/:id" element={<EditarComision />} />
                  <Route path="/orden/:id" element={<DetalleOrden />} />

                  {/* Cat√°logos */}
                  <Route path="/personal" element={<PersonalTable />} />
                  <Route path="/vehiculos" element={<VehiculosTable />} />
                  <Route path="/autoridades" element={<AutoridadesTable />} />
                  <Route path="/claves-programaticas" element={<ClavesProgramaticasTable />} />
                  <Route path="/claves-presupuestales" element={<ClavesPresupuestalesTable />} />

                  {/* Configuraci√≥n y Seguridad */}
                  <Route path="/usuarios" element={<UsuariosTable />} />
                  <Route path="/configuracion" element={<ConfiguracionSistema />} />
                  <Route path="/bitacora" element={<BitacoraTable />} /> {/* Ì¥¥ Se registra la ruta */}
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
