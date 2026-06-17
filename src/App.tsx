import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import GestionUsuarios from './pages/GestionUsuarios';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- 1. GUARDIA DE SEGURIDAD (Rutas Protegidas) ---
// Verifica si hay sesión, si no, te patea al Login
const RutaProtegida = ({ children }: { children: React.ReactNode }) => {
  const { usuarioActual } = useAuth();
  
  if (!usuarioActual) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// --- 2. BARRA DE NAVEGACIÓN DINÁMICA ---
const NavBar = () => {
  const { usuarioActual, logout } = useAuth();

  // Si no hay usuario logueado (ej: estamos en la pantalla de Login), ocultamos la barra
  if (!usuarioActual) return null;

  return (
    <nav style={{ padding: '15px', background: '#080a0e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      
      {/* Lado izquierdo: Tu menú original */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <h2 style={{ margin: 0, color: '#ff922d' }}>OBE SPA Intranet</h2>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', alignSelf: 'center' }}>Inicio</Link>
        
        {/* Validación: Solo un Administrador ve el botón para entrar a la gestión */}
        {usuarioActual.rol === 'Administrador' && (
          <Link to="/usuarios" style={{ color: 'white', textDecoration: 'none', alignSelf: 'center' }}>Gestión Usuarios</Link>
        )}
      </div>

      {/* Lado derecho: Datos de la sesión y botón de salir */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px' }}>
          Hola, <strong>{usuarioActual.nombre}</strong> ({usuarioActual.rol})
        </span>
        <button 
          onClick={logout} 
          style={{ background: '#f44336', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

// --- 3. APLICACIÓN PRINCIPAL ---
function App() {
  return (
    // Envolvemos todo en el AuthProvider para que el contexto funcione
    <AuthProvider>
      <BrowserRouter>
        <NavBar />

        {/* Sistema de Rutas */}
        <Routes>
          {/* RUTA PÚBLICA */}
          <Route path="/login" element={<Login />} />

          {/* RUTAS PROTEGIDAS */}
          <Route 
            path="/" 
            element={
              <RutaProtegida>
                <h1 style={{ padding: '20px' }}>Bienvenido al Panel de Administración</h1>
              </RutaProtegida>
            } 
          />
          <Route 
            path="/usuarios" 
            element={
              <RutaProtegida>
                <GestionUsuarios />
              </RutaProtegida>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;