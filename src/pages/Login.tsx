import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  // --- 1. ESTADOS (Hooks) ---
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Extraemos la función global de inicio de sesión desde nuestro Contexto
  const { login } = useAuth();
  
  // Hook de React Router para poder redirigir al usuario de página
  const navigate = useNavigate();

  // --- 2. MANEJADOR DEL ENVÍO ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    const mail = correo.trim();
    const pass = contrasena.trim();

    // A. Validaciones básicas del lado del cliente (Exigido por la pauta)
    if (!mail || !pass) {
      setError('Por favor, completa todos los campos.');
      setCargando(false);
      return;
    }

    // B. Validación de formato de correo (Mismo Regex estándar que usamos antes)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mail)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      setCargando(false);
      return;
    }

    // C. Intentamos iniciar sesión llamando al Contexto
    // La función login nos devolverá un texto si hay error, o null si todo salió bien
    const mensajeError = login(mail, pass);

    if (mensajeError) {
      setError(mensajeError);
      setCargando(false);
    } else {
      // Éxito: Redirigimos al Dashboard principal de la Intranet
      setCargando(false);
      navigate('/');
    }
  };

  // --- 3. UI (Renderizado) ---
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh', 
      fontFamily: 'sans-serif' 
    }}>
      <form 
        noValidate 
        onSubmit={handleSubmit} 
        style={{ 
          background: '#f5f5f5', 
          padding: '30px', 
          borderRadius: '8px', 
          width: '100%', 
          maxWidth: '400px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#333' }}>OBE SPA</h2>
        <p style={{ textAlign: 'center', margin: '0 0 20px 0', color: '#666' }}>Acceso a la Intranet</p>

        {/* Cuadro de Errores Estandarizado */}
        {error && (
          <p style={{ 
            color: '#d32f2f', 
            fontWeight: 'bold', 
            padding: '10px', 
            background: '#ffebee', 
            borderRadius: '4px',
            fontSize: '14px',
            margin: '0 0 15px 0'
          }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Correo Electrónico:
            </label>
            <input 
              type="email" 
              placeholder="ejemplo@obespa.cl" 
              value={correo} 
              onChange={e => setCorreo(e.target.value)} 
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Contraseña:
            </label>
            <input 
              type="password" 
              placeholder="******" 
              value={contrasena} 
              onChange={e => setContrasena(e.target.value)} 
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            style={{ 
              background: '#ff922d', 
              color: '#000', 
              padding: '12px', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: cargando ? 'not-allowed' : 'pointer', 
              borderRadius: '4px',
              fontSize: '16px',
              marginTop: '10px'
            }}
          >
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </div>
      </form>
    </div>
  );
}