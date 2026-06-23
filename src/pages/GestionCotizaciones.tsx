import { useState, useEffect } from 'react';
import type { Cotizacion, EstadoCotizacion, Usuario } from '../types/types';
import { useAuth } from '../context/AuthContext';

export default function GestionCotizaciones() {
  const { usuarioActual } = useAuth(); 

  // --- ESTADOS ---
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [nombreCliente, setNombreCliente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState<EstadoCotizacion>('Pendiente');
  const [responsable, setResponsable] = useState('Sin asignar');
  
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Estados para la ventana flotante
  const [sugerencias, setSugerencias] = useState<Usuario[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Cargar datos
  useEffect(() => {
    const datosGuardados = localStorage.getItem('obe_cotizaciones');
    if (datosGuardados) setCotizaciones(JSON.parse(datosGuardados));
  }, []);

  const guardarDatos = (nuevaLista: Cotizacion[]) => {
    setCotizaciones(nuevaLista);
    localStorage.setItem('obe_cotizaciones', JSON.stringify(nuevaLista));
  };

  // --- LÓGICA DE BÚSQUEDA (Solo por Nombre) ---
  const buscarCoincidencias = (texto: string) => {
    if (texto.trim().length < 2) {
      setMostrarSugerencias(false);
      setSugerencias([]);
      return;
    }

    const usuariosGuardados = localStorage.getItem('obe_usuarios');
    if (usuariosGuardados) {
      const listaUsuarios: Usuario[] = JSON.parse(usuariosGuardados);
      
      // Filtramos SOLO clientes y buscamos coincidencia de nombre
      const coincidencias = listaUsuarios
        .filter(u => u.rol === 'Cliente')
        .filter(c => c.nombre.toLowerCase().includes(texto.toLowerCase()));

      setSugerencias(coincidencias);
      setMostrarSugerencias(coincidencias.length > 0);
    }
  };

  const handleChangeNombre = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNombreCliente(e.target.value);
    buscarCoincidencias(e.target.value);
  };

  const seleccionarSugerencia = (cliente: Usuario) => {
    setNombreCliente(cliente.nombre);
    setMostrarSugerencias(false); 
  };

  // --- CREAR O ACTUALIZAR ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombreCliente.trim() || !descripcion.trim()) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (idEditando) {
      const actualizadas = cotizaciones.map(c =>
        c.id === idEditando ? { ...c, nombreCliente, descripcion, estado, responsable } : c
      );
      guardarDatos(actualizadas);
      setIdEditando(null);
    } else {
      const nuevaCotizacion: Cotizacion = {
        id: crypto.randomUUID(),
        nombreCliente,
        descripcion,
        estado: 'Pendiente',
        fecha: new Date().toLocaleDateString('es-CL'),
        responsable: 'Sin asignar'
      };

      // Si el cliente no existe, lo creamos (sin RUT)
      const usuariosGuardados = localStorage.getItem('obe_usuarios');
      if (usuariosGuardados) {
        const listaUsuarios: Usuario[] = JSON.parse(usuariosGuardados);
        const clienteExiste = listaUsuarios.some(u => u.nombre.toLowerCase() === nombreCliente.toLowerCase() && u.rol === 'Cliente');

        if (!clienteExiste) {
          const nuevoUsuarioCliente: Usuario = {
            id: crypto.randomUUID(),
            nombre: nombreCliente,
            correo: `${nombreCliente.toLowerCase().replace(/\s+/g, '')}@cliente.cl`,
            telefono: '+56900000000',
            rol: 'Cliente',
            activo: true,
            password: 'cliente123'
          };
          localStorage.setItem('obe_usuarios', JSON.stringify([...listaUsuarios, nuevoUsuarioCliente]));
        }
      }
      guardarDatos([...cotizaciones, nuevaCotizacion]);
    }

    setNombreCliente('');
    setDescripcion('');
    setEstado('Pendiente');
    setResponsable('Sin asignar');
  };

  const editarCotizacion = (c: Cotizacion) => {
    setIdEditando(c.id);
    setNombreCliente(c.nombreCliente);
    setDescripcion(c.descripcion);
    setEstado(c.estado);
    setResponsable(c.responsable);
    setError('');
    setMostrarSugerencias(false);
  };

  const asignarAdministradorLogueado = (id: string) => {
    if (usuarioActual) {
      const actualizadas = cotizaciones.map(c => c.id === id ? { ...c, responsable: usuarioActual.nombre } : c);
      guardarDatos(actualizadas);
    }
  };

  const eliminarCotizacion = (id: string) => {
    if (window.confirm('¿Eliminar esta solicitud permanentemente?')) {
      guardarDatos(cotizaciones.filter(c => c.id !== id));
    }
  };

  const cotizacionesFiltradas = cotizaciones.filter(c => {
    const cumpleEstado = filtroEstado === 'Todos' || c.estado === filtroEstado;
    const cumpleTexto = c.nombreCliente.toLowerCase().includes(filtroTexto.toLowerCase());
    return cumpleEstado && cumpleTexto;
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Gestión de Solicitudes de Cotización</h2>

      <form noValidate onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxWidth: '500px' }}>
        <h3>{idEditando ? 'Editar Cotización' : 'Nueva Solicitud'}</h3>
        {error && <p style={{ color: '#d32f2f', fontWeight: 'bold', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <input 
            type="text" 
            placeholder="Nombre completo del cliente" 
            value={nombreCliente} 
            onChange={handleChangeNombre} 
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
            autoComplete="off"
          />

          {/* VENTANA FLOTANTE */}
          {mostrarSugerencias && (
            <div style={{
              position: 'absolute',
              top: '40px', // Ajustado a la posición de un solo input
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #ff922d',
              borderRadius: '4px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              maxHeight: '180px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              <div style={{ padding: '5px 10px', background: '#ff922d', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                Clientes encontrados (Clic para autorrellenar):
              </div>
              {sugerencias.map(cliente => (
                <div 
                  key={cliente.id} 
                  onClick={() => seleccionarSugerencia(cliente)}
                  style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fcf8f2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                >
                  <strong style={{ color: '#333' }}>{cliente.nombre}</strong><br/>
                  <small style={{ color: '#666' }}>{cliente.correo}</small>
                </div>
              ))}
            </div>
          )}

          <textarea placeholder="Descripción de los servicios a cotizar" rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />

          {idEditando && (
            <>
              <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Cambiar Estado:</label>
              <select value={estado} onChange={e => setEstado(e.target.value as EstadoCotizacion)} style={{ padding: '8px' }}>
                <option value="Pendiente">Pendiente</option>
                <option value="En revisión">En revisión</option>
                <option value="Contactado">Contactado</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </>
          )}

          <button type="submit" style={{ background: '#ff922d', color: '#000', padding: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
            {idEditando ? 'Guardar Cambios' : 'Registrar Cotización'}
          </button>
        </div>
      </form>

      {/* FILTROS */}
      <div style={{ background: '#e0e0e0', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <strong>Filtrar resultados:</strong>
        <input type="text" placeholder="Buscar por Cliente..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '250px' }} />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ padding: '6px', borderRadius: '4px' }}>
          <option value="Todos">Todos los Estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En revisión">En revisión</option>
          <option value="Contactado">Contactado</option>
          <option value="Finalizado">Finalizado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {/* TABLA */}
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: '#333', color: 'white' }}>
          <tr>
            <th style={{ padding: '10px' }}>Fecha</th>
            <th style={{ padding: '10px' }}>Cliente</th>
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
              <td style={{ padding: '10px' }}>{c.descripcion}</td>
              <td style={{ padding: '10px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', background: c.estado === 'Pendiente' ? '#fff3cd' : c.estado === 'Finalizado' ? '#d4edda' : c.estado === 'Cancelado' ? '#f8d7da' : '#d1ecf1', color: c.estado === 'Pendiente' ? '#856404' : c.estado === 'Finalizado' ? '#155724' : c.estado === 'Cancelado' ? '#721c24' : '#0c5460' }}>
                  {c.estado}
                </span>
              </td>
              <td style={{ padding: '10px' }}><strong>{c.responsable}</strong></td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => editarCotizacion(c)} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>Editar</button>
                <button onClick={() => asignarAdministradorLogueado(c.id)} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer', background: '#4caf50', color: 'white', border: 'none', borderRadius: '3px' }}>Asignarme</button>
                <button onClick={() => eliminarCotizacion(c.id)} style={{ padding: '5px 10px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}>Eliminar</button>
              </td>
            </tr>
          ))}
          {cotizacionesFiltradas.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No se encontraron solicitudes de cotización.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}