import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('usuarioActivo', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.message || 'Credenciales incorrectas. Verifica tu usuario y contraseña.');
      }
    } catch (error) {
      setError('Fallo de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-900 overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"></div>

        <div className="relative z-10 mt-8">
           
           {/* 🔴 Le quitamos el fondo blanco y dejamos el logo flotando libremente */}
           <div className="mb-10 inline-block">
              <img src="/logo-unicach.png" alt="Logo UNICACH" className="h-28 md:h-32 w-auto object-contain drop-shadow-2xl" />
           </div>
           
           <h1 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
             Sistema de Control<br/>de Comisiones
           </h1>
           <p className="text-blue-100 text-lg opacity-90 max-w-md">
             Plataforma administrativa para la gestión, emisión y control de viáticos y formatos únicos de comisión.
           </p>
        </div>

        <div className="relative z-10 text-sm text-blue-200">
          <p className="font-bold">© 2026 Universidad Autónoma de Ciencias y Artes de Chiapas</p>
          <p className="opacity-60">Centro de Estudios Superiores de México y Centroamérica</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-gray-50 lg:bg-white shadow-[-20px_0_30px_-15px_rgba(0,0,0,0.1)] z-10">
        <div className="w-full max-w-sm space-y-8">
          
          <div className="lg:hidden text-center mb-8 flex flex-col items-center">
             {/* 🔴 También sin fondo blanco en la versión de celular */}
             <div className="mb-5">
               <img src="/logo-unicach.png" alt="Logo UNICACH" className="h-24 w-auto object-contain drop-shadow-md" />
             </div>
             <h3 className="text-xl font-bold text-gray-800 mt-2">Control de Comisiones</h3>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Iniciar Sesión</h2>
            <p className="text-gray-500 mt-2">Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm font-medium transition-all"
                  placeholder="ej. pballinas"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-all duration-200 disabled:opacity-70 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Entrar al Sistema
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="text-center text-xs text-gray-400 mt-6 font-medium">
             <p>Acceso restringido únicamente para personal autorizado.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
