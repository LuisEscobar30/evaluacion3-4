import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import GestionUsuarios from './pages/GestionUsuarios';
import GestionCotizaciones from './pages/GestionCotizaciones'; // <-- Importamos la nueva página
import GestionProyectos from './pages/GestionProyectos'; // <-- Módulo de Luis: Proyectos
import GestionNoticias from './pages/GestionNoticias'; // <-- Módulo de Luis: Noticias
import Inicio from './pages/Inicio'; // <-- Pantalla de inicio con noticias y proyectos
import DetalleProyecto from './pages/DetalleProyecto'; // <-- Detalle de un proyecto
import DetalleNoticia from './pages/DetalleNoticia'; // <-- Detalle de una noticia
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- 1. GUARDIA DE SEGURIDAD (Rutas Protegidas) ---
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

  if (!usuarioActual) return null;

  return (
    <nav style={{ padding: '15px', background: '#080a0e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      
      {/* Lado izquierdo: Tu menú original actualizado */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <h2 style={{ margin: 0, color: '#ff922d' }}>OBE SPA Intranet</h2>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', alignSelf: 'center' }}>Inicio</Link>
        
        {/* Validación: Solo un Administrador ve la gestión de usuarios */}
        {usuarioActual.rol === 'Administrador' && (
          <Link to="/usuarios" style={{ color: 'white', textDecoration: 'none', alignSelf: 'center' }}>Gestión Usuarios</Link>
        )}

        {/* REQUERIMIENTO: Botón en Navbar para acceder al nuevo módulo de Cotizaciones */}
        {usuarioActual.rol === 'Administrador' && (
          <Link to="/cotizaciones" style={{ color: 'white', textDecoration: 'none', alignSelf: 'center' }}>Gestión Cotizaciones</Link>
        )}

        {/* Módulo Proyectos y Noticias */}
        {usuarioActual.rol === 'Administrador' && (
          <Link to="/proyectos" style={{ color: 'white', textDecoration: 'none', alignSelf: 'center' }}>Gestión Proyectos</Link>
        )}
        {usuarioActual.rol === 'Administrador' && (
          <Link to="/noticias" style={{ color: 'white', textDecoration: 'none', alignSelf: 'center' }}>Gestión Noticias</Link>
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
                <Inicio />
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
          {/* REQUERIMIENTO: Ruta Protegida de la Nueva Sección de Cotizaciones */}
          <Route 
            path="/cotizaciones" 
            element={
              <RutaProtegida>
                <GestionCotizaciones />
              </RutaProtegida>
            } 
          />

          {/* Módulo de Rutas Protegidas de Proyectos y Noticias */}
          <Route
            path="/proyectos"
            element={
              <RutaProtegida>
                <GestionProyectos />
              </RutaProtegida>
            }
          />
          <Route
            path="/noticias"
            element={
              <RutaProtegida>
                <GestionNoticias />
              </RutaProtegida>
            }
          />

          {/* Páginas de detalle: se abren al hacer clic en una tarjeta desde Inicio */}
          <Route
            path="/proyectos/:id"
            element={
              <RutaProtegida>
                <DetalleProyecto />
              </RutaProtegida>
            }
          />
          <Route
            path="/noticias/:id"
            element={
              <RutaProtegida>
                <DetalleNoticia />
              </RutaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;