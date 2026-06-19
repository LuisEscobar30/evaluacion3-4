import { useState, useEffect } from 'react';
import type { Cotizacion, EstadoCotizacion, Usuario } from '../types/types';
import { useAuth } from '../context/AuthContext';

export default function GestionCotizaciones() {
  const { usuarioActual } = useAuth(); // Para obtener el administrador en la sesión

  // --- 1. ESTADOS (Hooks) ---
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [nombreCliente, setNombreCliente] = useState('');
  const [rutCliente, setRutCliente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState<EstadoCotizacion>('Pendiente');
  const [responsable, setResponsable] = useState('Sin asignar');

  // Estados para Filtros y Búsqueda
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');

  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [error, setError] = useState('');

  // --- 2. EFECTO: Cargar datos de cotizaciones al iniciar ---
  useEffect(() => {
    const datosGuardados = localStorage.getItem('obe_cotizaciones');
    if (datosGuardados) {
      setCotizaciones(JSON.parse(datosGuardados));
    }
  }, []);

  // --- 3. FUNCIÓN REUTILIZABLE: Guardar datos ---
  const guardarDatos = (nuevaLista: Cotizacion[]) => {
    setCotizaciones(nuevaLista);
    localStorage.setItem('obe_cotizaciones', JSON.stringify(nuevaLista));
  };

  // --- 4. CREAR O ACTUALIZAR COTIZACIÓN ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nom = nombreCliente.trim();
    const rut = rutCliente.trim();
    const desc = descripcion.trim();

    // A. Validación de campos vacíos obligatorios
    if (!nom || !rut || !desc) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    // B. Validación básica de RUT (Longitud o formato simple)
    if (rut.length < 8) {
      setError('Por favor, ingresa un RUT válido (mínimo 8 caracteres sin puntos).');
      return;
    }

    // --- PROCESO DE GUARDADO ---
    if (idEditando) {
      // Actualizar cotización existente
      const actualizadas = cotizaciones.map(c =>
        c.id === idEditando
          ? { ...c, nombreCliente: nom, rutCliente: rut, descripcion: desc, estado, responsable }
          : c
      );
      guardarDatos(actualizadas);
      setIdEditando(null);
    } else {
      // Registrar nueva cotización (con fecha automática)
      const nuevaCotizacion: Cotizacion = {
        id: crypto.randomUUID(),
        nombreCliente: nom,
        rutCliente: rut,
        descripcion: desc,
        estado: 'Pendiente', // Estado inicial obligatorio por defecto
        fecha: new Date().toLocaleDateString('es-CL'), // Fecha actual formato local
        responsable: 'Sin asignar'
      };

      // REQUERIMIENTO ESPECIAL: Verificar si el cliente existe en 'obe_usuarios'
      const usuariosGuardados = localStorage.getItem('obe_usuarios');
      if (usuariosGuardados) {
        const listaUsuarios: Usuario[] = JSON.parse(usuariosGuardados);
        // Buscamos si existe un usuario que coincida por nombre o RUT (simulado en el correo/id o nombre)
        const clienteExiste = listaUsuarios.some(
          u => u.nombre.toLowerCase() === nom.toLowerCase() && u.rol === 'Cliente'
        );

        if (!clienteExiste) {
          // Si no existe, lo agregamos automáticamente al sistema con datos simulados/insertados
          const nuevoUsuarioCliente: Usuario = {
            id: crypto.randomUUID(),
            nombre: nom,
            correo: `${nom.toLowerCase().replace(/\s+/g, '')}@cliente.cl`, // Generado dinámicamente
            telefono: '+56900000000',
            rol: 'Cliente',
            activo: true,
            password: 'cliente123'
          };
          const nuevaListaUsuarios = [...listaUsuarios, nuevoUsuarioCliente];
          localStorage.setItem('obe_usuarios', JSON.stringify(nuevaListaUsuarios));
        }
      }

      guardarDatos([...cotizaciones, nuevaCotizacion]);
    }

    // Limpiar formulario al terminar
    setNombreCliente('');
    setRutCliente('');
    setDescripcion('');
    setEstado('Pendiente');
    setResponsable('Sin asignar');
  };

  // --- 5. PREPARAR EDICIÓN ---
  const editarCotizacion = (c: Cotizacion) => {
    setIdEditando(c.id);
    setNombreCliente(c.nombreCliente);
    setRutCliente(c.rutCliente);
    setDescripcion(c.descripcion);
    setEstado(c.estado);
    setResponsable(c.responsable);
    setError('');
  };

  // --- 6. ASIGNAR RESPONSABLE ADMINISTRADOR EN VIVO ---
  const asignarAdministradorLogueado = (id: string) => {
    if (usuarioActual) {
      const actualizadas = cotizaciones.map(c =>
        c.id === id ? { ...c, responsable: usuarioActual.nombre } : c
      );
      guardarDatos(actualizadas);
    }
  };

  // --- 7. ELIMINAR COTIZACIÓN (Permanente) ---
  const eliminarCotizacion = (id: string) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar esta solicitud de cotización permanentemente?');
    if (confirmar) {
      const actualizadas = cotizaciones.filter(c => c.id !== id);
      guardarDatos(actualizadas);

      if (idEditando === id) {
        setIdEditando(null);
        setNombreCliente('');
        setRutCliente('');
        setDescripcion('');
        setEstado('Pendiente');
        setResponsable('Sin asignar');
        setError('');
      }
    }
  };

  // --- 8. FILTRADO Y BÚSQUEDA ---
  const cotizacionesFiltradas = cotizaciones.filter(c => {
    const cumpleEstado = filtroEstado === 'Todos' || c.estado === filtroEstado;
    const cumpleTexto =
      c.nombreCliente.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      c.rutCliente.includes(filtroTexto);
    return cumpleEstado && cumpleTexto;
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Gestión de Solicitudes de Cotización</h2>

      {/* SECCIÓN: Formulario */}
      <form noValidate onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxWidth: '500px' }}>
        <h3>{idEditando ? 'Editar Cotización' : 'Nueva Solicitud'}</h3>

        {error && <p style={{ color: '#d32f2f', fontWeight: 'bold', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Nombre completo del cliente" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} />
          <input type="text" placeholder="RUT Cliente (ej: 12345678-9)" value={rutCliente} onChange={e => setRutCliente(e.target.value)} />
          <textarea placeholder="Descripción de los servicios o productos a cotizar" rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />

          {/* Estos campos solo se controlan si se está editando para cambiar estados/responsables */}
          {idEditando && (
            <>
              <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Cambiar Estado:</label>
              <select value={estado} onChange={e => setEstado(e.target.value as EstadoCotizacion)}>
                <option value="Pendiente">Pendiente</option>
                <option value="En revisión">En revisión</option>
                <option value="Contactado">Contactado</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>

              <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Responsable Seguimiento:</label>
              <input type="text" placeholder="Responsable" value={responsable} onChange={e => setResponsable(e.target.value)} />
            </>
          )}

          <button type="submit" style={{ background: '#ff922d', color: '#000', padding: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
            {idEditando ? 'Guardar Cambios' : 'Registrar Cotización'}
          </button>

          {idEditando && (
            <button type="button" onClick={() => { setIdEditando(null); setNombreCliente(''); setRutCliente(''); setDescripcion(''); setEstado('Pendiente'); setResponsable('Sin asignar'); setError(''); }} style={{ padding: '8px', marginTop: '5px', background: '#ccc', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      {/* SECCIÓN: Filtros y Búsqueda */}
      <div style={{ background: '#e0e0e0', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <strong>Filtrar resultados:</strong>
        <input type="text" placeholder="Buscar por Cliente o RUT..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '250px' }} />
        
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ padding: '6px', borderRadius: '4px' }}>
          <option value="Todos">Todos los Estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En revisión">En revisión</option>
          <option value="Contactado">Contactado</option>
          <option value="Finalizado">Finalizado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {/* SECCIÓN: Tabla */}
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: '#333', color: 'white' }}>
          <tr>
            <th style={{ padding: '10px' }}>Fecha</th>
            <th style={{ padding: '10px' }}>Cliente</th>
            <th style={{ padding: '10px' }}>RUT</th>
            <th style={{ padding: '10px' }}>Descripción</th>
            <th style={{ padding: '10px' }}>Estado</th>
            <th style={{ padding: '10px' }}>Responsable</th>
            <th style={{ padding: '10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cotizacionesFiltradas.map(c => (
            <tr key={c.id}>
              <td style={{ padding: '10px' }}>{c.fecha}</td>
              <td style={{ padding: '10px' }}>{c.nombreCliente}</td>
              <td style={{ padding: '10px' }}>{c.rutCliente}</td>
              <td style={{ padding: '10px' }}>{c.descripcion}</td>
              <td style={{ padding: '10px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  background: c.estado === 'Pendiente' ? '#fff3cd' : c.estado === 'Finalizado' ? '#d4edda' : c.estado === 'Cancelado' ? '#f8d7da' : '#d1ecf1',
                  color: c.estado === 'Pendiente' ? '#856404' : c.estado === 'Finalizado' ? '#155724' : c.estado === 'Cancelado' ? '#721c24' : '#0c5460'
                }}>
                  {c.estado}
                </span>
              </td>
              <td style={{ padding: '10px' }}>
                <strong>{c.responsable}</strong>
              </td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => editarCotizacion(c)} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>Editar</button>
                
                <button 
                  onClick={() => asignarAdministradorLogueado(c.id)} 
                  style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer', background: '#4caf50', color: 'white', border: 'none', borderRadius: '3px' }}
                >
                  Asignarme
                </button>
                
                <button onClick={() => eliminarCotizacion(c.id)} style={{ padding: '5px 10px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {cotizacionesFiltradas.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>No se encontraron solicitudes de cotización.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}