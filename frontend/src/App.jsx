import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importación de componentes
import ComisionesTable from './components/ComisionesTable';
import CrearComision from './components/CrearComision';
import EditarComision from './components/EditarComision';
import VerComision from './components/VerComision'; // Importa el nuevo archivo

/**
 * Componente Principal App
 * Define la estructura de navegación del Sistema de Gestión de Comisiones 2026.
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Ruta principal: Muestra la tabla con todas las comisiones registradas */}
          <Route path="/" element={<ComisionesTable />} />

          {/* Ruta para crear una nueva orden de comisión */}
          <Route path="/crear" element={<CrearComision />} />

          {/* Ruta dinámica para editar una comisión existente mediante su ID */}
          <Route path="/editar/:id" element={<EditarComision />} />
          
          {/* Ruta de respaldo (opcional): Redirige al inicio si la URL no existe */}
          <Route path="*" element={<ComisionesTable />} />

	  <Route path="/ver/:id" element={<VerComision />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
