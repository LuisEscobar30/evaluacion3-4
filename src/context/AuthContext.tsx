import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Usuario } from '../types/types';

// 1. Definimos qué datos y funciones tendrá nuestro contexto
interface AuthContextType {
  usuarioActual: Usuario | null;
  login: (correo: string, contrasena: string) => string | null; 
  logout: () => void;
}

// 2. Creamos el contexto vacío inicial
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Componente Proveedor (El "paraguas" que envolverá tu app)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);

  // EFECTO PRINCIPAL: Inicializar los datos en el nivel más alto de la aplicación
  useEffect(() => {
    // A. Verificamos si existe la base de datos de usuarios. 
    // Si no existe, la creamos de inmediato con el Administrador inicial y su contraseña.
    const usuariosGuardados = localStorage.getItem('obe_usuarios');
    if (!usuariosGuardados) {
      const iniciales: Usuario[] = [
        { 
          id: '1', 
          nombre: 'Admin', 
          correo: 'admin@obespa.cl', 
          telefono: '+56912345678', 
          rol: 'Administrador', 
          activo: true, 
          password: 'admin123' // Contraseña para el usuario por defecto
        }
      ];
      localStorage.setItem('obe_usuarios', JSON.stringify(iniciales));
    }

    // B. Verificamos si había una sesión abierta previamente
    const sesionGuardada = localStorage.getItem('obe_sesion');
    if (sesionGuardada) {
      setUsuarioActual(JSON.parse(sesionGuardada));
    }
  }, []);

  // FUNCIÓN DE LOGIN
  const login = (correo: string, contrasena: string) => {
    const datosGuardados = localStorage.getItem('obe_usuarios');
    if (!datosGuardados) return 'Error interno: No hay base de datos de usuarios.';

    const usuarios: Usuario[] = JSON.parse(datosGuardados);
    const usuarioEncontrado = usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase());

    // Validamos que el correo exista
    if (!usuarioEncontrado) {
      return 'Correo electrónico no encontrado.';
    }

    // Validamos que la cuenta no haya sido desactivada en tu CRUD
    if (!usuarioEncontrado.activo) {
      return 'Esta cuenta está desactivada. Contacte a un administrador.';
    }

    // Validamos que la contraseña ingresada coincida con la del usuario registrado
    if (usuarioEncontrado.password !== contrasena) {
      return 'Contraseña incorrecta.';
    }

    // Si todo es correcto, iniciamos sesión y la guardamos
    setUsuarioActual(usuarioEncontrado);
    localStorage.setItem('obe_sesion', JSON.stringify(usuarioEncontrado));
    
    return null; 
  };

  // FUNCIÓN DE LOGOUT
  const logout = () => {
    setUsuarioActual(null);
    localStorage.removeItem('obe_sesion'); 
  };

  return (
    <AuthContext.Provider value={{ usuarioActual, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Hook personalizado para usar este cerebro fácilmente en cualquier otro archivo
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}