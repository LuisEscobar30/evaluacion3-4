import { useState, useEffect } from 'react';
import type { Usuario } from '../types/types';

export default function GestionUsuarios() {
  // --- 1. ESTADOS (Hooks) ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<'Administrador' | 'Cliente'>('Cliente');
  const [password, setPassword] = useState(''); // Estado para la contraseña individual
  
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [error, setError] = useState('');

  // --- 2. EFECTO: Cargar datos al iniciar ---
  useEffect(() => {
    const datosGuardados = localStorage.getItem('obe_usuarios');
    if (datosGuardados) {
      setUsuarios(JSON.parse(datosGuardados));
    } else {
      // Creamos el Administrador por defecto con su propia contraseña inicial
      const iniciales: Usuario[] = [
        { id: '1', nombre: 'Martín (Tú)', correo: 'admin@obespa.cl', telefono: '+56912345678', rol: 'Administrador', activo: true, password: 'admin123' }
      ];
      setUsuarios(iniciales);
      localStorage.setItem('obe_usuarios', JSON.stringify(iniciales));
    }
  }, []);

  // --- 3. FUNCIÓN REUTILIZABLE: Guardar en Estado y LocalStorage ---
  const guardarDatos = (nuevaLista: Usuario[]) => {
    setUsuarios(nuevaLista);
    localStorage.setItem('obe_usuarios', JSON.stringify(nuevaLista));
  };

  // --- 4. CREAR O ACTUALIZAR USUARIO ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 

    const nom = nombre.trim();
    const mail = correo.trim();
    const tel = telefono.trim();
    const pass = password.trim();

    // A. Validación de campos vacíos obligatorios
    if (!nom || !mail || !tel) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    // B. Validación de Nombre
    const nombreRegex = /^[a-zA-ZÀ-ÿ\s]{3,}$/;
    if (!nombreRegex.test(nom)) {
      setError('El nombre debe tener al menos 3 letras y no contener números ni símbolos.');
      return;
    }

    // C. Validación de Correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mail)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    // D. Validación de Teléfono
    const telefonoRegex = /^\+?[0-9]{8,11}$/;
    if (!telefonoRegex.test(tel)) {
      setError('El teléfono debe contener entre 8 y 11 números (Ej: +56912345678).');
      return;
    }

    // E. Validación de Contraseña (Obligatoria al crear, u opcional de mínimo 6 letras si se escribe algo al editar)
    if (!idEditando && !pass) {
      setError('La contraseña es obligatoria para registrar un nuevo usuario.');
      return;
    }
    if (pass && pass.length < 6) {
      setError('La contraseña debe tener como mínimo 6 caracteres por seguridad.');
      return;
    }

    // F. Validación de Correos Duplicados
    const usuarioExistente = usuarios.find(u => u.correo.toLowerCase() === mail.toLowerCase());
    if (usuarioExistente && idEditando !== usuarioExistente.id) {
      setError('Este correo electrónico ya está registrado en otra cuenta.');
      return;
    }

    // --- PROCESO DE GUARDADO ---
    if (idEditando) {
      // REGLA DE NEGOCIO: Evitar que el último admin se degrade a cliente
      const usuarioPrevio = usuarios.find(u => u.id === idEditando);
      
      if (usuarioPrevio && usuarioPrevio.rol === 'Administrador' && rol === 'Cliente' && usuarioPrevio.activo) {
        const adminsActivos = usuarios.filter(u => u.rol === 'Administrador' && u.activo).length;
        if (adminsActivos <= 1) {
          setError('Error Crítico: No puedes cambiar el rol del único Administrador activo.');
          return; 
        }
      }

      // Actualizar existente (Si pass está vacío, se conserva u.password)
      const actualizados = usuarios.map(u => 
        u.id === idEditando ? { ...u, nombre: nom, correo: mail, telefono: tel, rol, password: pass || u.password } : u
      );
      guardarDatos(actualizados);
      setIdEditando(null);
    } else {
      // Crear nuevo usuario con su clave correspondiente
      const nuevoUsuario: Usuario = {
        id: crypto.randomUUID(), 
        nombre: nom,
        correo: mail,
        telefono: tel,
        rol,
        activo: true,
        password: pass
      };
      guardarDatos([...usuarios, nuevoUsuario]);
    }

    // Limpiar formulario al terminar
    setNombre('');
    setCorreo('');
    setTelefono('');
    setRol('Cliente');
    setPassword('');
  };

  // --- 5. PREPARAR EDICIÓN ---
  const editarUsuario = (u: Usuario) => {
    setIdEditando(u.id);
    setNombre(u.nombre);
    setCorreo(u.correo);
    setTelefono(u.telefono);
    setRol(u.rol);
    setPassword(''); // Se limpia el campo para dejar la clave actual intacta a menos que se escriba otra
    setError('');
  };

  // --- 6. DESACTIVAR / ACTIVAR (Eliminado lógico) ---
  const alternarEstado = (id: string) => {
    const usuarioActual = usuarios.find(u => u.id === id);

    if (usuarioActual && usuarioActual.rol === 'Administrador' && usuarioActual.activo) {
      const adminsActivos = usuarios.filter(u => u.rol === 'Administrador' && u.activo).length;
      if (adminsActivos <= 1) {
        alert('Error Crítico: No puedes desactivar al único Administrador activo. El sistema quedaría inaccesible.');
        return; 
      }
    }

    const actualizados = usuarios.map(u => 
      u.id === id ? { ...u, activo: !u.activo } : u
    );
    guardarDatos(actualizados);
  };

  // --- 7. ELIMINAR FÍSICAMENTE (Permanente) ---
  const eliminarUsuario = (id: string) => {
    const usuarioActual = usuarios.find(u => u.id === id);

    if (usuarioActual && usuarioActual.rol === 'Administrador' && usuarioActual.activo) {
      const adminsActivos = usuarios.filter(u => u.rol === 'Administrador' && u.activo).length;
      if (adminsActivos <= 1) {
        alert('Error Crítico: No puedes eliminar al único Administrador del sistema.');
        return; 
      }
    }

    const confirmar = window.confirm('¿Estás seguro de eliminar este usuario permanentemente? Esta acción no se puede deshacer.');
    if (confirmar) {
      const actualizados = usuarios.filter(u => u.id !== id);
      guardarDatos(actualizados);
      
      if (idEditando === id) {
        setIdEditando(null);
        setNombre('');
        setCorreo('');
        setTelefono('');
        setRol('Cliente');
        setPassword('');
        setError('');
      }
    }
  };

  // --- RENDERIZADO (UI) ---
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Gestión de Usuarios</h2>
      
      {/* SECCIÓN: Formulario */}
      <form noValidate onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxWidth: '500px' }}>
        <h3>{idEditando ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
        
        {error && <p style={{ color: '#d32f2f', fontWeight: 'bold', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} />
          <input type="email" placeholder="Correo electrónico" value={correo} onChange={e => setCorreo(e.target.value)} />
          <input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
          
          {/* Campo de Contraseña de Usuario */}
          <input 
            type="password" 
            placeholder={idEditando ? "Nueva contraseña (dejar vacío para mantener)" : "Contraseña (mín. 6 caracteres)"} 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          
          <select value={rol} onChange={e => setRol(e.target.value as 'Administrador' | 'Cliente')}>
            <option value="Cliente">Cliente</option>
            <option value="Administrador">Administrador</option>
          </select>
          
          <button type="submit" style={{ background: '#ff922d', color: '#000', padding: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
            {idEditando ? 'Guardar Cambios' : 'Registrar Usuario'}
          </button>
          
          {idEditando && (
            <button type="button" onClick={() => { setIdEditando(null); setNombre(''); setCorreo(''); setTelefono(''); setRol('Cliente'); setPassword(''); setError(''); }} style={{ padding: '8px', marginTop: '5px', background: '#ccc', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      {/* SECCIÓN: Tabla */}
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: '#333', color: 'white' }}>
          <tr>
            <th style={{ padding: '10px' }}>Nombre</th>
            <th style={{ padding: '10px' }}>Correo</th>
            <th style={{ padding: '10px' }}>Teléfono</th>
            <th style={{ padding: '10px' }}>Rol</th>
            <th style={{ padding: '10px' }}>Estado</th>
            <th style={{ padding: '10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id} style={{ opacity: u.activo ? 1 : 0.5 }}>
              <td style={{ padding: '10px' }}>{u.nombre}</td>
              <td style={{ padding: '10px' }}>{u.correo}</td>
              <td style={{ padding: '10px' }}>{u.telefono}</td>
              <td style={{ padding: '10px' }}><strong>{u.rol}</strong></td>
              <td style={{ padding: '10px', color: u.activo ? 'green' : '#d32f2f', fontWeight: 'bold' }}>
                {u.activo ? 'Activo' : 'Inactivo'}
              </td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => editarUsuario(u)} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>Editar</button>
                
                <button onClick={() => alternarEstado(u.id)} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer', background: u.activo ? '#ff9800' : '#4caf50', color: 'white', border: 'none', borderRadius: '3px' }}>
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
                
                <button onClick={() => eliminarUsuario(u.id)} style={{ padding: '5px 10px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {usuarios.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No hay usuarios registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}