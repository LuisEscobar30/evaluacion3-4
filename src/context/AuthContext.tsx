import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { Usuario } from '../types/types';

// 1. Definimos qué datos y funciones tendrá nuestro contexto
interface AuthContextType {
  usuarioActual: Usuario | null;
  firebaseUser: User | null; // Guardamos el usuario de Firebase para la pauta
  cargandoAuth: boolean;
  login: (correo: string, contrasena: string) => Promise<string | null>; 
  logout: () => Promise<void>;
}

// 2. Creamos el contexto vacío inicial
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Componente Proveedor
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true); // Estado de carga inicial

  useEffect(() => {
    // onAuthStateChanged escucha automáticamente si hay una sesión activa en Firebase
    const desuscribir = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // Si hay usuario en Firebase, buscamos sus datos (nombre, rol) en Firestore
        try {
          const docRef = doc(db, 'usuarios', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUsuarioActual({ id: user.uid, ...docSnap.data() } as Usuario);
          } else {
            // Fallback: Si el usuario existe en Auth pero tus compañeros aún no lo 
            // guardan en Firestore, lo dejamos entrar como Admin por defecto para no bloquearte.
            setUsuarioActual({
              id: user.uid,
              nombre: 'Administrador',
              correo: user.email || '',
              telefono: '',
              rol: 'Administrador', 
              activo: true,
              password: '' // Ya no se usa, Firebase maneja esto
            });
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
          setUsuarioActual(null);
        }
      } else {
        setUsuarioActual(null); // No hay sesión
      }
      setCargandoAuth(false); // Terminó de verificar
    });

    return () => desuscribir();
  }, []);

  // FUNCIÓN DE LOGIN CON FIREBASE
  const login = async (correo: string, contrasena: string) => {
    try {
      await signInWithEmailAndPassword(auth, correo, contrasena);
      return null; // Éxito, no hay mensaje de error
    } catch (error: any) {
      // Manejo de errores amigable según la pauta de la ES4
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        return 'El correo o la contraseña son incorrectos.';
      }
      if (error.code === 'auth/user-not-found') {
        return 'No existe una cuenta con este correo.';
      }
      if (error.code === 'auth/too-many-requests') {
        return 'Demasiados intentos fallidos. Intenta más tarde por seguridad.';
      }
      return 'Ocurrió un error al intentar iniciar sesión.';
    }
  };

  // FUNCIÓN DE LOGOUT CON FIREBASE
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <AuthContext.Provider value={{ usuarioActual, firebaseUser, cargandoAuth, login, logout }}>
      {/* Solo mostramos la aplicación cuando Firebase nos confirma si hay sesión o no */}
      {!cargandoAuth && children}
    </AuthContext.Provider>
  );
}

// 4. Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}