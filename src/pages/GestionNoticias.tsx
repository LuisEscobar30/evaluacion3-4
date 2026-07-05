import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Noticia, Proyecto } from '../types/types';
import { useAuth } from '../context/AuthContext';

export default function GestionNoticias() {
  const { usuarioActual } = useAuth();

  // --- 1. ESTADOS ---
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [autor, setAutor] = useState('');
  const [proyectoRelacionado, setProyectoRelacionado] = useState('');
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [imagenUrl, setImagenUrl] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  // --- 2. EFECTO: Cargar noticias y proyectos desde Firestore ---
  useEffect(() => {
    cargarNoticias();
    cargarProyectos();
  }, []);

  // --- 3. EFECTO: Autocompletar el autor ---
  useEffect(() => {
    if (usuarioActual && !idEditando) {
      setAutor(usuarioActual.nombre);
    }
  }, [usuarioActual, idEditando]);

  const cargarNoticias = async () => {
    try {
      setCargando(true);
      const snapshot = await getDocs(collection(db, 'noticias'));
      const lista: Noticia[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Noticia));
      setNoticias(lista);
    } catch (err) {
      setError('Error al cargar las noticias.');
    } finally {
      setCargando(false);
    }
  };

  const cargarProyectos = async () => {
    try {
      // Solo se carga para llenar el selector "proyecto relacionado" — nunca se escribe acá
      const snapshot = await getDocs(collection(db, 'proyectos'));
      const lista: Proyecto[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Proyecto));
      setProyectos(lista);
    } catch (err) {
      console.error('Error al cargar proyectos para el selector');
    }
  };

  // --- 4. MANEJO DE IMÁGENES ---
  const agregarImagen = () => {
    const url = imagenUrl.trim();
    if (!url) return;
    setImagenes([...imagenes, url]);
    setImagenUrl('');
  };

  const quitarImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const agregarImagenDesdeArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > 2 * 1024 * 1024) {
      setError('La imagen es muy pesada (máximo 2MB).');
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

  // --- 5. CREAR O ACTUALIZAR ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const tit = titulo.trim();
    const cont = contenido.trim();
    const aut = autor.trim();

    if (!tit || !cont || !aut) { setError('Título, contenido y autor son obligatorios.'); return; }
    if (tit.length < 5) { setError('El título debe tener al menos 5 caracteres.'); return; }
    if (cont.length < 20) { setError('El contenido debe tener al menos 20 caracteres.'); return; }

    try {
      if (idEditando) {
        // Al editar: NO se pisa la fecha original
        await updateDoc(doc(db, 'noticias', idEditando), {
          titulo: tit, contenido: cont, autor: aut,
          proyectoRelacionado: proyectoRelacionado || '', imagenes
        });
        setIdEditando(null);
      } else {
        // Al crear: se guarda la fecha de hoy
        await addDoc(collection(db, 'noticias'), {
          titulo: tit, contenido: cont, imagenes,
          fecha: new Date().toLocaleDateString('es-CL'),
          autor: aut,
          proyectoRelacionado: proyectoRelacionado || ''
        });
      }
      await cargarNoticias();
      setTitulo(''); setContenido(''); setProyectoRelacionado(''); setImagenes([]); setImagenUrl('');
      if (usuarioActual) setAutor(usuarioActual.nombre);
    } catch (err) {
      setError('Error al guardar la noticia.');
    }
  };

  // --- 6. EDITAR ---
  const editarNoticia = (n: Noticia) => {
    setIdEditando(n.id);
    setTitulo(n.titulo); setContenido(n.contenido); setAutor(n.autor);
    setProyectoRelacionado(n.proyectoRelacionado || ''); setImagenes(n.imagenes); setError('');
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setTitulo(''); setContenido(''); setProyectoRelacionado(''); setImagenes([]); setImagenUrl(''); setError('');
    if (usuarioActual) setAutor(usuarioActual.nombre);
  };

  // --- 7. ELIMINAR ---
  const eliminarNoticia = async (id: string) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar esta noticia permanentemente?');
    if (confirmar) {
      try {
        await deleteDoc(doc(db, 'noticias', id));
        await cargarNoticias();
        if (idEditando === id) cancelarEdicion();
      } catch (err) {
        setError('Error al eliminar la noticia.');
      }
    }
  };

  // --- 8. FILTRADO ---
  const noticiasFiltradas = noticias.filter(n => {
    const texto = filtroTexto.toLowerCase();
    return n.titulo.toLowerCase().includes(texto) || n.autor.toLowerCase().includes(texto);
  });

  // --- RENDERIZADO ---
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Gestión de Noticias</h2>

      <form noValidate onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxWidth: '500px' }}>
        <h3>{idEditando ? 'Editar Noticia' : 'Nueva Noticia'}</h3>
        {error && <p style={{ color: '#d32f2f', fontWeight: 'bold', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Título de la noticia" value={titulo} onChange={e => setTitulo(e.target.value)} />
          <textarea placeholder="Contenido de la noticia" rows={4} value={contenido} onChange={e => setContenido(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input type="text" placeholder="Autor" value={autor} onChange={e => setAutor(e.target.value)} />

          <select value={proyectoRelacionado} onChange={e => setProyectoRelacionado(e.target.value)}>
            <option value="">Sin proyecto relacionado</option>
            {proyectos.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>

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
                  <button type="button" onClick={() => quitarImagen(i)} title="Quitar imagen" style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', lineHeight: '20px', padding: 0 }}>×</button>
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

      <div style={{ background: '#e0e0e0', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <strong>Filtrar:</strong>
        <input type="text" placeholder="Buscar por título o autor..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '250px' }} />
      </div>

      {cargando ? (
        <p>Cargando noticias...</p>
      ) : (
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
                <td style={{ padding: '10px' }}>{n.contenido.length > 60 ? `${n.contenido.slice(0, 60)}...` : n.contenido}</td>
                <td style={{ padding: '10px' }}>
                  {n.imagenes.length > 0 ? (
                    <span>
                      <img src={n.imagenes[0]} alt={n.titulo} style={{ width: '40px', height: '40px', objectFit: 'cover', verticalAlign: 'middle', marginRight: '6px', borderRadius: '4px' }} onError={e => (e.currentTarget.style.display = 'none')} />
                      {n.imagenes.length > 1 ? `+${n.imagenes.length - 1} más` : ''}
                    </span>
                  ) : <span style={{ color: '#999' }}>Sin imagen</span>}
                </td>
                <td style={{ padding: '10px' }}>{n.autor}</td>
                <td style={{ padding: '10px' }}>{n.proyectoRelacionado || <span style={{ color: '#999' }}>—</span>}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => editarNoticia(n)} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>Editar</button>
                  <button onClick={() => eliminarNoticia(n.id)} style={{ padding: '5px 10px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}>Eliminar</button>
                </td>
              </tr>
            ))}
            {noticiasFiltradas.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>No se encontraron noticias.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
