import { useState, useEffect } from 'react';
import type { Noticia, Proyecto } from '../types/types';
import { useAuth } from '../context/AuthContext';

export default function GestionNoticias() {
  const { usuarioActual } = useAuth(); // Para autocompletar el autor con la sesión activa

  // --- 1. ESTADOS (Hooks) ---
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [autor, setAutor] = useState('');
  const [proyectoRelacionado, setProyectoRelacionado] = useState('');
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [imagenUrl, setImagenUrl] = useState('');

  // Estados para Filtros y Búsqueda
  const [filtroTexto, setFiltroTexto] = useState('');

  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [error, setError] = useState('');

  // --- 2. EFECTO: Cargar noticias y proyectos al iniciar ---
  useEffect(() => {
    const datosGuardados = localStorage.getItem('obe_noticias');
    if (datosGuardados) {
      setNoticias(JSON.parse(datosGuardados));
    } else {
      const inicial: Noticia[] = [
        {
          id: '1',
          titulo: 'Iniciamos la renovación de nuestras oficinas centrales',
          contenido: 'Esta semana comenzamos el proyecto de remodelación de nuestras oficinas administrativas, con el objetivo de mejorar los espacios de trabajo de todo el equipo.',
          imagenes: [],
          fecha: new Date().toLocaleDateString('es-CL'),
          autor: 'Luis',
          proyectoRelacionado: 'Renovación Oficinas Centrales',
        },
      ];
      setNoticias(inicial);
      localStorage.setItem('obe_noticias', JSON.stringify(inicial));
    }

    // Cargamos los proyectos existentes solo para llenar el selector de "proyecto relacionado"
    const proyectosGuardados = localStorage.getItem('obe_proyectos');
    if (proyectosGuardados) {
      setProyectos(JSON.parse(proyectosGuardados));
    }
  }, []);

  // --- 3. EFECTO: Autocompletar el autor con el usuario en sesión ---
  useEffect(() => {
    if (usuarioActual && !idEditando) {
      setAutor(usuarioActual.nombre);
    }
  }, [usuarioActual, idEditando]);

  // --- 4. FUNCIÓN REUTILIZABLE: Guardar en Estado y LocalStorage ---
  const guardarDatos = (nuevaLista: Noticia[]) => {
    setNoticias(nuevaLista);
    localStorage.setItem('obe_noticias', JSON.stringify(nuevaLista));
  };

  // --- 5. MANEJO DE IMÁGENES (lista dinámica de URLs) ---
  const agregarImagen = () => {
    const url = imagenUrl.trim();
    if (!url) return;
    setImagenes([...imagenes, url]);
    setImagenUrl('');
  };

  const quitarImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  // Subir imagen desde el computador (se convierte a Base64 para poder guardarla en localStorage)
  const agregarImagenDesdeArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validación: limitamos el tamaño para no llenar el localStorage del navegador
    if (archivo.size > 2 * 1024 * 1024) {
      setError('La imagen es muy pesada (máximo 2MB). Usa una imagen más liviana.');
      e.target.value = '';
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      if (typeof lector.result === 'string') {
        setImagenes(prev => [...prev, lector.result as string]);
      }
    };
    lector.readAsDataURL(archivo);
    e.target.value = '';
  };

  // --- 6. CREAR O ACTUALIZAR NOTICIA ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const tit = titulo.trim();
    const cont = contenido.trim();
    const aut = autor.trim();

    // A. Validación de campos obligatorios
    if (!tit || !cont || !aut) {
      setError('Título, contenido y autor son obligatorios.');
      return;
    }

    // B. Validación de longitud mínima del título
    if (tit.length < 5) {
      setError('El título debe tener al menos 5 caracteres.');
      return;
    }

    // C. Validación de longitud mínima del contenido
    if (cont.length < 20) {
      setError('El contenido debe tener al menos 20 caracteres.');
      return;
    }

    // --- PROCESO DE GUARDADO ---
    if (idEditando) {
      // Actualizar noticia existente (la fecha original no se modifica)
      const actualizadas = noticias.map(n =>
        n.id === idEditando
          ? { ...n, titulo: tit, contenido: cont, autor: aut, proyectoRelacionado: proyectoRelacionado || undefined, imagenes }
          : n
      );
      guardarDatos(actualizadas);
      setIdEditando(null);
    } else {
      // Crear nueva noticia (con fecha automática del día)
      const nuevaNoticia: Noticia = {
        id: crypto.randomUUID(),
        titulo: tit,
        contenido: cont,
        imagenes,
        fecha: new Date().toLocaleDateString('es-CL'),
        autor: aut,
        proyectoRelacionado: proyectoRelacionado || undefined,
      };
      guardarDatos([...noticias, nuevaNoticia]);
    }

    // Limpiar formulario al terminar
    setTitulo('');
    setContenido('');
    setProyectoRelacionado('');
    setImagenes([]);
    setImagenUrl('');
  };

  // --- 7. PREPARAR EDICIÓN ---
  const editarNoticia = (n: Noticia) => {
    setIdEditando(n.id);
    setTitulo(n.titulo);
    setContenido(n.contenido);
    setAutor(n.autor);
    setProyectoRelacionado(n.proyectoRelacionado || '');
    setImagenes(n.imagenes);
    setError('');
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setTitulo('');
    setContenido('');
    setProyectoRelacionado('');
    setImagenes([]);
    setImagenUrl('');
    setError('');
    if (usuarioActual) setAutor(usuarioActual.nombre);
  };

  // --- 8. ELIMINAR NOTICIA (Permanente) ---
  const eliminarNoticia = (id: string) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar esta noticia permanentemente? Esta acción no se puede deshacer.');
    if (confirmar) {
      const actualizadas = noticias.filter(n => n.id !== id);
      guardarDatos(actualizadas);
      if (idEditando === id) cancelarEdicion();
    }
  };

  // --- 9. FILTRADO Y BÚSQUEDA ---
  const noticiasFiltradas = noticias.filter(n => {
    const texto = filtroTexto.toLowerCase();
    return n.titulo.toLowerCase().includes(texto) || n.autor.toLowerCase().includes(texto);
  });

  // --- RENDERIZADO (UI) ---
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Gestión de Noticias</h2>

      {/* SECCIÓN: Formulario */}
      <form noValidate onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxWidth: '500px' }}>
        <h3>{idEditando ? 'Editar Noticia' : 'Nueva Noticia'}</h3>

        {error && <p style={{ color: '#d32f2f', fontWeight: 'bold', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Título de la noticia" value={titulo} onChange={e => setTitulo(e.target.value)} />
          <textarea placeholder="Contenido de la noticia" rows={4} value={contenido} onChange={e => setContenido(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input type="text" placeholder="Autor" value={autor} onChange={e => setAutor(e.target.value)} />

          <select value={proyectoRelacionado} onChange={e => setProyectoRelacionado(e.target.value)}>
            <option value="">Sin proyecto relacionado</option>
            {proyectos.map(p => (
              <option key={p.id} value={p.nombre}>{p.nombre}</option>
            ))}
          </select>

          {/* Manejo de imágenes: por URL (internet) o subiendo un archivo (local) */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="URL de imagen (internet)" value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} style={{ flex: 1 }} />
            <button type="button" onClick={agregarImagen} style={{ padding: '8px 12px', cursor: 'pointer' }}>Agregar URL</button>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '4px' }}>O sube una imagen desde tu computador:</label>
            <input type="file" accept="image/*" onChange={agregarImagenDesdeArchivo} />
          </div>

          {imagenes.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {imagenes.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img} alt={`imagen ${i + 1}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc', display: 'block' }} />
                  <button
                    type="button"
                    onClick={() => quitarImagen(i)}
                    title="Quitar imagen"
                    style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', lineHeight: '20px', padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="submit" style={{ background: '#ff922d', color: '#000', padding: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
            {idEditando ? 'Guardar Cambios' : 'Publicar Noticia'}
          </button>

          {idEditando && (
            <button type="button" onClick={cancelarEdicion} style={{ padding: '8px', marginTop: '5px', background: '#ccc', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      {/* SECCIÓN: Filtros y Búsqueda */}
      <div style={{ background: '#e0e0e0', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <strong>Filtrar resultados:</strong>
        <input type="text" placeholder="Buscar por título o autor..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '250px' }} />
      </div>

      {/* SECCIÓN: Tabla */}
      <table border={1} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: '#333', color: 'white' }}>
          <tr>
            <th style={{ padding: '10px' }}>Fecha</th>
            <th style={{ padding: '10px' }}>Título</th>
            <th style={{ padding: '10px' }}>Contenido</th>
            <th style={{ padding: '10px' }}>Imágenes</th>
            <th style={{ padding: '10px' }}>Autor</th>
            <th style={{ padding: '10px' }}>Proyecto Relacionado</th>
            <th style={{ padding: '10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {noticiasFiltradas.map(n => (
            <tr key={n.id}>
              <td style={{ padding: '10px' }}>{n.fecha}</td>
              <td style={{ padding: '10px' }}>{n.titulo}</td>
              <td style={{ padding: '10px' }}>
                {n.contenido.length > 60 ? `${n.contenido.slice(0, 60)}...` : n.contenido}
              </td>
              <td style={{ padding: '10px' }}>
                {n.imagenes.length > 0 ? (
                  <span>
                    <img src={n.imagenes[0]} alt={n.titulo} style={{ width: '40px', height: '40px', objectFit: 'cover', verticalAlign: 'middle', marginRight: '6px', borderRadius: '4px' }} onError={e => (e.currentTarget.style.display = 'none')} />
                    {n.imagenes.length > 1 ? `+${n.imagenes.length - 1} más` : ''}
                  </span>
                ) : (
                  <span style={{ color: '#999' }}>Sin imagen</span>
                )}
              </td>
              <td style={{ padding: '10px' }}>{n.autor}</td>
              <td style={{ padding: '10px' }}>{n.proyectoRelacionado || <span style={{ color: '#999' }}>—</span>}</td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => editarNoticia(n)} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>Editar</button>

                <button onClick={() => eliminarNoticia(n.id)} style={{ padding: '5px 10px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {noticiasFiltradas.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>No se encontraron noticias.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
