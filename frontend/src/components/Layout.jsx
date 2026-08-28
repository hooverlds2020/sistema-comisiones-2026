import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText, Users, Shield, LogOut, User, Menu, X,
  Car, UserCheck, Layers, Wallet, Settings, Activity, ChevronDown
} from 'lucide-react';

const Layout = ({ children, usuario, onLogout }) => {
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [adminMenuAbierto, setAdminMenuAbierto] = useState(false);
  const adminMenuRef = useRef(null);

  // ���️ Revisamos si el usuario actual es Administrador
  const esAdmin = usuario?.rol?.toLowerCase().includes('admin');

  // Enlaces base para todos
  const baseLinks = [
    { path: '/', label: 'Oficios', icon: <FileText size={18} /> },
    { path: '/personal', label: 'Personal', icon: <Users size={18} /> },
    { path: '/vehiculos', label: 'Vehículos', icon: <Car size={18} /> },
    { path: '/autoridades', label: 'Autoridades', icon: <UserCheck size={18} /> },
    { path: '/claves-programaticas', label: 'Programáticas', icon: <Layers size={18} /> },
    { path: '/claves-presupuestales', label: 'Presupuestos', icon: <Wallet size={18} /> }
  ];

  // Enlaces que SOLO ven los Administradores (agrupados en un menú desplegable
  // para que no desborden la barra de navegación junto con el botón de salir)
  const adminLinks = [
    { path: '/usuarios', label: 'Usuarios', icon: <Shield size={18} /> },
    { path: '/configuracion', label: 'Configuración', icon: <Settings size={18} /> },
    { path: '/bitacora', label: 'Auditoría', icon: <Activity size={18} /> }
  ];

  // Menú completo (para la vista móvil, que se despliega en columna)
  const navLinks = esAdmin ? [...baseLinks, ...adminLinks] : baseLinks;
  const enAdminLink = esAdmin && adminLinks.some(link => location.pathname.startsWith(link.path));

  useEffect(() => {
    const cerrarSiExterno = (e) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target)) {
        setAdminMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', cerrarSiExterno);
    return () => document.removeEventListener('mousedown', cerrarSiExterno);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-blue-900 text-white shadow-md z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center">
                 <img src="/logo-unicach.png" alt="UNICACH" className="h-10 w-auto object-contain" />
              </div>
            </div>

            <div className="hidden xl:flex items-center space-x-1 lg:space-x-1.5 flex-1 min-w-0 overflow-x-auto px-1">
              {baseLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-2 py-2 rounded-md font-bold text-xs xl:text-sm transition-colors flex-shrink-0 whitespace-nowrap ${
                    location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
                      ? 'bg-blue-800 text-white shadow-inner'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  {link.icon} <span className="hidden xl:inline">{link.label}</span><span className="xl:hidden">{link.label.substring(0,4)}.</span>
                </Link>
              ))}
            </div>

            <div className="hidden xl:flex items-center gap-2 lg:gap-4 border-l border-blue-700 px-2 lg:px-4 ml-2 flex-shrink-0">
              {esAdmin && (
                <div className="relative" ref={adminMenuRef}>
                  <button
                    onClick={() => setAdminMenuAbierto(a => !a)}
                    title="Administración"
                    className={`flex items-center gap-1 px-2 py-2 rounded-md font-bold text-xs lg:text-sm transition-colors whitespace-nowrap ${
                      enAdminLink || adminMenuAbierto
                        ? 'bg-blue-800 text-white shadow-inner'
                        : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    <Shield size={18} />
                    <ChevronDown size={14} className={`transition-transform ${adminMenuAbierto ? 'rotate-180' : ''}`} />
                  </button>

                  {adminMenuAbierto && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-30 text-gray-700">
                      {adminLinks.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setAdminMenuAbierto(false)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold ${
                            location.pathname.startsWith(link.path) ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'
                          }`}
                        >
                          {link.icon} {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
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

            <div className="xl:hidden flex items-center">
              <button onClick={() => setMenuAbierto(!menuAbierto)} className="p-2 text-blue-200 hover:text-white">
                {menuAbierto ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {menuAbierto && (
          <div className="xl:hidden bg-blue-800 border-t border-blue-700 pb-4">
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

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
