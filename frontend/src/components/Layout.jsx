import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Users, Shield, LogOut, User, Menu, X } from 'lucide-react';

const Layout = ({ children, usuario, onLogout }) => {
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const navLinks = [
    { path: '/', label: 'Oficios de Comisión', icon: <FileText size={18} /> },
    { path: '/personal', label: 'Personal', icon: <Users size={18} /> },
    { path: '/usuarios', label: 'Usuarios', icon: <Shield size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <nav className="bg-blue-900 text-white shadow-md z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo y Nombre del Sistema */}
            <div className="flex items-center gap-3">
              <div className="bg-white text-blue-900 font-black px-2 py-1 rounded text-xl tracking-widest">
                CESMECA
              </div>
              <span className="hidden md:block font-bold text-blue-100">
                Panel Administrativo
              </span>
            </div>

            {/* Menú de Escritorio */}
            <div className="hidden md:flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md font-bold text-sm transition-colors ${
                    location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
                      ? 'bg-blue-800 text-white shadow-inner'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  {link.icon} {link.label}
                </Link>
              ))}
            </div>

            {/* Usuario y Logout (Escritorio) */}
            <div className="hidden md:flex items-center gap-4 border-l border-blue-700 pl-4 ml-2">
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <User size={16} />
                <div className="flex flex-col leading-none">
                  <span className="font-black text-white">{usuario?.nombre}</span>
                  <span className="text-[10px] uppercase tracking-wider">{usuario?.rol}</span>
                </div>
              </div>
              <button 
                onClick={onLogout} 
                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            </div>

            {/* Botón Menú Móvil */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMenuAbierto(!menuAbierto)} className="p-2 text-blue-200 hover:text-white">
                {menuAbierto ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {menuAbierto && (
          <div className="md:hidden bg-blue-800 border-t border-blue-700 pb-4">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuAbierto(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md font-bold text-base ${
                    location.pathname === link.path ? 'bg-blue-900 text-white' : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  {link.icon} {link.label}
                </Link>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-blue-700 flex justify-between items-center">
              <div className="flex items-center gap-2 text-white">
                <User size={18} />
                <span className="font-bold">{usuario?.nombre}</span>
              </div>
              <button onClick={onLogout} className="flex items-center gap-2 text-red-300 hover:text-red-100 font-bold">
                <LogOut size={18} /> Salir
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ÁREA DE CONTENIDO DINÁMICO */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
