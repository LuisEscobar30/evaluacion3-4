import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import type { Usuario } from '../types/types';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<'Administrador' | 'Cliente'>('Cliente');
  const [password, setPassword] = useState(''); // ¡Volvió la contraseña!
  
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const cargarUsuarios = async () => {
    setCargandoDatos(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const lista: Usuario[] = [];
      querySnapshot.forEach((documento) => {
        lista.push({ id: documento.id, ...documento.data() } as Usuario);
      });
      setUsuarios(lista);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("Hubo un problema al cargar los datos.");
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nom = nombre.trim();
    const mail = correo.trim();
    const tel = telefono.trim();
    const pass = password.trim();

    if (!nom || !mail || !tel) {
      setError('Nombre, correo y teléfono son obligatorios.');
      return;
    }

    // Validaciones
    if (!/^[a-zA-ZÀ-ÿ\s]{3,}$/.test(nom)) {
      setError('El nombre debe tener al menos 3 letras y no contener números.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setError('Ingresa un correo válido.');
      return;
    }
    if (!idEditando && pass.length < 6) {
      setError('La contraseña es obligatoria para nuevos usuarios y debe tener al menos 6 caracteres.');
      return;
    }

    const usuarioExistente = usuarios.find(u => u.correo.toLowerCase() === mail.toLowerCase());
    if (usuarioExistente && idEditando !== usuarioExistente.id) {
      setError('Este correo electrónico ya está registrado.');
      return;
    }

    setProcesando(true);

    try {
      if (idEditando) {
        // --- MODO EDICIÓN (Solo actualiza el perfil en Firestore) ---
        const refUsuario = doc(db, 'usuarios', idEditando);
        await updateDoc(refUsuario, { nombre: nom, correo: mail, telefono: tel, rol });
      } else {
        // --- MODO CREACIÓN (Crea Auth y Firestore vinculados) ---
        
        // 1. Instanciamos una App Secundaria de Firebase para no cerrar la sesión del Admin
        const appSecundaria = initializeApp(auth.app.options, 'AppSecundaria');
        const authSecundario = getAuth(appSecundaria);

        // 2. Creamos la cuenta real con correo y contraseña
        const credenciales = await createUserWithEmailAndPassword(authSecundario, mail, pass);
        const nuevoUid = credenciales.user.uid; // ¡Este es el ID clave!

        // 3. Creamos el perfil en Firestore usando EXACTAMENTE el mismo ID de Auth (usamos setDoc)
        await setDoc(doc(db, 'usuarios', nuevoUid), { 
          nombre: nom, 
          correo: mail, 
          telefono: tel, 
          rol, 
          activo: true 
        });

        // 4. Cerramos la app secundaria para limpiar memoria
        await authSecundario.signOut();
      }

      await cargarUsuarios();
      cancelarEdicion();
    } catch (err: any) {
      console.error("Error al guardar:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este correo ya está registrado en la base de datos de Auth.");
      } else {
        setError("Hubo un error al intentar guardar el usuario.");
      }
    } finally {
      setProcesando(false);
    }
  };

  const editarUsuario = (u: Usuario) => {
    setIdEditando(u.id);
    setNombre(u.nombre);
    setCorreo(u.correo);
    setTelefono(u.telefono);
    setRol(u.rol as 'Administrador' | 'Cliente');
    setPassword(''); 
    setError('');
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setNombre('');
    setCorreo('');
    setTelefono('');
    setRol('Cliente');
    setPassword('');
    setError('');
  };

  const alternarEstado = async (u: Usuario) => {
    setProcesando(true);
    try {
      const refUsuario = doc(db, 'usuarios', u.id);
      await updateDoc(refUsuario, { activo: !u.activo });
      await cargarUsuarios();
    } catch (err) {
      setError("No se pudo cambiar el estado.");
    } finally {
      setProcesando(false);
    }
  };

  const eliminarUsuario = async (u: Usuario) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar este usuario permanentemente?');
    if (confirmar) {
      setProcesando(true);
      try {
        await deleteDoc(doc(db, 'usuarios', u.id));
        await cargarUsuarios();
        if (idEditando === u.id) cancelarEdicion();
      } catch (err) {
        setError("No se pudo eliminar el usuario.");
      } finally {
        setProcesando(false);
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Gestión de Usuarios</h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        <strong>Nota de Sistema:</strong> Al registrar un nuevo usuario, se crea automáticamente su acceso seguro en el sistema y su perfil administrativo de forma vinculada.
      </p>
      
      <form noValidate onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxWidth: '500px' }}>
        <h3>{idEditando ? 'Editar Perfil de Usuario' : 'Nuevo Usuario'}</h3>
        
        {error && <p style={{ color: '#d32f2f', fontWeight: 'bold', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} disabled={procesando} />
          <input type="email" placeholder="Correo electrónico" value={correo} onChange={e => setCorreo(e.target.value)} disabled={procesando || idEditando !== null} />
          <input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} disabled={procesando} />
          
          {!idEditando && (
            <input 
              type="password" 
              placeholder="Contraseña (mín. 6 caracteres)" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              disabled={procesando}
            />
          )}
          
          <select value={rol} onChange={e => setRol(e.target.value as 'Administrador' | 'Cliente')} disabled={procesando}>
            <option value="Cliente">Cliente</option>
            <option value="Administrador">Administrador</option>
          </select>
          
          <button type="submit" disabled={procesando} style={{ background: '#ff922d', color: '#000', padding: '10px', border: 'none', fontWeight: 'bold', cursor: procesando ? 'not-allowed' : 'pointer', borderRadius: '4px' }}>
            {procesando ? 'Procesando...' : (idEditando ? 'Guardar Cambios' : 'Registrar Usuario')}
          </button>
          
          {idEditando && (
            <button type="button" onClick={cancelarEdicion} disabled={procesando} style={{ padding: '8px', marginTop: '5px', background: '#ccc', border: 'none', cursor: procesando ? 'not-allowed' : 'pointer', borderRadius: '4px' }}>
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      {/* SECCIÓN: Tabla */}
      {cargandoDatos ? (
        <p style={{ fontWeight: 'bold', color: '#ff922d' }}>Cargando usuarios desde la base de datos...</p>
      ) : (
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
                  <button onClick={() => editarUsuario(u)} disabled={procesando} style={{ marginRight: '5px', padding: '5px 10px', cursor: procesando ? 'not-allowed' : 'pointer' }}>Editar</button>
                  <button onClick={() => alternarEstado(u)} disabled={procesando} style={{ marginRight: '5px', padding: '5px 10px', cursor: procesando ? 'not-allowed' : 'pointer', background: u.activo ? '#ff9800' : '#4caf50', color: 'white', border: 'none', borderRadius: '3px' }}>
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => eliminarUsuario(u)} disabled={procesando} style={{ padding: '5px 10px', cursor: procesando ? 'not-allowed' : 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}>
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
      )}
    </div>
  );
}