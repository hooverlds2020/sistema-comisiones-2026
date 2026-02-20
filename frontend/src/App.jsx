import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ComisionesTable from './components/ComisionesTable';
import CrearComision from './components/CrearComision';
import EditarComision from './components/EditarComision';
import DetalleOrden from './components/DetalleOrden'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ComisionesTable />} />
        <Route path="/crear" element={<CrearComision />} />
        <Route path="/editar/:id" element={<EditarComision />} />
        {/* Esta ruta centraliza la visualización oficial */}
        <Route path="/orden/:id" element={<DetalleOrden />} />
      </Routes>
    </Router>
  );
}

export default App;
